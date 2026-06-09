'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd !== confirm) { setError('Passwords do not match'); return }
    if (newPwd.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/dvl/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPwd }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) { setDone(true) }
    else { setError(data.error ?? 'Failed to change password') }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dvl-indigo)' }}>
      <div className="text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
        <h2 className="text-xl font-semibold text-white mb-2">Password changed</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>Your password has been updated successfully.</p>
        <a href="/dvl/dashboard" className="btn-primary">Go to dashboard</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--dvl-indigo)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--dvl-purple)' }}>
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">DVL Dashboard</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Change password</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-white mb-2">Change password</h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Current password', value: current, set: setCurrent, placeholder: '••••••••' },
            { label: 'New password', value: newPwd, set: setNewPwd, placeholder: 'Min 8 characters' },
            { label: 'Confirm new password', value: confirm, set: setConfirm, placeholder: 'Repeat new password' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="block text-sm font-medium mb-2 text-white/70">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  required
                  className="w-full px-4 py-3 pr-10 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
                />
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setShow(s => !s)}
            className="text-xs flex items-center gap-1"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            {show ? <><EyeOff className="w-3 h-3" /> Hide passwords</> : <><Eye className="w-3 h-3" /> Show passwords</>}
          </button>

          {error && <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--dvl-purple)' }}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
