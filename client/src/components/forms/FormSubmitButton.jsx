import { Button } from "@mui/material";

export default function FormSubmitButton({ children, loading, ...props }) {
  return (
    <Button {...props} type="submit" disabled={loading || props.disabled}>
      {loading ? "Saving..." : children}
    </Button>
  );
}
