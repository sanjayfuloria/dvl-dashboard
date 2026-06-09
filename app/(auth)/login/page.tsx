'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Loader2, Mail, ArrowRight, Zap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn('email', {
        email: email.toLowerCase().trim(),
        redirect: false,
        callbackUrl: '/api/auth/redirect',
      })
      if (result?.error) {
        setError('Something went wrong. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Unable to send email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--dvl-indigo)' }}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12"
           style={{ background: 'rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--dvl-purple)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">DVL Dashboard</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>IFHE Hyderabad</p>
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-white leading-tight mb-4">
            From ideas to<br />working products.
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            The Digital Venture Lab operating system — manage your venture journey from ideation through prototype to MVP.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { phase: 'Phase 1', title: 'Ideation & Validation', color: 'var(--dvl-amber)' },
            { phase: 'Phase 2', title: 'Prototype & Design', color: 'var(--dvl-purple-light)' },
            { phase: 'Phase 3', title: 'MVP & Launch', color: 'var(--dvl-teal)' },
          ].map((item) => (
            <div key={item.phase} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span className="font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.phase}</span>
                {' — '}{item.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--dvl-purple)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">DVL Dashboard</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>IFHE Hyderabad</p>
            </div>
          </div>

          {!sent ? (
            <>
              <h2 className="text-2xl font-semibold text-white mb-2">Sign in</h2>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                We'll send a sign-in link to your email. No password needed.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/70">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                          style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@ifhe.edu.in"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--dvl-purple)'
                        e.target.style.boxShadow = '0 0 0 3px rgba(124,106,247,0.2)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.12)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--dvl-purple)' }}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending link...</>
                  ) : (
                    <>Send sign-in link <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p className="mt-6 text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                For IFHE students, faculty, and mentors only.
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                   style={{ background: 'rgba(124,106,247,0.15)' }}>
                <Mail className="w-7 h-7" style={{ color: 'var(--dvl-purple-light)' }} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Check your inbox</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                We sent a sign-in link to<br />
                <span className="font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{email}</span>
              </p>
              <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                The link expires in 24 hours. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-6 text-sm underline-offset-2 underline"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
