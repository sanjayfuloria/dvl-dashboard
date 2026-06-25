'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/dvl/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (res.ok) setSent(true)
    else setError('Something went wrong. Please try again.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1242 0%, #2d1b69 50%, #1a1242 100%)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 36 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--dvl-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <span style={{ fontSize: 22 }}>⚡</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              IFHE · Digital Venture Lab
            </p>
          </div>

          {!sent ? (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: '0 0 8px', textAlign: 'center' }}>Forgot password?</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 24px' }}>
                Enter your @ibsindia.org email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.3)' }}/>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your.name@ibsindia.org" required
                      style={{ width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 8, fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', boxSizing: 'border-box' }}/>
                  </div>
                </div>

                {error && <p style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '8px 12px', borderRadius: 8, marginBottom: 16 }}>{error}</p>}

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: 'var(--dvl-purple)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                  {loading ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}/> Sending…</> : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 style={{ width: 48, height: 48, color: '#10b981', margin: '0 auto 16px' }}/>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Check your email</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', lineHeight: 1.6 }}>
                If an account exists for <strong style={{ color: 'white' }}>{email}</strong>, a password reset link has been sent. Check your inbox.
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>The link expires in 1 hour.</p>
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/dvl/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft style={{ width: 14, height: 14 }}/> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
