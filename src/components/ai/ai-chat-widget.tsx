import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { generateAIResponse, type AIProvider } from '@/services/ai'
import { useBusinessContext } from '@/hooks/useBusinessContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  provider?: AIProvider
}

const suggestions = [
  'What is our current gross margin?',
  'Show top 5 profitable customers',
  'Any shipments delayed today?',
  'Which lanes have lowest margin?',
]

function renderMarkdown(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''

      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const items = trimmed
          .split('\n')
          .filter(l => l.trim().startsWith('- ') || l.trim().startsWith('• '))
          .map(l => `  • ${l.replace(/^[-•]\s+/, '').trim()}`)
          .join('\n')
        return items
      }

      if (trimmed.startsWith('**') && trimmed.includes('**\n')) {
        const [title, ...rest] = trimmed.split('\n')
        const body = rest.join('\n').trim()
        return `**${title.replace(/\*\*/g, '').trim()}**\n${body}`
      }

      return trimmed
    })
    .join('\n\n')
}

function formatLine(line: string): string {
  let result = line
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
  return result
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I can help you explore your logistics data. Ask me anything about shipments, customers, finances, or operations.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { context, isLoading: ctxLoading } = useBusinessContext()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const userMsg = (text || input).trim()
    if (!userMsg || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    const msgId = Date.now()
    setMessages((prev) => [...prev, { role: 'assistant', content: '', provider: 'gemini' }])

    let accumulated = ''
    let finalProvider: AIProvider = 'gemini'

    try {
      const result = await generateAIResponse(userMsg, context, (chunk) => {
        accumulated += chunk
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last.role === 'assistant') {
            next[next.length - 1] = { ...last, content: accumulated, provider: finalProvider }
          }
          return next
        })
      })
      finalProvider = result.provider
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last.role === 'assistant') {
          next[next.length - 1] = { ...last, content: result.text, provider: result.provider }
        }
        return next
      })
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last.role === 'assistant') {
          next[next.length - 1] = {
            ...last,
            content: 'Sorry, I encountered an error. Please check your API keys and try again.',
          }
        }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  const hasConfig = !!(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY)

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-[500px] bg-card border rounded-lg shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <span className="text-sm font-medium">AI Assistant</span>
              {!hasConfig && (
                <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded">demo</span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-80">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="space-y-1">
                      {msg.provider && hasConfig && (
                        <div className="flex items-center gap-1 mb-1 opacity-60">
                          <Bot size={10} />
                          <span className="text-[10px] uppercase tracking-wider">{msg.provider}</span>
                        </div>
                      )}
                      {msg.content ? (
                        <div
                          className="space-y-1 [&_strong]:font-semibold"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(msg.content)
                              .split('\n')
                              .map(line => line.trim())
                              .filter(Boolean)
                              .map(line => {
                                if (line.startsWith('  • ') || line.startsWith('• ')) {
                                  return `<li class="ml-4 list-disc text-sm">${formatLine(line.replace(/^[•\s]+/, ''))}</li>`
                                }
                                return `<p class="text-sm">${formatLine(line)}</p>`
                              })
                              .join(''),
                          }}
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />

            {messages.length === 1 && (
              <div className="space-y-1.5 mt-3">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    disabled={loading}
                    className="block w-full text-left text-xs p-2 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
                {!hasConfig && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Set VITE_GEMINI_API_KEY in .env to connect a real AI model.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend() }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={ctxLoading ? 'Loading business data...' : 'Ask about your business...'}
                className="h-9 text-sm"
                disabled={loading || ctxLoading}
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || ctxLoading || !input.trim()}>
                <Send size={14} />
              </Button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors',
          open ? 'bg-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </>
  )
}
