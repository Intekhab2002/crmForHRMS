import { useNavigate } from "react-router";
import { Stack } from "@mui/material";
import PageHeader from "../../../components/page/PageHeader";
import SlaPolicyForm from "../components/SlaPolicyForm";
import slaApi from "../services/sla.api";
import { SLA_ROUTES } from "../config/sla.config";

export default function SlaPolicyCreatePage() {
  const navigate = useNavigate();

  const submit = async (values) => {
    const policy = await slaApi.createPolicyConfiguration({
      ...values,
      priority: Number(values.priority),
      rules: values.rules ?? [],
    });

    navigate(SLA_ROUTES.policyDetail(policy.id), { replace: true });
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Create SLA policy"
        description="Create a policy, then activate it when its trigger and resolution rules are ready."
      />
      <SlaPolicyForm onSubmit={submit} />
    </Stack>
  );
}
