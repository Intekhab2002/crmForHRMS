import { SLA_DEFAULTS, SLA_FIELD_REGISTRY } from "./sla.constants.js";

export default Object.freeze({
    defaults: SLA_DEFAULTS,
    supportedFields: Object.freeze(Object.keys(SLA_FIELD_REGISTRY)),
    fieldRegistry: SLA_FIELD_REGISTRY,
});
