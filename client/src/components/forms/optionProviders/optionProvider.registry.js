import { apiOptionProvider } from "../optionProviders/apiOption.provider";
import {
  authenticatedUserOptionProvider,
} from "../optionProviders/authenticatedUser.provider";

export const OPTION_PROVIDERS = Object.freeze({
  api: apiOptionProvider,
  authenticatedUser: authenticatedUserOptionProvider,
});

export function getOptionProvider(source) {
  return OPTION_PROVIDERS[source] ?? null;
}