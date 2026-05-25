/**
 * Feature Flags System
 * Allows enabling/disabling features dynamically without code changes
 */

export type FeatureFlags = {
  // Beta features
  betaAnalytics: boolean;
  betaAITuning: boolean;
  betaDataExport: boolean;

  // Experimental
  experimentalUI: boolean;
  experimentalReporting: boolean;

  // Performance
  enableQueryCaching: boolean;
  enableSessionReplay: boolean;

  // Maintenance
  maintenanceMode: boolean;
  readOnlyMode: boolean;

  // Feature rollouts
  enableNewProctoringEngine: boolean;
  enableGDPRCompliance: boolean;
  enableAdvancedAnalytics: boolean;
};

// Default flags (all disabled by default for safety)
const DEFAULT_FLAGS: FeatureFlags = {
  betaAnalytics: false,
  betaAITuning: false,
  betaDataExport: false,
  experimentalUI: false,
  experimentalReporting: false,
  enableQueryCaching: true, // Enable by default
  enableSessionReplay: false,
  maintenanceMode: false,
  readOnlyMode: false,
  enableNewProctoringEngine: false,
  enableGDPRCompliance: true,
  enableAdvancedAnalytics: false,
};

/**
 * Parse feature flags from environment variable
 * Format: VITE_FEATURE_FLAGS={"flagName": true, "anotherFlag": false}
 */
function parseFeatureFlags(envString?: string): Partial<FeatureFlags> {
  if (!envString) return {};

  try {
    const parsed = JSON.parse(envString);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Partial<FeatureFlags>;
    }
  } catch (error) {
    console.warn("Failed to parse feature flags from env:", error);
  }
  return {};
}

/**
 * Get current feature flags
 */
export function getFeatureFlags(): FeatureFlags {
  const envFlags = parseFeatureFlags(import.meta.env.VITE_FEATURE_FLAGS);

  return {
    ...DEFAULT_FLAGS,
    ...envFlags,
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(flagName: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[flagName] ?? DEFAULT_FLAGS[flagName];
}

/**
 * Check multiple flags with AND logic
 */
export function allFeaturesEnabled(...flagNames: (keyof FeatureFlags)[]): boolean {
  return flagNames.every((flag) => isFeatureEnabled(flag));
}

/**
 * Check multiple flags with OR logic
 */
export function anyFeatureEnabled(...flagNames: (keyof FeatureFlags)[]): boolean {
  return flagNames.some((flag) => isFeatureEnabled(flag));
}

/**
 * Get a list of enabled features
 */
export function getEnabledFeatures(): (keyof FeatureFlags)[] {
  const flags = getFeatureFlags();
  return (Object.keys(flags) as (keyof FeatureFlags)[]).filter((flag) => flags[flag]);
}

/**
 * Hook to use feature flags in components
 */
export function useFeatureFlag(flagName: keyof FeatureFlags): boolean {
  return isFeatureEnabled(flagName);
}

/**
 * Utility for conditional rendering based on feature flags
 */
export function FeatureGate({
  feature,
  children,
  fallback = null,
}: {
  feature: keyof FeatureFlags | (keyof FeatureFlags)[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const flags = Array.isArray(feature) ? feature : [feature];
  const isEnabled = allFeaturesEnabled(...flags);

  return isEnabled ? children : fallback;
}

/**
 * Export types for server-side feature flag checks
 */
export const featureFlagNames = Object.keys(DEFAULT_FLAGS) as (keyof FeatureFlags)[];

export default {
  getFeatureFlags,
  isFeatureEnabled,
  allFeaturesEnabled,
  anyFeatureEnabled,
  getEnabledFeatures,
  useFeatureFlag,
  FeatureGate,
};
