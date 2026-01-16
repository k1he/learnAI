import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useConversation } from '@/hooks/use-conversation'
import { getConversations, getConversationById } from '@/lib/storage'

describe('Conversation Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should complete full conversation flow', async () => {
    const { result } = renderHook(() => useConversation())

    // 1. 等待初始化
    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    const conversationId = result.current.conversation!.id

    // 2. 发送第一条消息
    await act(async () => {
      await result.current.sendMessage('画一个红色的圆')
    })

    // 3. 验证消息和可视化状态
    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(2)
      expect(result.current.conversation?.currentVisual?.status).toBe('success')
      expect(result.current.conversation?.currentVisual?.code).toBeTruthy()
    })

    // 4. 验证持久化
    const savedConversation = getConversationById(conversationId)
    expect(savedConversation).not.toBeNull()
    expect(savedConversation?.messages).toHaveLength(2)

    // 5. 发送第二条消息（多轮对话）
    await act(async () => {
      await result.current.sendMessage('改成蓝色')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(4)
      expect(result.current.conversation?.currentVisual?.version).toBe(2)
    })
  })

  it('should persist and restore conversations', async () => {
    // 1. 创建并保存对话
    const { result: result1, unmount } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result1.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result1.current.sendMessage('测试消息')
    })

    await waitFor(() => {
      expect(result1.current.conversation?.messages).toHaveLength(2)
    })

    const savedId = result1.current.conversation!.id
    unmount()

    // 2. 重新挂载，验证恢复
    const { result: result2 } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result2.current.conversation?.id).toBe(savedId)
      expect(result2.current.conversation?.messages).toHaveLength(2)
    })
  })

  it('should manage multiple conversations', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    // 创建第一个对话
    await act(async () => {
      await result.current.sendMessage('对话1')
    })

    await waitFor(() => {
      expect(result.current.conversation?.messages).toHaveLength(2)
    })

    const firstId = result.current.conversation!.id

    // 创建第二个对话
    act(() => {
      result.current.startNewChat()
    })

    await act(async () => {
      await result.current.sendMessage('对话2')
    })

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(2)
    })

    // 切换回第一个对话
    act(() => {
      result.current.loadConversation(firstId)
    })

    expect(result.current.conversation?.messages[0].content).toBe('对话1')
  })

  it('should delete conversation', async () => {
    const { result } = renderHook(() => useConversation())

    await waitFor(() => {
      expect(result.current.conversation).not.toBeNull()
    })

    await act(async () => {
      await result.current.sendMessage('将被删除')
    })

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1)
    })

    const idToDelete = result.current.conversation!.id

    act(() => {
      result.current.deleteConversation(idToDelete)
    })

    expect(result.current.conversations).toHaveLength(0)
    expect(result.current.conversation?.id).not.toBe(idToDelete)
  })
})
