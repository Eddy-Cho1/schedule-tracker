import React from 'react'
import { View } from '../types'

interface Props {
  view: View
  onView: (v: View) => void
}

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)

const TrendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
)

const navItems: { id: View; icon: React.ReactNode; label: string }[] = [
  { id: 'today',   icon: <CalendarIcon />, label: '오늘' },
  { id: 'weekly',  icon: <GridIcon />,     label: '주간' },
  { id: 'monthly', icon: <TrendIcon />,    label: '월간' },
]

export default function Sidebar({ view, onView }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
          <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
          <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
          <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.6"/>
        </svg>
      </div>
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-btn ${view === item.id ? 'active' : ''}`}
          onClick={() => onView(item.id)}
          title={item.label}
        >
          {item.icon}
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </aside>
  )
}
