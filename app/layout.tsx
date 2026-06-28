import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    template: '%s | DVL Dashboard',
    default: 'Digital Venture Lab — IFHE Hyderabad',
  },
  description: 'The operating system for the Digital Venture Lab at ICFAI Foundation for Higher Education.',
  manifest: '/dvl/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DVL Dashboard',
  },
  icons: {
    icon: '/dvl/icons/icon-192.png',
    apple: '/dvl/icons/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface font-sans antialiased">
        {children}
        <Toaster />
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/dvl/sw.js', { scope: '/dvl/' })
                .then(function(reg) { console.log('SW registered:', reg.scope); })
                .catch(function(err) { console.log('SW failed:', err); });
            });
          }
        `}} />
      </body>
    </html>
  )
}
