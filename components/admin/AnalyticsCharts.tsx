'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'

const COLORS = ['#7c6af7', '#0d9488', '#d97706', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

interface Props {
  phaseData: { phase: string; count: number }[]
  courseData: { course: string; count: number }[]
  aiToolData: { tool: string; count: number }[]
  healthData: { health: string; count: number }[]
  evalScoreData: { phase: string; avgScore: number; count: number }[]
}

export function AnalyticsCharts({ phaseData, courseData, aiToolData, healthData, evalScoreData }: Props) {
  const HEALTH_COLORS: Record<string, string> = {
    'On Track': '#10b981',
    'At Risk': '#d97706',
    'Delayed': '#ef4444',
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Phase dist + Health */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="mb-5">Teams by phase</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={phaseData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="phase" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                cursor={{ fill: '#f9fafb' }}
              />
              <Bar dataKey="count" name="Teams" radius={[4, 4, 0, 0]}>
                {phaseData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-5">Project health</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={healthData.filter(d => d.count > 0)}
                dataKey="count"
                nameKey="health"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ health, count }) => `${health}: ${count}`}
                labelLine={false}
              >
                {healthData.map((entry, i) => (
                  <Cell key={i} fill={HEALTH_COLORS[entry.health] ?? COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: AI tools */}
      <div className="card">
        <h3 className="mb-5">AI tool usage across all teams</h3>
        {aiToolData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={aiToolData} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis dataKey="tool" type="category" tick={{ fontSize: 12 }} width={110} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                cursor={{ fill: '#f9fafb' }}
              />
              <Bar dataKey="count" name="Usage count" fill="#7c6af7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state py-10">
            <p className="text-sm">No AI log entries recorded yet</p>
          </div>
        )}
      </div>

      {/* Row 3: Evaluation scores + Course split */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="mb-5">Average evaluation scores by phase</h3>
          {evalScoreData.some(d => d.avgScore > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={evalScoreData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="phase" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  formatter={(v: number) => [`${v} / 10`, 'Avg score']}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="avgScore" name="Avg score" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state py-10">
              <p className="text-sm">No evaluations submitted yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-5">Teams by course</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={courseData.filter(d => d.count > 0)}
                dataKey="count"
                nameKey="course"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ course, count }) => `${course}: ${count}`}
              >
                {courseData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#7c6af7' : '#0d9488'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
