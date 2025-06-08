import OpenAI from 'openai'

let openai: OpenAI

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

/**
 * Delays execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Gets embedding for a single text input with retry logic
 */
export async function getEmbedding(
  text: string,
  retries = 0
): Promise<number[]> {
  try {
    const client = getOpenAIClient()
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    })

    return response.data[0]?.embedding || []
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retries + 1))
      return getEmbedding(text, retries + 1)
    }

    throw error
  }
}

/**
 * Gets embeddings for multiple text inputs in a single batch request
 */
export async function batchGetEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return []
  }

  try {
    const client = getOpenAIClient()
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      encoding_format: 'float',
    })

    return response.data.map(item => item.embedding)
  } catch (error) {
    throw error
  }
}

/**
 * Gets cached embedding or creates new one
 */
export async function getCachedEmbedding(word: string): Promise<number[]> {
  // For now, just get the embedding directly
  // TODO: Implement caching with database
  return getEmbedding(word)
}
