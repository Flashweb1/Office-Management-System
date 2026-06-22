import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const suggestions = [
  'Show top 5 profitable customers',
  'Any shipments delayed today?',
  'What is our current AR aging?',
  'Which lanes have lowest margin?',
]

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I can help you explore your logistics data. Ask me anything about shipments, customers, finances, or operations.' },
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])

    // Simulate AI response - in production this calls a Cloud Function
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Here's what I found about "${userMsg}" — this feature will be connected to your Firebase + OpenAI backend in the next phase. For now, I can show you sample data and insights. Would you like to see a specific report?`,
        },
      ])
    }, 1000)
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-[500px] bg-card border rounded-lg shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <span className="text-sm font-medium">AI Assistant</span>
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
                  {msg.content}
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
                    onClick={() => { setInput(s); handleSend() }}
                    className="block w-full text-left text-xs p-2 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
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
                placeholder="Ask about your business..."
                className="h-9 text-sm"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
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
