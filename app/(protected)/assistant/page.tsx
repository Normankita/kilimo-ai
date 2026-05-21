'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sprout, Send, Bot, User, AlertTriangle } from 'lucide-react'
import { AssistantTour } from '@/components/tutorial/assistant-tour'

interface Message { role: 'user' | 'assistant'; content: string }

export default function AssistantPage() {
  const { t } = useLanguage()
  const reduced = useReducedMotion()

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t.assistant.greeting },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || t.assistant.networkError)
        setLoading(false)
        return
      }

      const finalMessages = [...newMessages, { role: 'assistant' as const, content: data.content }]
      setMessages(finalMessages)

      // persist in background
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        supabase.from('ai_conversations').upsert({
          user_id: user.id,
          messages: finalMessages,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }
    } catch {
      setError(t.assistant.networkError)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] -m-4 md:-m-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--primary)' }}>
          <Sprout className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{t.assistant.title}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.assistant.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div id="assistant-messages" className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ backgroundColor: 'var(--surface-2)' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              initial={reduced ? {} : { opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center self-end ${
                msg.role === 'assistant' ? '' : ''
              }`} style={{ backgroundColor: msg.role === 'assistant' ? 'var(--primary)' : 'var(--accent)' }}>
                {msg.role === 'assistant'
                  ? <Bot className="h-3.5 w-3.5 text-white" />
                  : <User className="h-3.5 w-3.5 text-white" />
                }
              </div>

              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm shadow-sm'
                }`}
                style={msg.role === 'user'
                  ? { backgroundColor: 'var(--primary)', color: 'var(--primary-fg)' }
                  : { backgroundColor: 'var(--surface)', color: 'var(--text)' }
                }
              >
                {msg.content.split('\n').map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center self-end"
              style={{ backgroundColor: 'var(--primary)' }}>
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm"
              style={{ backgroundColor: 'var(--surface)' }}>
              <div className="flex gap-1.5 items-center">
                {[0, 150, 300].map((delay, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: 'var(--primary)',
                      animation: `bounce-dot 1.2s ${delay}ms infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            className="flex items-center justify-center gap-2 text-xs py-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span style={{ color: 'var(--text-muted)' }}>{error}</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions (first message only) */}
      {messages.length === 1 && !loading && (
        <div className="px-4 py-2" style={{ backgroundColor: 'var(--surface-2)' }}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {t.assistant.suggestions.map((s, i) => (
              <motion.button
                key={i}
                onClick={() => sendMessage(s)}
                className="shrink-0 text-xs border rounded-full px-3 py-1.5 transition-all"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                whileHover={{ scale: 1.03, backgroundColor: 'var(--surface-2)' }}
                whileTap={{ scale: 0.97 }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); sendMessage(input) }}
        className="flex gap-2 px-4 py-3 border-t"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Input
          id="assistant-chat-input"
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t.assistant.placeholder}
          disabled={loading}
          className="flex-1"
        />
        <Button id="assistant-send-button" type="submit" disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <AssistantTour />
    </div>
  )
}
