export type TaskCategory = 'work' | 'health' | 'learning' | 'personal' | 'other'

export interface Task {
  id: string
  title: string
  time?: string
  category: TaskCategory
  completed: boolean
}

export interface DayEntry {
  date: string
  tasks: Task[]
}

export interface ScheduleData {
  entries: Record<string, DayEntry>
}

export type View = 'today' | 'weekly' | 'monthly' | 'shared' | 'friends'

export const CATEGORY_META: Record<TaskCategory, { label: string; color: string; bg: string }> = {
  work:     { label: '업무',   color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  health:   { label: '건강',   color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  learning: { label: '학습',   color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  personal: { label: '개인',   color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  other:    { label: '기타',   color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
}
