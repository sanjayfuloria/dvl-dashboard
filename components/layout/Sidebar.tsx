'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getBaseUrl } from '@/lib/site-url'
import {
  Zap, LayoutDashboard, Rocket, CheckSquare, Bot,
  Users, ClipboardList, BarChart3, Settings, LogOut, ChevronRight,
  Briefcase, FileText, Star, Home, UserCog, Library, Trophy, Lock, Mail,
  TrendingUp, Calendar, Menu, X
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ElementType }
type NavSection = { label?: string; items: NavItem[] }

const studentNav: NavSection[] = [
  { items: [{ href: '/dashboard', label: 'Home', icon: Home }] },
  { label: 'My Venture', items: [
    { href: '/team', label: 'My Team', icon: Users },
    { href: '/venture', label: 'Project Profile', icon: Rocket },
    { href: '/milestones', label: 'Milestones', icon: CheckSquare },
    { href: '/ai-log', label: 'AI Build Log', icon: Bot },
    { href: '/reflections', label: 'Reflections', icon: FileText },
  ]},
  { label: 'Learn', items: [
    { href: '/resources', label: 'Knowledge Hub', icon: Library },
    { href: '/portfolio', label: 'My Portfolio', icon: Star },
    { href: '/change-password', label: 'Change Password', icon: Lock },
  ]},
]

const adminNav: NavSection[] = [
  { items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Manage', items: [
    { href: '/admin/students', label: 'Students', icon: UserCog },
    { href: '/admin/users', label: 'Faculty & Staff', icon: Users },
    { href: '/admin/teams', label: 'Teams', icon: Briefcase },
    { href: '/admin/milestones', label: 'Milestones', icon: CheckSquare },
    { href: '/admin/resources', label: 'Resources', icon: Library },
  ]},
  { label: 'Reports', items: [
    { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/admin/demo-day', label: 'Demo Day', icon: Trophy },
  ]},
  { label: 'System', items: [
    { href: '/admin/messages', label: 'Messages', icon: Mail },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/change-password', label: 'Change Password', icon: Lock },
  ]},
]

const facultyNav: NavSection[] = [
  { items: [{ href: '/faculty/dashboard', label: 'Overview', icon: LayoutDashboard }] },
  { label: 'Teams', items: [
    { href: '/faculty/teams', label: 'All Teams', icon: Users },
    { href: '/faculty/evaluations', label: 'Evaluations', icon: ClipboardList },
  ]},
  { label: 'Reports', items: [
    { href: '/faculty/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/faculty/reflections', label: 'Reflections', icon: FileText },
  ]},
]

const mentorNav: NavSection[] = [
  { items: [
    { href: '/mentor/dashboard', label: 'Overview', icon: Home },
    { href: '/mentor/teams', label: 'My Teams', icon: Users },
    { href: '/mentor/sessions', label: 'Sessions', icon: Calendar },
  ]},
]

const roleNav: Record<string, NavSection[]> = {
  STUDENT: studentNav, FACULTY: facultyNav, MENTOR: mentorNav, ADMIN: adminNav,
}
const roleLabel: Record<string, string> = {
  STUDENT: 'Student Portal', FACULTY: 'Faculty Portal', MENTOR: 'Mentor Portal', ADMIN: 'Admin Panel',
}

interface SidebarProps { role: string; userName?: string | null; userEmail?: string | null }

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const nav = roleNav[role] ?? studentNav
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const NavContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      <div className="sidebar-logo">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--dvl-purple)' }}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white text-[13px] font-semibold leading-none">DVL Dashboard</p>
            <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{roleLabel[role]}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {nav.map((section, i) => (
          <div key={i}>
            {section.label && <p className="sidebar-section-label">{section.label}</p>}
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link key={item.href} href={item.href} className={cn('sidebar-nav-item', active && 'active')}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-[13px]">{item.label}</span>
                    {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold text-white" style={{ background: 'var(--dvl-purple)' }}>
            {userName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-medium truncate">{userName ?? 'User'}</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{userEmail}</p>
          </div>
          <button onClick={() => fetch('/dvl/api/logout', { method: 'POST' }).then(() => window.location.href = `${getBaseUrl()}/login`)}
            title="Sign out" className="p-1.5 rounded-md" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar hidden md:flex">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14"
        style={{ background: 'var(--dvl-indigo)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => setOpen(true)} className="p-1.5 rounded-md" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--dvl-purple)' }}>
            <Zap className="w-3 h-3 text-white" />
          </div>
          <p className="text-white text-[13px] font-semibold">DVL Dashboard</p>
        </div>
        <div className="flex-1" />
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white" style={{ background: 'var(--dvl-purple)' }}>
          {userName?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full" style={{ background: 'var(--dvl-indigo)', zIndex: 51 }}>
            <NavContent onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
