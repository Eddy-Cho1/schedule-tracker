import React, { useState } from 'react'
import {
  format, startOfWeek, addWeeks, subWeeks,
  eachDayOfInterval, addDays, isSameDay, isToday
} from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { useStore, getDayStats } from '../store'
import { TaskCategory, CATEGORY_META } from '../types'
import AddTaskModal from './AddTaskModal'

const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="value" style={{ color: v >= 80 ? '#34d399' : v >= 50 ? '#7c6ff7' : '#f87171' }}>
        {v !== null ? `${v}%` : 'N/A'}
      </div>
    </div>
  )
}

function barColor(v: number | null) {
  if (v === null) return '#2a2a3a'
  if (v >= 80) return '#34d399'
  if (v >= 50) return '#7c6ff7'
  return '#f87171'
}

export default function WeeklyView({
  weekOffset,
  onPrev,
  onNext,
}: {
  weekOffset: number
  onPrev: () => void
  onNext: () => void
}) {
  const { data, addTask, toggleTask } = useStore()
  const [addDate, setAddDate] = useState<string | null>(null)

  const weekStart = addWeeks(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    weekOffset
  )
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

  const chartData = days.map((day, i) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const entry = data.entries[dateStr]
    const stats = getDayStats(entry?.tasks ?? [])
    return { name: DAY_NAMES[i], date: dateStr, rate: stats.rate, ...stats }
  })

  const validDays = chartData.filter(d => d.rate !== null)
  const weekAvg = validDays.length
    ? Math.round(validDays.reduce((s, d) => s + (d.rate ?? 0), 0) / validDays.length)
    : null

  return (
    <div>
      {/* Week grid */}
      <div className="weekly-grid">
        {days.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const entry = data.entries[dateStr]
          const tasks = entry?.tasks ?? []
          const { rate } = getDayStats(tasks)
          const today = isToday(day)

          const rateColor = rate === null ? 'var(--text-3)'
            : rate >= 80 ? 'var(--success)'
            : rate >= 50 ? 'var(--accent-light)'
            : 'var(--danger)'

          return (
            <div key={dateStr} className="day-col">
              <div className={`day-header ${today ? 'today' : ''}`}>
                <div className="day-name">{DAY_NAMES[i]}</div>
                <div className="day-num">{format(day, 'd')}</div>
                {rate !== null && (
                  <div
                    className="day-rate"
                    style={{
                      color: rateColor,
                      background: rate >= 80 ? 'var(--success-dim)'
                        : rate >= 50 ? 'var(--accent-dim)'
                        : 'var(--danger-dim)'
                    }}
                  >
                    {rate}%
                  </div>
                )}
              </div>

              <div className="day-tasks-list">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={`day-task-chip ${task.completed ? 'done' : ''}`}
                    onClick={() => toggleTask(dateStr, task.id)}
                    title={task.title}
                  >
                    <span className="dot" style={{ background: CATEGORY_META[task.category].color }}/>
                    {task.time && <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{task.time}</span>}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                  </div>
                ))}
                <button className="week-add-btn" onClick={() => setAddDate(dateStr)}>+ 추가</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="card chart-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="chart-title">주간 달성률</div>
          {weekAvg !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="pulse-dot"/>
              <span style={{ fontSize: 13, fontWeight: 700, color: weekAvg >= 80 ? 'var(--success)' : weekAvg >= 50 ? 'var(--accent-light)' : 'var(--danger)' }}>
                주 평균 {weekAvg}%
              </span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
            <XAxis
              dataKey="name"
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }}/>
            <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={barColor(entry.rate)} fillOpacity={entry.rate === null ? 0.3 : 1}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <AddTaskModal
        open={addDate !== null}
        date={addDate ?? ''}
        onClose={() => setAddDate(null)}
        onAdd={(task: { title: string; time?: string; category: TaskCategory }) => {
          if (addDate) addTask(addDate, task)
        }}
      />
    </div>
  )
}
