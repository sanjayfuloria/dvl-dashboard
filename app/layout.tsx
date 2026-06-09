import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | DVL Dashboard',
    default: 'Digital Venture Lab — IFHE Hyderabad',
  },
  description: 'The operating system for the Digital Venture Lab at ICFAI Foundation for Higher Education.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
