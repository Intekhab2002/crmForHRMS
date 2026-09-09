import { useNavigate } from "react-router";
import { Alert, Stack } from "@mui/material";
import PageHeader from "../../../components/page/PageHeader";
import SlaPolicyForm from "../components/SlaPolicyForm";
import slaApi from "../services/sla.api";
import { SLA_ROUTES } from "../config/sla.config";

export default function SlaPolicyCreatePage() {
  const navigate = useNavigate();
  const submit = async (values) => {
    const policy = await slaApi.createPolicy(values);
    for (const rule of values.rules ?? []) {
      await slaApi.createRule(policy.id, {
        fieldValueKey: rule.fieldValueKey,
        resolutionMinutes: rule.resolutionMinutes,
        isEnabled: rule.isEnabled,
      });
    }
    navigate(SLA_ROUTES.policyDetail(policy.id), { replace: true });
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader title="Create SLA policy" description="Create a policy, then activate it when its trigger and resolution rules are ready." />
      <SlaPolicyForm onSubmit={submit} />
    </Stack>
  );
}
