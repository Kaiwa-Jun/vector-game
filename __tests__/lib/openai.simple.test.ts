// Simple test for OpenAI functions without complex mocking
describe('OpenAI module structure', () => {
  beforeEach(() => {
    // Clear the module cache to reset the OpenAI instance
    jest.resetModules()
  })

  it('should export the required functions', () => {
    // Mock the OpenAI constructor to avoid API key issues
    jest.doMock('openai', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        embeddings: {
          create: jest.fn(),
        },
      })),
    }))

    const openaiModule = require('@/lib/openai')

    expect(typeof openaiModule.getEmbedding).toBe('function')
    expect(typeof openaiModule.batchGetEmbeddings).toBe('function')
    expect(typeof openaiModule.getCachedEmbedding).toBe('function')
  })

  it('should handle empty array in batchGetEmbeddings', async () => {
    jest.doMock('openai', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        embeddings: {
          create: jest.fn(),
        },
      })),
    }))

    const { batchGetEmbeddings } = require('@/lib/openai')
    const result = await batchGetEmbeddings([])
    expect(result).toEqual([])
  })
})
