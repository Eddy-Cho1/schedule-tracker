import React, { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { AnimatePresence } from 'framer-motion'
import { useStore, getDayStats } from '../store'
import { TaskCategory } from '../types'
import TaskItem from './TaskItem'
import AddTaskModal from './AddTaskModal'

const TODAY = format(new Date(), 'yyyy-MM-dd')

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function ProgressRing({ pct, size = 140 }: { pct: number; size?: number }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const gap = circ - dash
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#7c6ff7' : '#f87171'

  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8}/>
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="ring-center">
        <div className="ring-pct" style={{ color }}>{pct}%</div>
        <div className="ring-sub">달성률</div>
      </div>
    </div>
  )
}

export default function TodayView() {
  const { data, addTask, toggleTask, deleteTask } = useStore()
  const [modalOpen, setModalOpen] = useState(false)

  const entry = data.entries[TODAY]
  const tasks = entry?.tasks ?? []
  const { total, completed, rate } = getDayStats(tasks)

  const now = new Date()
  const weekday = WEEKDAY_KO[now.getDay()]
  const dateStr = format(now, 'M월 d일', { locale: ko })

  function handleAdd(task: { title: string; time?: string; category: TaskCategory }) {
    addTask(TODAY, task)
  }

  const doneTasks = tasks.filter(t => t.completed)
  const pendingTasks = tasks.filter(t => !t.completed)

  return (
    <div className="today-root">
      <div className="today-header">
        <div className="today-weekday">{weekday}요일</div>
        <div className="today-date gradient-text">{dateStr}</div>
      </div>

      <div className="today-grid">
        {/* Left: task list */}
        <div className="today-tasks-col">
          <div className="task-section-header">
            <span className="section-title">오늘의 일정</span>
            <button className="add-btn" onClick={() => setModalOpen(true)}>
              <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="6" y1="1" x2="6" y2="11"/>
                <line x1="1" y1="6" x2="11" y2="6"/>
              </svg>
              일정 추가
            </button>
          </div>

          <div className="tasks-scroll">
            {tasks.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>오늘의 일정을 추가해보세요</p>
              </div>
            ) : (
              <div className="task-list">
                {/* Pending first */}
                <AnimatePresence mode="popLayout">
                  {pendingTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTask(TODAY, task.id)}
                      onDelete={() => deleteTask(TODAY, task.id)}
                    />
                  ))}
                </AnimatePresence>
                {/* Completed */}
                {doneTasks.length > 0 && (
                  <>
                    {pendingTasks.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>완료됨</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
                      </div>
                    )}
                    <AnimatePresence mode="popLayout">
                      {doneTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={() => toggleTask(TODAY, task.id)}
                          onDelete={() => deleteTask(TODAY, task.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: stats */}
        <div className="today-aside">
          <div className="card ring-card">
            <ProgressRing pct={rate ?? 0} />
            <div className="ring-label">
              <div className="count" style={{ color: 'var(--text-1)' }}>
                {completed} / {total}
              </div>
              <div className="desc">완료 / 전체</div>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat-mini card">
              <div className="val" style={{ color: 'var(--success)' }}>{completed}</div>
              <div className="lbl">완료</div>
            </div>
            <div className="stat-mini card">
              <div className="val" style={{ color: 'var(--warning)' }}>{total - completed}</div>
              <div className="lbl">남은 것</div>
            </div>
          </div>

          {rate !== null && rate >= 100 && (
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <svg width={32} height={32} viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto 10px', display: 'block' }}>
                <circle cx="16" cy="16" r="15" stroke="var(--success)" strokeWidth="2" fill="rgba(52,211,153,0.08)"/>
                <polyline points="10 16 14 20 22 12" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>오늘 모두 완료</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>계속 유지하세요</div>
            </div>
          )}
        </div>
      </div>

      <AddTaskModal
        open={modalOpen}
        date={TODAY}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  )
}
