import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Divider, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import PauseOutlinedIcon from "@mui/icons-material/PauseOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { useNavigate, useParams } from "react-router";
import CanAccess from "../../../components/rbac/CanAccess";
import PageHeader from "../../../components/page/PageHeader";
import SlaPolicyForm from "../components/SlaPolicyForm";
import SlaTestDrawer from "../components/SlaTestDrawer";
import slaApi from "../services/sla.api";
import { SLA_PERMISSIONS, SLA_ROUTES } from "../config/sla.config";
import { formatDurationMinutes } from "../utils/slaFormatters";

export default function SlaPolicyDetailPage() {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [nextPolicy, nextRules] = await Promise.all([
        slaApi.getPolicy(policyId),
        slaApi.listRules(policyId),
      ]);
      setPolicy(nextPolicy);
      setRules((nextRules ?? []).map((rule) => ({
        fieldValueKey: rule.field_value_key,
        resolutionMinutes: rule.resolution_minutes,
        isEnabled: rule.is_enabled,
        id: rule.id,
      })));
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? requestError.message ?? "Unable to load policy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [policyId]);

  const initialValues = useMemo(() => policy ? ({
    code: policy.code,
    name: policy.name,
    description: policy.description ?? "",
    triggerFieldKey: policy.trigger_field_key,
    triggerValueKey: policy.trigger_value_key,
    durationFieldKey: policy.duration_field_key,
    calendarId: policy.calendar_id,
    priority: policy.priority,
    effectiveFrom: policy.effective_from?.slice(0, 16) ?? "",
    effectiveTo: policy.effective_to?.slice(0, 16) ?? "",
    isActive: policy.is_active,
    rules,
  }) : undefined, [policy, rules]);

  const save = async (values) => {
    await slaApi.updatePolicy(policyId, {
      code: values.code,
      name: values.name,
      description: values.description || null,
      triggerFieldKey: values.triggerFieldKey,
      triggerValueKey: values.triggerValueKey,
      durationFieldKey: values.durationFieldKey,
      calendarId: values.calendarId,
      priority: Number(values.priority),
      effectiveFrom: new Date(values.effectiveFrom).toISOString(),
      effectiveTo: values.effectiveTo ? new Date(values.effectiveTo).toISOString() : null,
      isActive: values.isActive,
    });
    const existing = new Map(rules.map((rule) => [rule.id, rule]));
    for (const rule of values.rules ?? []) {
      if (rule.id) {
        await slaApi.updateRule(policyId, rule.id, {
          fieldValueKey: rule.fieldValueKey,
          resolutionMinutes: rule.resolutionMinutes,
          isEnabled: rule.isEnabled,
        });
        existing.delete(rule.id);
      } else {
        await slaApi.createRule(policyId, {
          fieldValueKey: rule.fieldValueKey,
          resolutionMinutes: rule.resolutionMinutes,
          isEnabled: rule.isEnabled,
        });
      }
    }
    for (const stale of existing.values()) {
      await slaApi.deleteRule(policyId, stale.id);
    }
    await load();
  };

  if (loading) return <Typography>Loading SLA policy…</Typography>;
  if (!policy) return <Alert severity="error">{error || "SLA policy not found."}</Alert>;

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={policy.name}
        description={`${policy.code} · ${policy.is_active ? "Active" : "Inactive"}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(SLA_ROUTES.policies)}>Back</Button>
            <CanAccess permission={SLA_PERMISSIONS.read}>
              <Button variant="outlined" startIcon={<ScienceOutlinedIcon />} onClick={() => setTestOpen(true)}>Test SLA</Button>
            </CanAccess>
            <CanAccess permission={SLA_PERMISSIONS.activate}>
              <Button
                variant="contained"
                startIcon={policy.is_active ? <PauseOutlinedIcon /> : <PlayArrowOutlinedIcon />}
                onClick={async () => {
                  if (policy.is_active) await slaApi.deactivatePolicy(policyId);
                  else await slaApi.activatePolicy(policyId);
                  await load();
                }}
              >
                {policy.is_active ? "Deactivate" : "Activate"}
              </Button>
            </CanAccess>
          </Stack>
        }
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Paper variant="outlined">
        <Tabs value={tab} onChange={(_, value) => setTab(value)} aria-label="SLA policy sections">
          <Tab label="Configuration" />
          <Tab label="Resolution rules" />
          <Tab label="Calendar" />
        </Tabs>
        <Divider />
        {tab === 0 ? <Stack sx={{ p: 2.5 }}><SlaPolicyForm initialValues={initialValues} onSubmit={save} submitLabel="Save policy" /></Stack> : null}
        {tab === 1 ? (
          <Stack spacing={1} sx={{ p: 2.5 }}>
            {rules.length ? rules.map((rule) => (
              <Stack key={rule.id} direction="row" justifyContent="space-between" sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                <Typography>{rule.fieldValueKey}</Typography>
                <Typography fontWeight={700}>{rule.resolutionMinutes ? formatDurationMinutes(rule.resolutionMinutes) : "Not tracked"}</Typography>
              </Stack>
            )) : <Typography color="text.secondary">No resolution rules have been configured.</Typography>}
          </Stack>
        ) : null}
        {tab === 2 ? (
          <Stack spacing={1} sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>{policy.calendar_name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {policy.calendar_timezone} · {policy.business_hours_per_day} hours/day · {policy.workday_start_time}–{policy.workday_end_time}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Saturday: {policy.include_saturday ? "included" : "excluded"} · Sunday: {policy.include_sunday ? "included" : "excluded"}
            </Typography>
          </Stack>
        ) : null}
      </Paper>
      <SlaTestDrawer open={testOpen} onClose={() => setTestOpen(false)} calendarId={policy.calendar_id} />
    </Stack>
  );
}
