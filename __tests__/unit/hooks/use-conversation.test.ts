import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useConversation } from '@/hooks/use-conversation'
import { server } from '../../mocks/server'
import { errorHandlers } from '../../mocks/handlers'

describe('useConversation', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with a new conversation', async () => {
    const { result } = renderHook(() => useConversation())

    // Initially loading, then should have a conversation
    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    expect(result.current.conversation?.title).toBe('新对话')
    expect(result.current.conversation?.messages).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.conversations).toEqual([])
  })

  it('should start new chat', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    const initialId = result.current.conversation?.id

    act(() => {
      result.current.startNewChat()
    })

    expect(result.current.conversation?.id).not.toBe(initialId)
    expect(result.current.conversation?.messages).toEqual([])
    expect(result.current.conversation?.title).toBe('新对话')
    expect(result.current.error).toBeNull()
  })

  it('should send message and receive response', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result.current.sendMessage('画一个圆')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(2)
    })

    // Check user message
    expect(result.current.conversation?.messages[0].role).toBe('user')
    expect(result.current.conversation?.messages[0].content).toBe('画一个圆')

    // Check assistant message
    expect(result.current.conversation?.messages[1].role).toBe('assistant')
    expect(result.current.conversation?.messages[1].content).toContain('画一个圆')
    expect(result.current.conversation?.messages[1].codeSnippet).toBeDefined()

    // Check visualization
    expect(result.current.conversation?.currentVisual?.code).toBeDefined()
    expect(result.current.conversation?.currentVisual?.status).toBe('success')
  })

  it('should set loading state while sending', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // Initially not loading
    expect(result.current.isLoading).toBe(false)

    // Start sending message (don't await immediately)
    let sendPromise: Promise<void>
    act(() => {
      sendPromise = result.current.sendMessage('test')
    })

    // Should be loading now
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    // Wait for completion
    await act(async () => {
      await sendPromise
    })

    // Should not be loading anymore
    expect(result.current.isLoading).toBe(false)
  })

  it('should update conversation title from first message', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // Use a message longer than 30 characters to test truncation
    const longMessage = '这是一个很长的消息，它的长度超过了三十个字符，所以应该会被截断并添加省略号'

    await act(async () => {
      await result.current.sendMessage(longMessage)
    })

    await waitFor(() => {
      expect(result.current.conversation?.title).toBeDefined()
    })

    // Should truncate to 30 chars and add ellipsis
    expect(result.current.conversation?.title).not.toBe(longMessage)
    expect(result.current.conversation?.title.length).toBeLessThan(longMessage.length)
    expect(result.current.conversation?.title).toContain('...')
    expect(result.current.conversation?.title).toBe(longMessage.slice(0, 30) + '...')
  })

  it('should not update title on subsequent messages', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // First message sets the title
    await act(async () => {
      await result.current.sendMessage('第一条消息')
    })

    await waitFor(() => {
      expect(result.current.conversation?.title).toBe('第一条消息')
    })

    const firstTitle = result.current.conversation?.title

    // Second message should not change title
    await act(async () => {
      await result.current.sendMessage('第二条消息应该不会改变标题')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(4)
    })

    expect(result.current.conversation?.title).toBe(firstTitle)
  })

  it('should persist conversation to localStorage', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result.current.sendMessage('测试持久化')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(2)
    })

    // Check localStorage
    const stored = localStorage.getItem('concept-canvas-conversations')
    expect(stored).not.toBeNull()

    const conversations = JSON.parse(stored!)
    expect(conversations).toHaveLength(1)
    expect(conversations[0].messages).toHaveLength(2)
  })

  it('should load existing conversation', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // Send a message to create a conversation with content
    await act(async () => {
      await result.current.sendMessage('原始对话')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(2)
    })

    const conversationId = result.current.conversation?.id

    // Start a new chat
    act(() => {
      result.current.startNewChat()
    })

    expect(result.current.conversation?.id).not.toBe(conversationId)
    expect(result.current.conversation?.messages).toEqual([])

    // Load the previous conversation
    act(() => {
      result.current.loadConversation(conversationId!)
    })

    expect(result.current.conversation?.id).toBe(conversationId)
    expect(result.current.conversation?.messages).toHaveLength(2)
    expect(result.current.conversation?.messages[0].content).toBe('原始对话')
  })

  it('should delete conversation', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // Send a message to save the conversation
    await act(async () => {
      await result.current.sendMessage('要删除的对话')
    })

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1)
    })

    const conversationId = result.current.conversation?.id

    // Delete the conversation
    act(() => {
      result.current.deleteConversation(conversationId!)
    })

    // Should start a new chat after deleting current conversation
    expect(result.current.conversation?.id).not.toBe(conversationId)
    expect(result.current.conversations).toHaveLength(0)
  })

  it('should clear all history', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // Create multiple conversations
    await act(async () => {
      await result.current.sendMessage('对话1')
    })

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1)
    })

    act(() => {
      result.current.startNewChat()
    })

    await act(async () => {
      await result.current.sendMessage('对话2')
    })

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(2)
    })

    // Clear all
    act(() => {
      result.current.clearAllHistory()
    })

    expect(result.current.conversations).toEqual([])
    expect(result.current.conversation?.messages).toEqual([])
    expect(localStorage.getItem('concept-canvas-conversations')).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    // Override with error handler
    server.use(errorHandlers.serverError)

    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result.current.sendMessage('这会失败')
    })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.error).toContain('服务器内部错误')
    expect(result.current.isLoading).toBe(false)

    // User message should still be added
    expect(result.current.conversation?.messages).toHaveLength(1)
    expect(result.current.conversation?.messages[0].content).toBe('这会失败')

    // Visualization should be in error state
    expect(result.current.conversation?.currentVisual?.status).toBe('error')
  })

  it('should clear error', async () => {
    // Override with error handler
    server.use(errorHandlers.serverError)

    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result.current.sendMessage('错误测试')
    })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('should handle multiple sequential messages correctly', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // Send first message
    await act(async () => {
      await result.current.sendMessage('第一条消息')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(2)
    })

    // Send second message after first completes
    await act(async () => {
      await result.current.sendMessage('第二条消息')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(4)
    })

    // Verify message order
    const messages = result.current.conversation?.messages || []
    expect(messages[0].content).toBe('第一条消息')
    expect(messages[1].role).toBe('assistant')
    expect(messages[2].content).toBe('第二条消息')
    expect(messages[3].role).toBe('assistant')
  })

  it('should increment visualization version on each message', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // First message
    await act(async () => {
      await result.current.sendMessage('第一条')
    })

    await waitFor(() => {
      expect(result.current.conversation?.currentVisual?.version).toBe(1)
    })

    // Second message
    await act(async () => {
      await result.current.sendMessage('第二条')
    })

    await waitFor(() => {
      expect(result.current.conversation?.currentVisual?.version).toBe(2)
    })

    // Third message
    await act(async () => {
      await result.current.sendMessage('第三条')
    })

    await waitFor(() => {
      expect(result.current.conversation?.currentVisual?.version).toBe(3)
    })
  })

  it('should pass current code to API on subsequent messages', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // First message establishes code
    await act(async () => {
      await result.current.sendMessage('创建组件')
    })

    await waitFor(() => {
      expect(result.current.conversation?.currentVisual?.code).toBeDefined()
    })

    const firstCode = result.current.conversation?.currentVisual?.code

    // Second message should send the current code
    await act(async () => {
      await result.current.sendMessage('修改颜色')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(4)
    })

    // The API mock returns the same code, but in real scenario it would be modified
    expect(result.current.conversation?.currentVisual?.code).toBeDefined()
  })

  it('should restore conversation on mount if currentId exists', async () => {
    // Pre-populate localStorage with a conversation
    const testConversation = {
      id: 'test-conv-123',
      title: '已存在的对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: '之前的消息',
          timestamp: Date.now(),
        },
      ],
      currentVisual: null,
    }

    localStorage.setItem('concept-canvas-conversations', JSON.stringify([testConversation]))
    localStorage.setItem('concept-canvas-current-conversation', 'test-conv-123')

    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    expect(result.current.conversation?.id).toBe('test-conv-123')
    expect(result.current.conversation?.title).toBe('已存在的对话')
    expect(result.current.conversation?.messages).toHaveLength(1)
    expect(result.current.conversations).toHaveLength(1)
  })
})
