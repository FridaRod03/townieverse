import type { EngineResult } from '../types/engine';
import { failure, success } from '../types/engine';

export interface RerollPlan<T extends object> {
  previous: T;
  fields: readonly (keyof T)[];
  locks: readonly (keyof T)[];
  /** Callbacks see the draft in the requested field order. They must be pure. */
  generators: Partial<{
    [K in keyof T]: (draft: Readonly<T>) => EngineResult<T[K]>;
  }>;
  validate: (draft: Readonly<T>) => EngineResult<true>;
  /** Validate retained values while allowing invalid unlocked fields to be replaced. */
  validateRetained?: (
    previous: Readonly<T>,
    rerolling: readonly (keyof T)[],
  ) => EngineResult<true>;
}
/** Atomic update: preserve untouched/locked fields; never mutate the caller's value. */
export function rerollFields<T extends object>(
  plan: RerollPlan<T>,
): EngineResult<T> {
  if (
    new Set(plan.fields).size !== plan.fields.length ||
    new Set(plan.locks).size !== plan.locks.length
  )
    return failure('INVALID_CONFIG', 'Reroll fields and locks must be unique.');
  const rerolling = plan.fields.filter((field) => !plan.locks.includes(field));
  const before = plan.validateRetained
    ? plan.validateRetained(plan.previous, rerolling)
    : plan.validate(plan.previous);
  if (!before.success)
    return plan.locks.length
      ? failure(
          'LOCK_CONFLICT',
          'Existing values conflict with the new filters. Unlock or change the conflicting fields before rerolling.',
          [before.error.message, ...before.error.details],
        )
      : before;
  const draft = { ...plan.previous };
  for (const key of plan.locks)
    if (!(key in plan.previous) || plan.previous[key] === undefined)
      return failure(
        'LOCK_CONFLICT',
        'Cannot lock a field without a generated value.',
        [String(key)],
      );
  for (const field of plan.fields) {
    if (plan.locks.includes(field)) continue;
    const generator = plan.generators[field];
    if (!generator)
      return failure(
        'INVALID_CONFIG',
        'No generator is configured for this field.',
        [String(field)],
      );
    const generated = generator(draft);
    if (!generated.success) return generated;
    draft[field] = generated.value;
  }
  const after = plan.validate(draft);
  if (!after.success)
    return plan.locks.length
      ? failure(
          'LOCK_CONFLICT',
          'The reroll cannot coexist with locked fields.',
          [after.error.message, ...after.error.details],
        )
      : after;
  return success(draft);
}
