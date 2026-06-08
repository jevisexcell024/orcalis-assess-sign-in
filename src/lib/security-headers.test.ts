import { describe, it, expect } from 'vitest'
import { applySecurityHeaders } from './security-headers'

describe('applySecurityHeaders (HTTP)', () => {
  const httpRequest = new Request('http://localhost:8080/')

  it('adds X-Content-Type-Options', () => {
    const r = applySecurityHeaders(new Response('OK'), httpRequest)
    expect(r.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('adds X-Frame-Options DENY', () => {
    const r = applySecurityHeaders(new Response('OK'), httpRequest)
    expect(r.headers.get('X-Frame-Options')).toBe('DENY')
  })

  it('includes CSP with default-src', () => {
    const r = applySecurityHeaders(new Response('OK'), httpRequest)
    expect(r.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
  })

  it('does NOT include upgrade-insecure-requests on HTTP', () => {
    const r = applySecurityHeaders(new Response('OK'), httpRequest)
    expect(r.headers.get('Content-Security-Policy')).not.toContain('upgrade-insecure-requests')
  })

  it('does NOT include HSTS on HTTP', () => {
    const r = applySecurityHeaders(new Response('OK'), httpRequest)
    expect(r.headers.get('Strict-Transport-Security')).toBeNull()
  })
})

describe('applySecurityHeaders (HTTPS)', () => {
  const httpsRequest = new Request('https://app.orcalis.io/')

  it('includes upgrade-insecure-requests on HTTPS', () => {
    const r = applySecurityHeaders(new Response('OK'), httpsRequest)
    expect(r.headers.get('Content-Security-Policy')).toContain('upgrade-insecure-requests')
  })

  it('includes HSTS on HTTPS', () => {
    const r = applySecurityHeaders(new Response('OK'), httpsRequest)
    expect(r.headers.get('Strict-Transport-Security')).toContain('max-age=31536000')
  })
})

describe('applySecurityHeaders (no request)', () => {
  it('preserves response status and body', () => {
    const r = applySecurityHeaders(new Response('hello', { status: 201 }))
    expect(r.status).toBe(201)
  })

  it('adds X-Frame-Options', () => {
    const r = applySecurityHeaders(new Response('OK'))
    expect(r.headers.get('X-Frame-Options')).toBe('DENY')
  })
})
