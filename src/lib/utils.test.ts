import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge classNames correctly', () => {
      const result = cn('px-2', 'py-1')
      expect(result).toBe('px-2 py-1')
    })

    it('should handle conditional classNames', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-2', 'px-4')
      // twMerge should keep the last px class
      expect(result).toContain('px-4')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle false/null/undefined values', () => {
      const result = cn('base', false && 'false-class', null, undefined, 'another')
      expect(result).toBe('base another')
    })

    it('should merge padding and margin classes without conflict', () => {
      const result = cn('px-2 py-1', 'mx-auto')
      expect(result).toContain('px-2')
      expect(result).toContain('py-1')
      expect(result).toContain('mx-auto')
    })
  })
})
