'use client'

import { useState } from 'react'
import { Loader2, Mail, Lock, ArrowRight, Zap } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check for error in URL
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err && !error) setError('Invalid email or password')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--dvl-indigo)' }}>
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12"
           style={{ background: 'rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--dvl-purple)' }}>
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

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-white mb-2">Sign in</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Enter your email and password to access the DVL Dashboard.
          </p>
          <form
            method="POST"
            action="/dvl/api/login"
            encType="application/x-www-form-urlencoded"
            onSubmit={() => setLoading(true)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input type="email" name="email"
                  placeholder="you@ifhe.edu.in" required
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input type="password" name="password"
                  placeholder="••••••••" required
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
              </div>
            </div>
            {error && <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
            <div style={{ textAlign: 'right', marginBottom: 4 }}>
              <a href="/dvl/forgot-password" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                onMouseOver={e=>(e.currentTarget.style.color='rgba(255,255,255,0.7)')}
                onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.4)')}>
                Forgot password?
              </a>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--dvl-purple)' }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <p className="mt-6 text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
