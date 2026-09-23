import { env } from "./env";

export type FeatureFlags = {
  procurement: boolean;
};

// A module is only enabled when its flag is exactly "true"; missing or anything else
// keeps it hidden, so an unfinished module never shows up by accident.
export function loadFeatureFlags(
  source: Record<string, unknown> = import.meta.env,
): FeatureFlags {
  return { procurement: source.VITE_FEATURE_PROCUREMENT === "true" };
}

export const featureFlags = loadFeatureFlags();

export const moduleUrls = {
  procurement: env.procurementApiUrl,
  vendor: env.vendorApiUrl,
} as const;

export type Module = keyof typeof moduleUrls;
