const nextRetryDelayMs = (attempts: number, baseMs: number, maxMs: number) => {
  const exponent = Math.max(attempts - 1, 0);
  const delay = baseMs * 2 ** exponent;
  return Math.min(delay, maxMs);
};

export { nextRetryDelayMs };
