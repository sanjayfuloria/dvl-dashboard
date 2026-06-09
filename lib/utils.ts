import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function phaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    IDEATION: 'Phase 1: Ideation',
    PROTOTYPE: 'Phase 2: Prototype',
    MVP: 'Phase 3: MVP',
    COMPLETED: 'Completed',
  }
  return labels[phase] ?? phase
}

export function phaseColor(phase: string): string {
  const colors: Record<string, string> = {
    IDEATION: 'bg-amber-100 text-amber-800',
    PROTOTYPE: 'bg-blue-100 text-blue-800',
    MVP: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
  }
  return colors[phase] ?? 'bg-gray-100 text-gray-700'
}

export function healthColor(health: string): string {
  const colors: Record<string, string> = {
    ON_TRACK: 'text-green-600',
    AT_RISK: 'text-amber-600',
    DELAYED: 'text-red-600',
  }
  return colors[health] ?? 'text-gray-500'
}

export function healthLabel(health: string): string {
  const labels: Record<string, string> = {
    ON_TRACK: 'On Track',
    AT_RISK: 'At Risk',
    DELAYED: 'Delayed',
  }
  return labels[health] ?? health
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    SUBMITTED: 'bg-yellow-100 text-yellow-700',
    REVIEWED: 'bg-purple-100 text-purple-700',
    APPROVED: 'bg-green-100 text-green-700',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-600'
}

export function roleRedirect(role: string): string {
  const redirects: Record<string, string> = {
    STUDENT: '/dashboard',
    FACULTY: '/faculty/dashboard',
    MENTOR: '/mentor/dashboard',
    ADMIN: '/admin/dashboard',
  }
  return redirects[role] ?? '/dashboard'
}

export function calculateEvaluationScore(evaluation: Record<string, number | null>): number {
  const scores = Object.values(evaluation).filter((v) => typeof v === 'number') as number[]
  if (scores.length === 0) return 0
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}
