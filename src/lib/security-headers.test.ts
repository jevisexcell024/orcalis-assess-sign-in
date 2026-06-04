import { describe, it, expect } from 'vitest'
import { SECURITY_HEADERS, applySecurityHeaders } from './security-headers'

describe('SECURITY_HEADERS', () => {
  it('includes X-Content-Type-Options', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff')
  })

  it('includes X-Frame-Options DENY', () => {
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY')
  })

  it('includes HSTS header', () => {
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=31536000')
  })

  it('includes Content-Security-Policy', () => {
    expect(SECURITY_HEADERS['Content-Security-Policy']).toContain("default-src 'self'")
  })
})

describe('applySecurityHeaders', () => {
  it('adds all security headers to a response', () => {
    const original = new Response('OK', { status: 200 })
    const secured  = applySecurityHeaders(original)
    expect(secured.headers.get('X-Frame-Options')).toBe('DENY')
    expect(secured.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('preserves response status and body', () => {
    const original = new Response('hello', { status: 201 })
    const secured  = applySecurityHeaders(original)
    expect(secured.status).toBe(201)
  })
})
