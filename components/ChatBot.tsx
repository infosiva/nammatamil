'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// TamilBot — amber/gold theme, bottom-LEFT, Tamil entertainment assistant
const ACCENT = '#f59e0b'
const BOT_NAME = 'TamilBot'
const WELCOME = '🎬 Vanakkam! I\'m TamilBot — your Tamil entertainment guide. Ask me about Tamil serials, movies, OTT, cricket, or anything Tamil!'
const SYSTEM_PROMPT = `You are TamilBot, the friendly AI assistant for NammaTamil.tv — a Tamil entertainment hub.
Help users discover Tamil serials, movies, OTT content, music albums, cricket updates, and more.
Answer in a friendly, enthusiastic tone. Mix English and Tamil words naturally when appropriate (e.g., "Super-a irukku!", "Romba nalla choice!").
Suggest content based on what users enjoy. Keep responses short and helpful.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, systemPrompt: SYSTEM_PROMPT }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Floating button — bottom-LEFT */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open TamilBot'}
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(245,158,11,0.45)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Chat panel — bottom-LEFT */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, left: 24, zIndex: 9998,
          width: 360, height: 500, borderRadius: 16,
          background: '#100c02', border: '1px solid rgba(245,158,11,0.3)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 40px rgba(245,158,11,0.10)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'tamil-slide-up 0.22s ease-out',
        }}>
          <style>{`
            @keyframes tamil-slide-up {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .tamil-msg::-webkit-scrollbar { width: 4px; }
            .tamil-msg::-webkit-scrollbar-track { background: transparent; }
            .tamil-msg::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.3); border-radius: 2px; }
            @keyframes tamil-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(220,38,38,0.08) 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, boxShadow: '0 0 12px rgba(245,158,11,0.4)',
              }}>🎬</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{BOT_NAME}</div>
                <div style={{ color: '#fcd34d', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>
                  Tamil entertainment · Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="tamil-msg" style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px 6px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(245,158,11,0.08)',
                  border: m.role === 'user' ? 'none' : '1px solid rgba(245,158,11,0.2)',
                  color: m.role === 'user' ? '#0a0600' : '#f0f0f0',
                  fontSize: 13.5, lineHeight: 1.5,
                  wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: ACCENT, display: 'inline-block',
                      animation: `tamil-bounce 1.2s ${d * 0.2}s infinite ease-in-out`,
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px', borderTop: '1px solid rgba(245,158,11,0.15)',
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask about Tamil content…"
              disabled={loading}
              style={{
                flex: 1, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 10, padding: '9px 13px', color: '#f0f0f0',
                fontSize: 13.5, outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = ACCENT)}
              onBlur={e => (e.target.style.borderColor = 'rgba(245,158,11,0.25)')}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                background: input.trim() && !loading ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.06)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s', flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? '#0a0600' : '#fff'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
