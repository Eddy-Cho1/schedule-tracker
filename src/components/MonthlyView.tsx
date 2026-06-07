import React from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addWeeks, eachDayOfInterval, isSameMonth, addDays
} from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useStore, getDayStats } from '../store'

function getMonthWeeks(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = endOfMonth(first)
  let ws = startOfWeek(first, { weekStartsOn: 1 })
  const weeks: Date[] = []
  while (ws <= last) { weeks.push(ws); ws = addWeeks(ws, 1) }
  return weeks
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="value" style={{ color: 'var(--accent-light)' }}>
        {payload[0].value !== null ? `${payload[0].value}%` : 'N/A'}
      </div>
    </div>
  )
}

export default function MonthlyView({
  year,
  month,
}: {
  year: number
  month: number
}) {
  const { data } = useStore()
  const weeks = getMonthWeeks(year, month)

  const weekStats = weeks.map((ws, i) => {
    const we = addDays(ws, 6)
    const days = eachDayOfInterval({ start: ws, end: we })
    const monthDays = days.filter(d => isSameMonth(d, new Date(year, month, 1)))

    let totalTasks = 0, doneTasks = 0
    for (const day of monthDays) {
      const ds = format(day, 'yyyy-MM-dd')
      const entry = data.entries[ds]
      const stats = getDayStats(entry?.tasks ?? [])
      if (stats.total > 0) { totalTasks += stats.total; doneTasks += stats.completed }
    }

    const rate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : null
    const label = `${i + 1}주`
    const range = `${format(ws, 'M/d')} ~ ${format(addDays(ws, 6), 'M/d')}`
    return { label, range, rate, total: totalTasks, done: doneTasks }
  })

  const validWeeks = weekStats.filter(w => w.rate !== null)
  const monthAvg = validWeeks.length
    ? Math.round(validWeeks.reduce((s, w) => s + (w.rate ?? 0), 0) / validWeeks.length)
    : null
  const bestWeek = validWeeks.length
    ? validWeeks.reduce((best, w) => (w.rate ?? 0) > (best.rate ?? 0) ? w : best, validWeeks[0])
    : null
  const totalDone = weekStats.reduce((s, w) => s + w.done, 0)
  const totalAll = weekStats.reduce((s, w) => s + w.total, 0)

  const rateColor = (v: number | null) =>
    v === null ? 'var(--text-3)'
    : v >= 80 ? 'var(--success)'
    : v >= 50 ? 'var(--accent-light)'
    : 'var(--danger)'

  const barGradient = (v: number | null) => {
    if (v === null) return 'var(--bg-elevated)'
    if (v >= 80) return 'linear-gradient(90deg, #34d399, #059669)'
    if (v >= 50) return 'linear-gradient(90deg, #7c6ff7, #5eead4)'
    return 'linear-gradient(90deg, #f87171, #f59e0b)'
  }

  return (
    <div>
      {/* Summary cards */}
      <div className="monthly-summary">
        <div className="card summary-card">
          <svg className="summary-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--accent-light)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="1" y="10" width="3" height="7" rx="1"/>
            <rect x="7" y="6" width="3" height="11" rx="1"/>
            <rect x="13" y="2" width="3" height="15" rx="1"/>
          </svg>
          <div className="summary-val" style={{ color: monthAvg !== null ? rateColor(monthAvg) : 'var(--text-3)' }}>
            {monthAvg !== null ? `${monthAvg}%` : '--'}
          </div>
          <div className="summary-lbl">이달 평균 달성률</div>
        </div>
        <div className="card summary-card">
          <svg className="summary-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="9 2 11.5 7 17 7.5 13 11.5 14.5 17 9 14 3.5 17 5 11.5 1 7.5 6.5 7"/>
          </svg>
          <div className="summary-val" style={{ color: 'var(--warning)' }}>
            {bestWeek ? `${bestWeek.rate}%` : '--'}
          </div>
          <div className="summary-lbl">최고 주 ({bestWeek?.label ?? '-'})</div>
        </div>
        <div className="card summary-card">
          <svg className="summary-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="9" r="7.5"/>
            <polyline points="5.5 9 8 11.5 12.5 6.5"/>
          </svg>
          <div className="summary-val" style={{ color: 'var(--success)' }}>{totalDone}</div>
          <div className="summary-lbl">완료한 일정</div>
        </div>
        <div className="card summary-card">
          <svg className="summary-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="1.5" width="14" height="15" rx="2"/>
            <line x1="5.5" y1="6" x2="12.5" y2="6"/>
            <line x1="5.5" y1="9" x2="12.5" y2="9"/>
            <line x1="5.5" y1="12" x2="9" y2="12"/>
          </svg>
          <div className="summary-val">{totalAll}</div>
          <div className="summary-lbl">전체 일정</div>
        </div>
      </div>

      {/* Week bars */}
      <div className="card weeks-table" style={{ marginBottom: 20 }}>
        <div className="chart-title" style={{ marginBottom: 20 }}>주별 달성률</div>
        {weekStats.map((w, i) => (
          <div key={i} className="weeks-row">
            <div style={{ minWidth: 30, fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>{w.label}</div>
            <div className="week-range">{w.range}</div>
            <div className="week-bar-wrap">
              <div
                className="week-bar-fill"
                style={{
                  width: w.rate !== null ? `${w.rate}%` : '0%',
                  background: barGradient(w.rate),
                }}
              />
            </div>
            <div className="week-pct-label" style={{ color: rateColor(w.rate) }}>
              {w.rate !== null ? `${w.rate}%` : '--'}
            </div>
            <div className="week-tasks-count">
              {w.total > 0 ? `${w.done}/${w.total}` : '기록 없음'}
            </div>
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div className="card chart-section">
        <div className="chart-title">월간 달성률 추이</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weekStats} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c6ff7" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#7c6ff7" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-2)', fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'var(--text-3)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />}/>
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#7c6ff7"
              strokeWidth={2.5}
              fill="url(#areaGrad)"
              dot={{ fill: '#7c6ff7', r: 5, strokeWidth: 2, stroke: '#13131f' }}
              activeDot={{ r: 7, fill: '#a89ef9', stroke: '#13131f', strokeWidth: 2 }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
