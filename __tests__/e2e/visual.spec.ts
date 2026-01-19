import { test, expect } from '@playwright/test'

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('homepage empty state', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 等待页面稳定
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('homepage-empty.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })

  test('input area focused', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.locator('textarea, input[type="text"]').first()
    await input.focus()

    await expect(input).toHaveScreenshot('input-focused.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('mobile-view.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })
})
