import { test, expect } from '@playwright/test'

test.describe('Interactivity and Chinese Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should generate a Chinese interactive visualization', async ({ page }) => {
    test.setTimeout(120000)

    await page.goto('/')

    await expect(page.getByText('概念可视化')).toBeVisible()
    
    const textarea = page.locator('textarea').first()
    await textarea.fill('用 Recharts 制作一个展示冒泡排序步骤的交互式动画，并使用中文解释')
    await textarea.press('Enter')

    await expect(page.getByText('思考中')).toBeVisible()

    const assistantBubble = page.locator('.flex.gap-3.flex-row').first()
    await expect(assistantBubble).toBeVisible({ timeout: 90000 })
    
    const explanationText = await assistantBubble.innerText()
    expect(explanationText).toMatch(/[\u4e00-\u9fa5]/)

    const iframe = page.frameLocator('iframe[title="Code Preview"]')
    await expect(iframe.locator('#root')).toBeVisible({ timeout: 15000 })

    const buttons = iframe.locator('button')
    const buttonCount = await buttons.count()
    if (buttonCount > 0) {
      const firstButtonText = await buttons.first().innerText()
      expect(firstButtonText).toMatch(/[\u4e00-\u9fa5]/)
    }

    await expect(page.getByText('编译错误')).not.toBeVisible()
    await expect(page.getByText('运行时错误')).not.toBeVisible()
  })

  test('should localized core UI elements to Chinese', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.locator('textarea')).toHaveAttribute('placeholder', '描述你想要的可视化...')
    await expect(page.getByRole('button', { name: '发送' })).toBeVisible()
  })
})
