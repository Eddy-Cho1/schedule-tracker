import React from 'react'
import { Task, CATEGORY_META } from '../types'
import { motion } from 'framer-motion'

interface Props {
  task: Task
  onToggle: () => void
  onDelete: () => void
}

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  const meta = CATEGORY_META[task.category]
  return (
    <motion.div
      className={`task-item ${task.completed ? 'completed' : ''}`}
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
    >
      <button
        className={`task-check ${task.completed ? 'checked' : ''}`}
        onClick={onToggle}
        aria-label="완료 토글"
        style={task.completed ? {} : { borderColor: meta.color + '80' }}
      >
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 6 5 9 10 3"/>
        </svg>
      </button>
      <div className="task-body">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {task.time && <span className="task-time">{task.time}</span>}
          <span
            className="task-cat-badge"
            style={{ color: meta.color, background: meta.bg }}
          >
            {meta.label}
          </span>
        </div>
      </div>
      <button className="task-del" onClick={onDelete} aria-label="삭제">
        <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="4" y1="4" x2="12" y2="12"/>
          <line x1="12" y1="4" x2="4" y2="12"/>
        </svg>
      </button>
    </motion.div>
  )
}
