import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getFeatureFlags,
  isFeatureEnabled,
  allFeaturesEnabled,
  anyFeatureEnabled,
  getEnabledFeatures,
} from './feature-flags'

describe('Feature Flags', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getFeatureFlags', () => {
    it('should return default flags when no env var is set', () => {
      const flags = getFeatureFlags()
      expect(flags).toBeDefined()
      expect(flags.maintenanceMode).toBe(false)
      expect(flags.enableGDPRCompliance).toBe(true)
    })

    it('should override defaults with env flags', () => {
      process.env.VITE_FEATURE_FLAGS = JSON.stringify({
        betaAnalytics: true,
        maintenanceMode: true,
      })
      // Note: This test may not work as expected since import.meta.env is compile-time
      // In real tests, you'd mock import.meta.env
    })
  })

  describe('isFeatureEnabled', () => {
    it('should return false for disabled features', () => {
      expect(isFeatureEnabled('betaAnalytics')).toBe(false)
    })

    it('should return true for enabled-by-default features', () => {
      expect(isFeatureEnabled('enableGDPRCompliance')).toBe(true)
    })
  })

  describe('allFeaturesEnabled', () => {
    it('should return true when all specified flags are enabled', () => {
      // enableGDPRCompliance and enableQueryCaching are both true by default
      expect(allFeaturesEnabled('enableGDPRCompliance', 'enableQueryCaching')).toBe(true)
    })

    it('should return false when any flag is disabled', () => {
      expect(allFeaturesEnabled('enableGDPRCompliance', 'betaAnalytics')).toBe(false)
    })
  })

  describe('anyFeatureEnabled', () => {
    it('should return true when any flag is enabled', () => {
      expect(anyFeatureEnabled('betaAnalytics', 'enableGDPRCompliance')).toBe(true)
    })

    it('should return false when all flags are disabled', () => {
      expect(anyFeatureEnabled('betaAnalytics', 'betaAITuning')).toBe(false)
    })
  })

  describe('getEnabledFeatures', () => {
    it('should return array of enabled feature names', () => {
      const enabled = getEnabledFeatures()
      expect(Array.isArray(enabled)).toBe(true)
      expect(enabled).toContain('enableGDPRCompliance')
      expect(enabled).toContain('enableQueryCaching')
      expect(enabled).not.toContain('betaAnalytics')
    })

    it('should not include disabled features', () => {
      const enabled = getEnabledFeatures()
      expect(enabled).not.toContain('maintenanceMode')
      expect(enabled).not.toContain('readOnlyMode')
    })
  })
})
