import { useContext } from "react";
import { AppConfigContext } from "./AppConfigContextValue";

export function useAppConfig() {
  const context = useContext(AppConfigContext);

  if (!context) {
    throw new Error("useAppConfig must be used inside AppConfigProvider.");
  }

  return context;
}