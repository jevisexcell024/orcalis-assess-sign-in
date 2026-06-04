import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'

test.describe('Marketing Pages', () => {
  test('home page loads', async ({ page }) => {
    await page.goto(`${BASE}/home`)
    await expect(page.getByText(/orcalis assess/i)).toBeVisible()
  })

  test('pricing page loads', async ({ page }) => {
    await page.goto(`${BASE}/pricing`)
    await expect(page.getByText(/pricing/i)).toBeVisible()
  })

  test('features page loads', async ({ page }) => {
    await page.goto(`${BASE}/features`)
    await expect(page.getByText(/features/i)).toBeVisible()
  })

  test('certificate verification portal loads', async ({ page }) => {
    await page.goto(`${BASE}/verify/search`)
    await expect(page.getByText(/certificate verification/i)).toBeVisible()
    await expect(page.getByPlaceholder(/cert/i)).toBeVisible()
  })

  test('employer portal loads', async ({ page }) => {
    await page.goto(`${BASE}/employer/verify`)
    await expect(page.getByText(/employer/i)).toBeVisible()
  })

  test('OG image endpoint returns SVG', async ({ page }) => {
    const res = await page.request.get(`${BASE}/og/image?title=Test&sub=Subtitle`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('svg')
  })
})
