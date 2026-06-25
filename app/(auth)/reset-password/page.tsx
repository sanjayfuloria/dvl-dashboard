'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

function ResetForm() {
  const params   = useSearchParams()
  const router   = useRouter()
  const token    = params.get('token') ?? ''
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const res = await fetch('/dvl/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push('/dvl/login'), 3000)
    } else {
      setError(data.error ?? 'Something went wrong')
    }
  }

  if (!token) return (
    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
      <AlertCircle style={{ width: 48, height: 48, color: '#f87171', margin: '0 auto 16px' }}/>
      <p>Invalid reset link. Please request a new one.</p>
      <Link href="/dvl/forgot-password" style={{ color: '#a78bfa' }}>Request new link</Link>
    </div>
  )

  return done ? (
    <div style={{ textAlign: 'center' }}>
      <CheckCircle2 style={{ width: 48, height: 48, color: '#10b981', margin: '0 auto 16px' }}/>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Password updated!</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Redirecting you to login…</p>
    </div>
  ) : (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: '0 0 8px', textAlign: 'center' }}>Set new password</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 24px' }}>Choose a strong password for your DVL Dashboard account.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>New password</label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.3)' }}/>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters" required
              style={{ width: '100%', paddingLeft: 40, paddingRight: 40, paddingTop: 12, paddingBottom: 12, borderRadius: 8, fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', boxSizing: 'border-box' }}/>
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}>
              {showPw ? <EyeOff style={{ width: 16, height: 16 }}/> : <Eye style={{ width: 16, height: 16 }}/>}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>Confirm password</label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.3)' }}/>
            <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password" required
              style={{ width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 8, fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', boxSizing: 'border-box' }}/>
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '8px 12px', borderRadius: 8, marginBottom: 16 }}>{error}</p>}

        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: 'var(--dvl-purple)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? <><Loader2 style={{ width: 16, height: 16 }}/> Saving…</> : 'Set new password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1242 0%, #2d1b69 50%, #1a1242 100%)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--dvl-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <span style={{ fontSize: 22 }}>⚡</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>IFHE · Digital Venture Lab</p>
          </div>
          <Suspense fallback={<div style={{color:'white',textAlign:'center'}}>Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
