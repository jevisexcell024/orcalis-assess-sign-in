import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'

test.describe('API Health', () => {
  test('health endpoint returns ok', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/health`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  test('version endpoint returns version', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/version`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.version).toBeDefined()
  })

  test('protected routes return 401 without auth', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/results/export`)
    expect(res.status()).toBe(401)
  })

  test('transcript endpoint requires auth', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/transcripts/generate?student_id=test`)
    expect(res.status()).toBe(401)
  })
})
