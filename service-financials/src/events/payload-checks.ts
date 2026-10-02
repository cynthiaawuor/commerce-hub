// Small checks shared by the consumers. A payload that fails one will fail it on every
// retry, so the consumers turn a failure into a PermanentEventError.

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isTime = (value: unknown): value is string =>
  isText(value) && !Number.isNaN(Date.parse(value));

// Whole cents, never negative
const isAmount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;

// Whole cents either way: a till can be over or short
const isSignedAmount = (value: unknown): value is number => Number.isInteger(value);

export { isAmount, isSignedAmount, isText, isTime };
