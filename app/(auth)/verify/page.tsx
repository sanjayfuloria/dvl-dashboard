import { Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8"
         style={{ background: 'var(--dvl-indigo)' }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
             style={{ background: 'rgba(124,106,247,0.15)' }}>
          <CheckCircle className="w-7 h-7" style={{ color: 'var(--dvl-purple-light)' }} />
        </div>
        <h1 className="text-xl font-semibold text-white mb-3">Sign-in link sent</h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Check your email for the sign-in link. It's valid for 24 hours.
        </p>
        <Link href="/login"
              className="text-sm underline-offset-2 underline"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
