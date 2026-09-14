import { env } from "./env";

export type FeatureFlags = {
  vendorManagement: boolean;
};

// A module is only enabled when its flag is exactly "true"; missing or anything else keeps it hidden.
export function loadFeatureFlags(
  source: Record<string, unknown> = import.meta.env,
): FeatureFlags {
  return {
    vendorManagement: source.VITE_FEATURE_VENDOR_MANAGEMENT === "true",
  };
}

export const featureFlags = loadFeatureFlags();
export const moduleUrls = {
  vendor: env.vendorApiUrl,
} as const;

export type Module = keyof typeof moduleUrls;
