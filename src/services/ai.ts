const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined

function buildSystemPrompt(context: string): string {
  return `You are a logistics business analyst assistant. You have access to the following real-time data from the company's system:

${context || 'No business data available yet.'}

Rules:
- Answer ONLY using the data provided above. Do not make up numbers.
- Be concise. Use bullet points when helpful.
- Cite specific numbers, names, and IDs when relevant.
- If the data doesn't contain the answer, say "I don't have that data available."
- Format: use **bold** for emphasis, - for lists.`
}

async function askGemini(
  prompt: string,
  context: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const key = GEMINI_KEY
  if (!key) throw new Error('Gemini API key not configured')

  const system = buildSystemPrompt(context)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${key}&alt=sse`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${system}\n\nUser question: ${prompt}` }],
      },
    ],
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini error ${res.status}: ${err}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const json = trimmed.slice(6).trim()
      if (!json || json === '[DONE]') continue
      try {
        const parsed = JSON.parse(json)
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (text) {
          full += text
          onChunk(text)
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return full
}

async function askOpenRouter(
  prompt: string,
  context: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const key = OPENROUTER_KEY
  if (!key) throw new Error('OpenRouter API key not configured')

  const system = buildSystemPrompt(context)

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'LogiCommand ERP',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      stream: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const json = trimmed.slice(6).trim()
      if (!json || json === '[DONE]') continue
      try {
        const parsed = JSON.parse(json)
        const text = parsed.choices?.[0]?.delta?.content || ''
        if (text) {
          full += text
          onChunk(text)
        }
      } catch {
        // skip
      }
    }
  }

  return full
}

export type AIProvider = 'gemini' | 'openrouter'

export interface AIResponse {
  text: string
  provider: AIProvider
}

export async function generateAIResponse(
  prompt: string,
  context: string,
  onChunk?: (text: string) => void,
): Promise<AIResponse> {
  const preferred = (import.meta.env.VITE_AI_PROVIDER || 'gemini') as AIProvider

  if (preferred === 'gemini' && GEMINI_KEY) {
    try {
      const text = await askGemini(prompt, context, onChunk || (() => {}))
      return { text, provider: 'gemini' }
    } catch (err) {
      console.warn('Gemini failed, falling back to OpenRouter:', err)
      if (onChunk) onChunk('\n\n*(Switching to backup model...)*\n\n')
    }
  }

  if (OPENROUTER_KEY) {
    try {
      const text = await askOpenRouter(prompt, context, onChunk || (() => {}))
      return { text, provider: 'openrouter' }
    } catch (err) {
      console.error('OpenRouter also failed:', err)
      throw new Error('All AI providers failed. Please check your API keys.')
    }
  }

  throw new Error('No AI provider configured. Set VITE_GEMINI_API_KEY or VITE_OPENROUTER_API_KEY.')
}
