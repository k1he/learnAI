import { describe, it, expect } from 'vitest'
import { server } from '../../mocks/server'
import { errorHandlers } from '../../mocks/handlers'
import { chatGenerate, ApiError } from '@/services/api'

describe('api service', () => {
  describe('chatGenerate', () => {
    it('should return response on success', async () => {
      const result = await chatGenerate({
        messages: [{ role: 'user', content: '画一个圆' }],
      })

      expect(result.message.role).toBe('assistant')
      expect(result.message.content).toContain('画一个圆')
      expect(result.message.code).toBeDefined()
      expect(result.usage).toBeDefined()
    })

    it('should throw ApiError on server error', async () => {
      server.use(errorHandlers.serverError)

      await expect(
        chatGenerate({ messages: [{ role: 'user', content: 'test' }] })
      ).rejects.toThrow(ApiError)
    })

    it('should throw ApiError with status on validation error', async () => {
      server.use(errorHandlers.validationError)

      try {
        await chatGenerate({ messages: [{ role: 'user', content: 'test' }] })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(422)
      }
    })

    it('should throw ApiError on network error', async () => {
      server.use(errorHandlers.networkError)

      await expect(
        chatGenerate({ messages: [{ role: 'user', content: 'test' }] })
      ).rejects.toThrow(ApiError)
    })
  })
})
