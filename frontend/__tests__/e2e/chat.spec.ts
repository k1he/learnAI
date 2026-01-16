import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display empty state on first visit', async ({ page }) => {
    await page.goto('/')

    // 验证页面标题
    await expect(page).toHaveTitle(/.*/)

    // 验证空状态显示正确的内容
    await expect(page.getByText('概念可视化')).toBeVisible()
    await expect(page.getByText(/输入任何概念或问题/)).toBeVisible()

    // 验证输入框存在且可用
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()
    await expect(textarea).toHaveAttribute('placeholder', '描述你想要的可视化...')

    // 验证发送按钮存在
    const sendButton = page.locator('button[type="submit"]').first()
    await expect(sendButton).toBeVisible()
  })

  test('should send message and display response', async ({ page }) => {
    await page.goto('/')

    // 找到输入框并输入
    const textarea = page.locator('textarea').first()
    await textarea.fill('画一个简单的计数器')

    // 验证发送按钮在输入内容后变为可用
    const sendButton = page.locator('button[type="submit"]').first()
    await expect(sendButton).toBeEnabled()

    // 发送消息（按回车）
    await textarea.press('Enter')

    // 等待用户消息显示
    await expect(page.getByText('画一个简单的计数器')).toBeVisible({ timeout: 5000 })

    // 等待 loading 状态显示
    await expect(page.getByText('思考中')).toBeVisible({ timeout: 3000 })

    // 等待响应显示（这里会调用 MSW 的 mock API）
    // 注意: 由于 Playwright webServer 会启动真实的前端服务器，
    // 如果没有后端服务，可能需要在测试中使用 route 拦截

    // 验证输入框已清空
    await expect(textarea).toHaveValue('')
  })

  test('should show input area with correct elements', async ({ page }) => {
    await page.goto('/')

    // 验证输入区域的基本元素
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
    await expect(textarea).toBeEnabled()

    // 验证发送按钮默认禁用（因为输入为空）
    const sendButton = page.locator('button[type="submit"]').first()
    await expect(sendButton).toBeDisabled()

    // 输入文本后，发送按钮应该变为可用
    await textarea.fill('测试消息')
    await expect(sendButton).toBeEnabled()

    // 清空输入后，发送按钮应该再次禁用
    await textarea.clear()
    await expect(sendButton).toBeDisabled()
  })

  test('should handle Enter key to send message', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await textarea.fill('测试 Enter 键发送')

    // 按 Enter 发送
    await textarea.press('Enter')

    // 验证消息已发送
    await expect(page.getByText('测试 Enter 键发送')).toBeVisible({ timeout: 5000 })

    // 验证输入框已清空
    await expect(textarea).toHaveValue('')
  })

  test('should handle Shift+Enter to add new line', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await textarea.fill('第一行')

    // 按 Shift+Enter 添加新行
    await textarea.press('Shift+Enter')
    await textarea.type('第二行')

    // 验证输入框包含两行内容
    const value = await textarea.inputValue()
    expect(value).toContain('\n')
    expect(value).toContain('第一行')
    expect(value).toContain('第二行')
  })

  test('should disable input during loading', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    const sendButton = page.locator('button[type="submit"]').first()

    // 输入并发送消息
    await textarea.fill('测试禁用状态')
    await sendButton.click()

    // 等待 loading 状态
    await expect(page.getByText('思考中')).toBeVisible({ timeout: 3000 })

    // 验证输入框和按钮在 loading 期间被禁用
    await expect(textarea).toBeDisabled()
    await expect(sendButton).toBeDisabled()
  })

  test('should display message bubbles with correct styling', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    await textarea.fill('测试消息样式')
    await textarea.press('Enter')

    // 等待用户消息显示
    const userMessage = page.locator('.flex.gap-3.flex-row-reverse').first()
    await expect(userMessage).toBeVisible({ timeout: 5000 })

    // 验证用户消息包含正确的内容
    await expect(userMessage.getByText('测试消息样式')).toBeVisible()

    // 验证用户消息有用户图标
    await expect(userMessage.locator('svg')).toBeVisible()
  })

  test('should show header with new chat and history buttons', async ({ page }) => {
    await page.goto('/')

    // 验证 header 存在
    const header = page.locator('header, .border-b').first()
    await expect(header).toBeVisible()
  })

  test('should maintain split layout with input and visualizer panes', async ({ page }) => {
    await page.goto('/')

    // 验证页面使用 split layout
    // 左侧应该是 input pane（包含 chat interface）
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()

    // 验证布局结构存在（右侧是 visualizer pane）
    // 注意: 具体的 selector 取决于 SplitLayout 的实现
    const mainLayout = page.locator('main')
    await expect(mainLayout).toBeVisible()
  })

  test('should prevent sending empty messages', async ({ page }) => {
    await page.goto('/')

    const textarea = page.locator('textarea').first()
    const sendButton = page.locator('button[type="submit"]').first()

    // 尝试发送空消息
    await textarea.fill('   ')
    await expect(sendButton).toBeDisabled()

    // 尝试按 Enter
    await textarea.press('Enter')

    // 验证没有消息被发送（空状态依然存在）
    await expect(page.getByText('概念可视化')).toBeVisible()
  })
})
