import { create } from 'zustand'
import { ScheduleData, Task, TaskCategory } from './types'

const LS_KEY = 'makeyourself_schedule'

function loadFromStorage(): ScheduleData {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : { entries: {} }
  } catch {
    return { entries: {} }
  }
}

function saveToStorage(data: ScheduleData): void {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function uid(): string {
  return crypto.randomUUID()
}

interface Store {
  data: ScheduleData
  loading: boolean
  load: () => void
  addTask: (date: string, task: { title: string; time?: string; category: TaskCategory }) => void
  toggleTask: (date: string, taskId: string) => void
  deleteTask: (date: string, taskId: string) => void
  reorderTasks: (date: string, tasks: Task[]) => void
}

export const useStore = create<Store>((set, get) => ({
  data: { entries: {} },
  loading: true,

  load: () => {
    const data = loadFromStorage()
    set({ data, loading: false })
  },

  addTask: (date, taskInput) => {
    const { data } = get()
    const entry = data.entries[date] ?? { date, tasks: [] }
    const task: Task = { id: uid(), completed: false, ...taskInput }
    const next: ScheduleData = {
      entries: {
        ...data.entries,
        [date]: { ...entry, tasks: [...entry.tasks, task] },
      },
    }
    set({ data: next })
    saveToStorage(next)
  },

  toggleTask: (date, taskId) => {
    const { data } = get()
    const entry = data.entries[date]
    if (!entry) return
    const next: ScheduleData = {
      entries: {
        ...data.entries,
        [date]: {
          ...entry,
          tasks: entry.tasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        },
      },
    }
    set({ data: next })
    saveToStorage(next)
  },

  deleteTask: (date, taskId) => {
    const { data } = get()
    const entry = data.entries[date]
    if (!entry) return
    const next: ScheduleData = {
      entries: {
        ...data.entries,
        [date]: { ...entry, tasks: entry.tasks.filter(t => t.id !== taskId) },
      },
    }
    set({ data: next })
    saveToStorage(next)
  },

  reorderTasks: (date, tasks) => {
    const { data } = get()
    const entry = data.entries[date]
    if (!entry) return
    const next: ScheduleData = {
      entries: { ...data.entries, [date]: { ...entry, tasks } },
    }
    set({ data: next })
    saveToStorage(next)
  },
}))

export function getDayStats(tasks: Task[]) {
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  return { total, completed, rate: total === 0 ? null : Math.round((completed / total) * 100) }
}
