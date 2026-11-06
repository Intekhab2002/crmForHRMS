import AppError from "../../helpers/AppError.js";
import repository from "./sla.repository.js";
import config from "./sla.config.js";
import { SLA_ERROR_CODES } from "./sla.constants.js";
import resolver from "./slaPolicyResolver.service.js";
import { executeTransaction } from "../../database/transaction.js";

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
      code: resolver.normalizeValueKey(data.code),
      triggerValueKey: resolver.normalizeValueKey(data.triggerValueKey),
    },
    tx,
  );
}
async function update(id, data, actorUserId, tx = null) {
  await requirePolicy(id, tx);
  if (data.triggerFieldKey) assertField(data.triggerFieldKey);
  if (data.durationFieldKey) assertField(data.durationFieldKey);
  const normalized = { ...data, actorUserId };
  if (normalized.code)
    normalized.code = resolver.normalizeValueKey(normalized.code);
  if (normalized.triggerValueKey)
    normalized.triggerValueKey = resolver.normalizeValueKey(
      normalized.triggerValueKey,
    );
  return repository.updatePolicy(id, normalized, tx);
}
async function setActive(id, active, actorUserId, tx = null) {
  await requirePolicy(id, tx);
  return repository.setPolicyActive(id, active, actorUserId, tx);
}
async function resolve(field, value, at, tx = null) {
  assertField(field);

  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  return repository.applicablePolicy(field, normalizedValue, at, tx);
}

/**
 * Validate and normalize the complete policy configuration.
 */
function normalizeConfiguration(data) {
  assertField(data.triggerFieldKey);
  assertField(data.durationFieldKey);

  const normalizedRules = [];
  const seenValues = new Set();

  for (const rule of data.rules ?? []) {
    const fieldValueKey = resolver.normalizeValueKey(rule.fieldValueKey);

    if (!fieldValueKey) {
      throw AppError.badRequest(
        "Every SLA rule must have a valid field value.",
      );
    }

    if (seenValues.has(fieldValueKey)) {
      throw AppError.conflict(`Duplicate SLA rule value: ${fieldValueKey}`, {
        code: "SLA_DUPLICATE_RULE_VALUE",
      });
    }

    seenValues.add(fieldValueKey);

    normalizedRules.push({
      ...rule,
      fieldValueKey,
      resolutionMinutes: rule.resolutionMinutes ?? null,
      isEnabled: rule.isEnabled ?? true,
    });
  }

  return {
    ...data,
    code: resolver.normalizeValueKey(data.code),
    triggerValueKey: resolver.normalizeValueKey(data.triggerValueKey),
    rules: normalizedRules,
  };
}

/**
 * Synchronize all rules belonging to a policy.
 *
 * Existing rules are matched by their normalized business key.
 * This also reactivates previously disabled rules instead of
 * attempting duplicate inserts.
 */
async function synchronizeConfigurationRules(policyId, submittedRules, tx) {
  const existingRules = await repository.listRules(policyId, tx);

  const existingById = new Map(existingRules.map((rule) => [rule.id, rule]));

  const existingByValue = new Map(
    existingRules.map((rule) => [
      resolver.normalizeValueKey(rule.field_value_key),
      rule,
    ]),
  );

  const retainedIds = new Set();

  for (const submitted of submittedRules) {
    const fieldValueKey = submitted.fieldValueKey;

    // An explicitly supplied ID must belong to this policy.
    if (submitted.id && !existingById.has(submitted.id)) {
      throw AppError.badRequest(
        "An SLA rule does not belong to the selected policy.",
        { code: "SLA_INVALID_RULE_REFERENCE" },
      );
    }

    // Prefer the natural business key. This handles previously
    // disabled rules and prevents duplicate-key insertions.
    const matchingRule = existingByValue.get(fieldValueKey);

    // If no rule exists for this key, an existing ID can be
    // retained while its business key is changed.
    const targetRule =
      matchingRule ?? (submitted.id ? existingById.get(submitted.id) : null);

    const ruleData = {
      fieldValueKey,
      resolutionMinutes: submitted.resolutionMinutes,
      isEnabled: submitted.isEnabled,
    };

    if (targetRule) {
      await repository.updateRule(targetRule.id, ruleData, tx);

      retainedIds.add(targetRule.id);
    } else {
      const created = await repository.createRule(
        {
          ...ruleData,
          policyId,
        },
        tx,
      );

      retainedIds.add(created.id);
    }
  }

  // Removed rules are disabled, not physically deleted.
  // This preserves existing historical references and behaviour.
  for (const existing of existingRules) {
    if (retainedIds.has(existing.id)) {
      continue;
    }

    await repository.updateRule(existing.id, { isEnabled: false }, tx);
  }

  return repository.listRules(policyId, tx);
}

/**
 * Create a policy and its rules in one transaction.
 */
async function createConfiguration(data, actorUserId) {
  return executeTransaction(async (tx) => {
    const normalized = normalizeConfiguration(data);

    const calendar = await repository.oneCalendar(normalized.calendarId, tx);

    if (!calendar) {
      throw AppError.notFound("Selected SLA calendar was not found.", {
        code: SLA_ERROR_CODES.CALENDAR_NOT_FOUND,
      });
    }

    const policy = await repository.createPolicy(
      {
        ...normalized,
        actorUserId,
      },
      tx,
    );

    const rules = await synchronizeConfigurationRules(
      policy.id,
      normalized.rules,
      tx,
    );

    return {
      ...policy,
      rules,
    };
  });
}

/**
 * Update a policy and all its rules atomically.
 */
async function updateConfiguration(policyId, data, actorUserId) {
  return executeTransaction(async (tx) => {
    const normalized = normalizeConfiguration(data);

    await requirePolicy(policyId, tx);

    const calendar = await repository.oneCalendar(normalized.calendarId, tx);

    if (!calendar) {
      throw AppError.notFound("Selected SLA calendar was not found.", {
        code: SLA_ERROR_CODES.CALENDAR_NOT_FOUND,
      });
    }

    const policy = await repository.updatePolicy(
      policyId,
      {
        ...normalized,
        actorUserId,
      },
      tx,
    );

    if (!policy) {
      throw AppError.notFound("SLA policy not found.", {
        code: SLA_ERROR_CODES.POLICY_NOT_FOUND,
      });
    }

    const rules = await synchronizeConfigurationRules(
      policyId,
      normalized.rules,
      tx,
    );

    return {
      ...policy,
      rules,
    };
  });
}

export default Object.freeze({
  list,
  getById,
  requirePolicy,
  create,
  update,
  setActive,
  resolve,
  createConfiguration,
  updateConfiguration,
});
