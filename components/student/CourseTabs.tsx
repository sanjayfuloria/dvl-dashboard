import Link from 'next/link'

// Same course color mapping used on the /team page, kept in sync so a
// course reads as the same color everywhere in the student area.
const COURSE_COLORS: Record<string, string> = {
  MDT: '#5B4BD4',
  MPB: '#0D9488',
  B2B: '#F59E0B',
}
const FALLBACK_COLOR = '#6B7280'

export function CourseTabs({
  courses,
  active,
  basePath,
}: {
  courses: string[]
  active: string
  basePath: string
}) {
  // Single-team students (the common case) see no change at all.
  if (courses.length <= 1) return null

  return (
    <div className="flex items-center gap-2 mb-5" role="tablist" aria-label="Select course">
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        You're on {courses.length} teams:
      </span>
      {courses.map((c) => {
        const color = COURSE_COLORS[c] ?? FALLBACK_COLOR
        const isActive = c === active
        return (
          <Link
            key={c}
            href={`${basePath}?course=${encodeURIComponent(c)}`}
            role="tab"
            aria-selected={isActive}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
            style={{
              background: isActive ? color : 'white',
              color: isActive ? 'white' : color,
              borderColor: color,
            }}
          >
            {c}
          </Link>
        )
      })}
    </div>
  )
}
