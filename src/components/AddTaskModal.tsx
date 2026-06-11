import React, { useState, useEffect, useRef } from 'react'
import { TaskCategory, CATEGORY_META } from '../types'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  date: string
  onClose: () => void
  onAdd: (task: { title: string; time?: string; category: TaskCategory }) => void
}

export default function AddTaskModal({ open, date, onClose, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [category, setCategory] = useState<TaskCategory>('work')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle(''); setTime(''); setCategory('work')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), time: time || undefined, category })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="modal-box"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          >
            <h2 className="modal-title">일정 추가</h2>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">할 일</label>
                <input
                  ref={inputRef}
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder=""
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label className="form-label">시간 (선택)</label>
                <input
                  className="form-input"
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">카테고리</label>
                <div className="cat-grid">
                  {(Object.keys(CATEGORY_META) as TaskCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-btn ${category === cat ? 'selected' : ''}`}
                      style={{
                        color: category === cat ? CATEGORY_META[cat].color : undefined,
                        background: category === cat ? CATEGORY_META[cat].bg : undefined,
                        borderColor: category === cat ? CATEGORY_META[cat].color : undefined,
                      }}
                      onClick={() => setCategory(cat)}
                    >
                      {CATEGORY_META[cat].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={onClose}>취소</button>
                <button type="submit" className="btn-primary" disabled={!title.trim()}>추가</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
