import React, { useEffect, useState } from 'react'
import { format, addMonths, subMonths, startOfWeek, addWeeks, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { View } from './types'
import Sidebar from './components/Sidebar'
import TodayView from './components/TodayView'
import WeeklyView from './components/WeeklyView'
import MonthlyView from './components/MonthlyView'
import SharedView from './components/SharedView'
import NotificationBell from './components/NotificationBell'
import { syncSchedule, isPushEnabled } from './lib/push'

const TODAY_KEY = format(new Date(), 'yyyy-MM-dd')

const ChevronLeft = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="10 4 6 8 10 12"/>
  </svg>
)
const ChevronRight = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 4 10 8 6 12"/>
  </svg>
)

const VIEW_LABELS: Record<View, string> = {
  today:   '오늘',
  weekly:  '주간',
  monthly: '월간',
  shared:  '공동 일정',
}

export default function App() {
  const { load, loading, data: storeData } = useStore()
  const [view, setView] = useState<View>('today')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthDate, setMonthDate] = useState(new Date())

  // 초대 링크 (?join=ROOMCODE) 처리 — 마운트 시 1회만 읽고 URL 정리
  const [inviteCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('join')?.toUpperCase() ?? null
    if (code) window.history.replaceState({}, '', '/')
    return code
  })

  useEffect(() => { load() }, [])
  useEffect(() => { if (inviteCode) setView('shared') }, [inviteCode])

  // 오늘 일정 변경 시 서버에 sync (푸시 알림용)
  useEffect(() => {
    if (!isPushEnabled()) return
    const tasks = storeData.entries[TODAY_KEY]?.tasks ?? []
    syncSchedule(tasks)
  }, [storeData.entries[TODAY_KEY]?.tasks?.length])

  const now = new Date()
  const todayLabel = format(now, 'yyyy년 M월 d일 (E)', { locale: ko })

  // Compute week label
  const weekLabel = (() => {
    const ws = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), weekOffset)
    const we = addDays(ws, 6)
    return `${format(ws, 'M/d')} ~ ${format(we, 'M/d')} 주`
  })()

  const monthLabel = format(monthDate, 'yyyy년 M월', { locale: ko })

  const periodLabel =
    view === 'today' ? todayLabel
    : view === 'weekly' ? weekLabel
    : monthLabel

  function handlePrev() {
    if (view === 'weekly') setWeekOffset(o => o - 1)
    else if (view === 'monthly') setMonthDate(d => subMonths(d, 1))
  }
  function handleNext() {
    if (view === 'weekly') setWeekOffset(o => o + 1)
    else if (view === 'monthly') setMonthDate(d => addMonths(d, 1))
  }
  function handleToday() {
    setWeekOffset(0)
    setMonthDate(new Date())
  }

  const showNav = view !== 'today' && view !== 'shared'

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
          <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
          <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
          <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
        </svg>
      </div>
      <span style={{ fontSize: 13 }}>불러오는 중...</span>
    </div>
  )

  return (
    <div className="app-shell">
      <Sidebar view={view} onView={setView} />

      <div className="main">
        {/* Top bar */}
        <div className="topbar">
          <span className="topbar-title">{VIEW_LABELS[view]}</span>
          <div className="topbar-spacer"/>
          <NotificationBell />
          {showNav && (
            <div className="topbar-nav">
              <button className="icon-btn" onClick={handlePrev}><ChevronLeft /></button>
              <span className="topbar-period">{periodLabel}</span>
              <button className="icon-btn" onClick={handleNext}><ChevronRight /></button>
              <button
                className="icon-btn"
                onClick={handleToday}
                title="오늘로"
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-light)', width: 'auto', padding: '0 10px' }}
              >
                오늘
              </button>
            </div>
          )}
          {!showNav && (
            <span className="topbar-period" style={{ fontSize: 12 }}>{periodLabel}</span>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            className="view-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {view === 'today' && <TodayView />}
            {view === 'weekly' && (
              <WeeklyView
                weekOffset={weekOffset}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            )}
            {view === 'monthly' && (
              <MonthlyView
                year={monthDate.getFullYear()}
                month={monthDate.getMonth()}
              />
            )}
            {view === 'shared' && <SharedView initialCode={inviteCode} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
