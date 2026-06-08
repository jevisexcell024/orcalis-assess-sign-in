import { describe, it, expect } from 'vitest'
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth-schema'

describe('Auth Schemas', () => {
  describe('signInSchema', () => {
    it('should validate correct sign-in data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePassword123',
      }
      const result = signInSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePassword123',
      }
      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'short',
      }
      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'SecurePassword123',
      }
      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should trim whitespace from email', () => {
      const dataWithWhitespace = {
        email: '  user@example.com  ',
        password: 'SecurePassword123',
      }
      const result = signInSchema.safeParse(dataWithWhitespace)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })
  })

  describe('signUpSchema', () => {
    const validData = {
      institutionName: 'Test University',
      contactName: 'John Doe',
      email: 'admin@university.edu',
      password: 'SecurePassword123',
      confirmPassword: 'SecurePassword123',
      acceptTerms: true,
    }

    it('should validate correct sign-up data', () => {
      const result = signUpSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const mismatchedData = { ...validData, confirmPassword: 'DifferentPassword123' }
      const result = signUpSchema.safeParse(mismatchedData)
      expect(result.success).toBe(false)
    })

    it('should reject when terms not accepted', () => {
      const rejectedTermsData = { ...validData, acceptTerms: false }
      const result = signUpSchema.safeParse(rejectedTermsData)
      expect(result.success).toBe(false)
    })

    it('should reject institution name shorter than 2 characters', () => {
      const shortNameData = { ...validData, institutionName: 'A' }
      const result = signUpSchema.safeParse(shortNameData)
      expect(result.success).toBe(false)
    })
  })

  describe('forgotPasswordSchema', () => {
    it('should validate correct email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'user@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'invalid-email',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    const validData = {
      password: 'NewSecurePassword123',
      confirmPassword: 'NewSecurePassword123',
    }

    it('should validate matching passwords', () => {
      const result = resetPasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const mismatchedData = {
        password: 'NewSecurePassword123',
        confirmPassword: 'DifferentPassword123',
      }
      const result = resetPasswordSchema.safeParse(mismatchedData)
      expect(result.success).toBe(false)
    })

    it('should reject password shorter than 8 characters', () => {
      const shortPasswordData = {
        password: 'short',
        confirmPassword: 'short',
      }
      const result = resetPasswordSchema.safeParse(shortPasswordData)
      expect(result.success).toBe(false)
    })
  })
})
