'use client'

import { useState } from 'react'
import { MessageSquare, Star, Send, X, CheckCircle, ChevronDown } from 'lucide-react'

const TYPES = ['General', 'Bug Report', 'Feature Request', 'Content Error', 'Other']

export default function FeedbackWidget() {
  const [open, setOpen]       = useState(false)
  const [type, setType]       = useState('General')
  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [message, setMessage] = useState('')
  const [email, setEmail]     = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const reset = () => {
    setType('General'); setRating(0); setHover(0)
    setMessage(''); setEmail(''); setSent(false); setError('')
  }

  const submit = async () => {
    if (!message.trim() || message.trim().length < 5) {
      setError('Please write at least a few words.'); return
    }
    if (!rating) {
      setError('Please give a star rating.'); return
    }
    setError(''); setSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, rating, message: message.trim(),
          email: email.trim() || undefined,
          page: typeof window !== 'undefined' ? window.location.pathname : '/',
        }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setError('Could not send — please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        onClick={() => { setOpen(true); reset() }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: '#000',
          boxShadow: '0 4px 20px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.4)',
        }}
        aria-label="Send feedback"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Feedback</span>
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-black/60"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer / Modal ── */}
      {open && (
        <div
          className="fixed bottom-0 right-0 z-[100] w-full sm:w-[420px] sm:bottom-20 sm:right-6 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(10,6,28,0.98)',
            border: '1px solid rgba(245,158,11,0.2)',
            boxShadow: '0 0 0 1px rgba(245,158,11,0.08), 0 32px 64px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <h3 className="text-white font-black text-base">Share your feedback</h3>
              <p className="text-white/35 text-xs mt-0.5">Sent directly to the NammaTamil team</p>
            </div>
            <button onClick={() => setOpen(false)}
              className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/05 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center py-12 px-5 gap-4">
              <CheckCircle className="w-14 h-14 text-green-400" />
              <h4 className="text-white font-black text-lg">Thank you!</h4>
              <p className="text-white/45 text-sm text-center">Your feedback has been received. We read every message.</p>
              <button
                onClick={() => { reset(); setOpen(false) }}
                className="mt-2 px-6 py-2.5 rounded-xl font-bold text-sm text-black"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}
              >
                Close
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-4">

              {/* Type selector */}
              <div className="relative">
                <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wide">Type</label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full appearance-none rounded-xl px-3.5 py-2.5 text-sm text-white outline-none pr-8"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {TYPES.map(t => <option key={t} value={t} style={{ background: '#0a061c' }}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                </div>
              </div>

              {/* Star rating */}
              <div>
                <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wide">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className="w-7 h-7 transition-colors"
                        style={{
                          color: n <= (hover || rating) ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                          fill:  n <= (hover || rating) ? '#f59e0b' : 'transparent',
                        }}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-amber-400 text-xs self-center font-semibold">
                      {['','Poor','Fair','Good','Great','Excellent'][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wide">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us what you think, found a bug, or have a suggestion…"
                  rows={4}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <p className="text-white/20 text-[10px] mt-1 text-right">{message.length}/500</p>
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-white/50 text-xs font-semibold mb-1.5 uppercase tracking-wide">
                  Your email <span className="normal-case font-normal text-white/25">(optional — for replies)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-xs px-1">{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={submit}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-black transition-all active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Feedback
                  </>
                )}
              </button>

              <p className="text-white/15 text-[10px] text-center">
                Goes directly to the NammaTamil team · We read every message
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
