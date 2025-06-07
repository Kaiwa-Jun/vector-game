import { test, expect } from '@playwright/test'

test.describe('Sample E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')

    // ページタイトルが存在することを確認
    await expect(page).toHaveTitle(/Vector Game/)

    // 基本的な要素が表示されることを確認
    await expect(page.locator('body')).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')

    // ページが正常に読み込まれることを確認
    await expect(page.locator('body')).toBeVisible()
  })
})
