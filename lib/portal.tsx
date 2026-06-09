'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !open) return null

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', padding: '32px 16px 64px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export function WideModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !open) return null

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', padding: '32px 16px 64px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 640, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
        {children}
      </div>
    </div>,
    document.body
  )
}
