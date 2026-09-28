export type FeatureFlags = {
  inventory: boolean;
};

// A module is only enabled when its flag is exactly "true", so an unfinished module
// never appears by accident.
export function loadFeatureFlags(
  source: Record<string, unknown> = import.meta.env,
): FeatureFlags {
  return { inventory: source.VITE_FEATURE_INVENTORY === "true" };
}

export const featureFlags = loadFeatureFlags();
