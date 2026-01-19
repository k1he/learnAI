import { describe, it, expect, beforeEach } from 'vitest'
import {
  getConversations,
  saveConversation,
  getConversationById,
  deleteConversation,
  clearAllConversations,
  getCurrentConversationId,
  setCurrentConversationId,
  generateConversationId,
  generateMessageId,
} from '@/lib/storage'
import type { Conversation } from '@/types/conversation'

const mockConversation: Conversation = {
  id: 'conv_123',
  title: '测试对话',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  currentVisual: null,
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getConversations', () => {
    it('should return empty array when no conversations', () => {
      expect(getConversations()).toEqual([])
    })

    it('should return saved conversations', () => {
      saveConversation(mockConversation)
      const result = getConversations()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('conv_123')
    })
  })

  describe('saveConversation', () => {
    it('should save new conversation', () => {
      saveConversation(mockConversation)
      const result = getConversationById('conv_123')
      expect(result).not.toBeNull()
      expect(result?.title).toBe('测试对话')
    })

    it('should update existing conversation', () => {
      saveConversation(mockConversation)
      saveConversation({ ...mockConversation, title: '更新后的标题' })
      const result = getConversations()
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('更新后的标题')
    })
  })

  describe('getConversationById', () => {
    it('should return null for non-existent id', () => {
      expect(getConversationById('non-existent')).toBeNull()
    })

    it('should return conversation by id', () => {
      saveConversation(mockConversation)
      const result = getConversationById('conv_123')
      expect(result?.id).toBe('conv_123')
    })
  })

  describe('deleteConversation', () => {
    it('should delete conversation by id', () => {
      saveConversation(mockConversation)
      deleteConversation('conv_123')
      expect(getConversationById('conv_123')).toBeNull()
    })
  })

  describe('clearAllConversations', () => {
    it('should clear all conversations', () => {
      saveConversation(mockConversation)
      saveConversation({ ...mockConversation, id: 'conv_456' })
      clearAllConversations()
      expect(getConversations()).toEqual([])
    })
  })

  describe('currentConversationId', () => {
    it('should get and set current conversation id', () => {
      expect(getCurrentConversationId()).toBeNull()
      setCurrentConversationId('conv_123')
      expect(getCurrentConversationId()).toBe('conv_123')
    })

    it('should clear current id when set to null', () => {
      setCurrentConversationId('conv_123')
      setCurrentConversationId(null)
      expect(getCurrentConversationId()).toBeNull()
    })
  })

  describe('id generators', () => {
    it('should generate unique conversation ids', () => {
      const id1 = generateConversationId()
      const id2 = generateConversationId()
      expect(id1).toMatch(/^conv_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique message ids', () => {
      const id1 = generateMessageId()
      const id2 = generateMessageId()
      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })
})
