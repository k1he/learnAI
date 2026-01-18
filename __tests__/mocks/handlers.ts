import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:8000'

export const handlers = [
  // 成功响应
  http.post(`${API_BASE}/api/v1/chat/generate`, async ({ request }) => {
    const body = await request.json() as { messages: Array<{ content: string }> }
    const userMessage = body.messages[body.messages.length - 1]?.content || ''

    return HttpResponse.json({
      message: {
        role: 'assistant',
        content: `这是对 "${userMessage}" 的回复`,
        code: `export default function App() {\n  return <div>Hello World</div>\n}`,
      },
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    })
  }),
]

// 错误场景 handlers
export const errorHandlers = {
  networkError: http.post(`${API_BASE}/api/v1/chat/generate`, () => {
    return HttpResponse.error()
  }),

  serverError: http.post(`${API_BASE}/api/v1/chat/generate`, () => {
    return HttpResponse.json(
      { detail: '服务器内部错误' },
      { status: 500 }
    )
  }),

  validationError: http.post(`${API_BASE}/api/v1/chat/generate`, () => {
    return HttpResponse.json(
      { detail: '代码验证失败' },
      { status: 422 }
    )
  }),
}
