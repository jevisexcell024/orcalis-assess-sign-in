import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'

test.describe('Authentication', () => {
  test('sign-in page loads correctly', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows validation error for invalid email', async ({ page }) => {
    await page.goto(BASE)
    await page.fill('input[type="email"]', 'not-an-email')
    await page.fill('input[type="password"]', 'password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid email/i)).toBeVisible({ timeout: 3000 })
  })

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto(BASE)
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 5000 })
  })

  test('sign-up page is accessible from sign-in', async ({ page }) => {
    await page.goto(BASE)
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/signup/)
    await expect(page.getByText(/create.*account/i)).toBeVisible()
  })

  test('forgot password page works', async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`)
    await expect(page.getByText(/forgot|reset/i)).toBeVisible()
    await page.fill('input[type="email"]', 'test@example.com')
    await page.getByRole('button', { name: /send|reset/i }).click()
  })

  test('admin login page is separate', async ({ page }) => {
    await page.goto(`${BASE}/admin-login`)
    await expect(page.getByText(/admin/i)).toBeVisible()
  })
})
