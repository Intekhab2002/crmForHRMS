import AppError from "../../helpers/AppError.js";
import repository from "./sla.repository.js";
import config from "./sla.config.js";
import { SLA_ERROR_CODES } from "./sla.constants.js";

function assertField(key) {
  if (!config.supportedFields.includes(key)) {
    throw new AppError({
      message: `Unsupported SLA field: ${key}`,
      statusCode: 422,
      code: SLA_ERROR_CODES.FIELD_NOT_SUPPORTED,
    });
  }
}
async function requirePolicy(id, tx = null) {
  const item = await repository.onePolicy(id, tx);
  if (!item)
    throw AppError.notFound("SLA policy not found.", {
      code: SLA_ERROR_CODES.POLICY_NOT_FOUND,
    });
  return item;
}
async function list(options = {}) {
  return repository.listPolicies(options);
}
async function getById(id) {
  return requirePolicy(id);
}
async function create(data, actorUserId, tx = null) {
  assertField(data.triggerFieldKey);
  assertField(data.durationFieldKey);
  return repository.createPolicy(
    {
      ...data,
      actorUserId,
      code: data.code.toLowerCase(),
      triggerValueKey: data.triggerValueKey.toLowerCase(),
    },
    tx,
  );
}
async function update(id, data, actorUserId, tx = null) {
  await requirePolicy(id, tx);
  if (data.triggerFieldKey) assertField(data.triggerFieldKey);
  if (data.durationFieldKey) assertField(data.durationFieldKey);
  const normalized = { ...data, actorUserId };
  if (normalized.code) normalized.code = normalized.code.toLowerCase();
  if (normalized.triggerValueKey)
    normalized.triggerValueKey = normalized.triggerValueKey.toLowerCase();
  return repository.updatePolicy(id, normalized, tx);
}
async function setActive(id, active, actorUserId, tx = null) {
  await requirePolicy(id, tx);
  return repository.setPolicyActive(id, active, actorUserId, tx);
}
async function resolve(field, value, at, tx = null) {
    assertField(field);

    const normalizedValue = String(value ?? "").trim().toLowerCase();

    if (!normalizedValue) {
        return null;
    }

    return repository.applicablePolicy(
        field,
        normalizedValue,
        at,
        tx,
    );
}
export default Object.freeze({
  list,
  getById,
  requirePolicy,
  create,
  update,
  setActive,
  resolve,
});
