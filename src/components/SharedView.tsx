import React, { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  supabase, generateRoomCode,
  getMyMemberId, setMyMemberId,
  getLastRoomCode, setLastRoomCode,
  getMyNickname, setMyNickname,
  RoomTask, RoomMember, RoomCompletion
} from '../lib/supabase'
import { CATEGORY_META, TaskCategory } from '../types'
import AddTaskModal from './AddTaskModal'

const TODAY = format(new Date(), 'yyyy-MM-dd')

/* ── 토스트 ─────────────────────────────────────────────── */
function Toast({ msg, type }: { msg: string; type: 'error' | 'success' }) {
  return (
    <motion.div
      className={`room-toast room-toast-${type}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
    >
      {msg}
    </motion.div>
  )
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function show(msg: string, type: 'error' | 'success' = 'error') {
    if (timer.current) clearTimeout(timer.current)
    setToast({ msg, type })
    timer.current = setTimeout(() => setToast(null), 3000)
  }

  return { toast, show }
}

/* ── 진입 화면 ─────────────────────────────────────────── */
function RoomEntry({ savedCode, initialCode, onEnter }: {
  savedCode: string | null
  initialCode: string | null
  onEnter: (code: string, nickname: string, isNew: boolean) => void
}) {
  // 초대 링크로 왔으면 바로 join 모드
  const [mode, setMode] = useState<'select' | 'create' | 'join'>(initialCode ? 'join' : 'select')
  const [nickname, setNickname] = useState('')
  const [roomName, setRoomName] = useState('')
  const [code, setCode] = useState(initialCode ?? savedCode ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const savedNick = savedCode ? getMyNickname(savedCode) : ''

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim() || !roomName.trim()) return
    setLoading(true)
    const roomCode = generateRoomCode()
    const { error: re } = await supabase.from('rooms').insert({ code: roomCode, name: roomName.trim() })
    if (re) { setError(re.message); setLoading(false); return }
    onEnter(roomCode, nickname.trim(), true)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim() || !code.trim()) return
    setLoading(true)
    const upper = code.trim().toUpperCase()
    const { data, error: re } = await supabase.from('rooms').select('code').eq('code', upper).single()
    if (re || !data) { setError('룸코드를 찾을 수 없습니다.'); setLoading(false); return }
    onEnter(upper, nickname.trim(), false)
  }

  return (
    <div className="room-entry">
      <AnimatePresence mode="wait">
        {mode === 'select' && (
          <motion.div key="select" className="room-entry-select"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="room-entry-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="3" fill="var(--accent)" opacity="0.9"/>
                <rect x="18" y="2" width="12" height="12" rx="3" fill="var(--accent)" opacity="0.9"/>
                <rect x="2" y="18" width="12" height="12" rx="3" fill="var(--accent)" opacity="0.5"/>
                <rect x="18" y="18" width="12" height="12" rx="3" fill="var(--accent)" opacity="0.5"/>
              </svg>
            </div>
            <h2 className="room-entry-title">공동 일정</h2>
            <p className="room-entry-desc">룸코드로 친구와 일정을 공유하고<br/>서로의 달성률을 비교해보세요</p>

            {/* 저장된 방이 있으면 빠른 재참가 버튼 */}
            {savedCode && savedNick && (
              <button className="room-rejoin-btn" onClick={() => onEnter(savedCode, savedNick, false)}>
                <span className="rejoin-code">{savedCode}</span>
                <span className="rejoin-nick">{savedNick}으로 바로 입장</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 4 10 7 4 10"/>
                </svg>
              </button>
            )}

            <div className="room-entry-btns" style={{ marginTop: (savedCode && savedNick) ? 12 : 0 }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setMode('create')}>새 방 만들기</button>
              <button className="btn-cancel" style={{ width: '100%', marginTop: 10 }}
                onClick={() => { setMode('join'); setCode(savedCode ?? '') }}>
                코드로 참가
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'create' && (
          <motion.div key="create" className="room-entry-form"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <button className="room-back-btn" onClick={() => { setMode('select'); setError('') }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="10 4 6 8 10 12"/>
              </svg>
            </button>
            <h2 className="room-entry-title" style={{ marginBottom: 24 }}>새 방 만들기</h2>
            <form onSubmit={handleCreate} style={{ width: '100%' }}>
              <div className="form-group">
                <label className="form-label">내 닉네임</label>
                <input className="form-input" placeholder="예: Eddy" value={nickname}
                  onChange={e => setNickname(e.target.value)} autoFocus/>
              </div>
              <div className="form-group">
                <label className="form-label">방 이름</label>
                <input className="form-input" placeholder="예: Eddy & 지수" value={roomName}
                  onChange={e => setRoomName(e.target.value)}/>
              </div>
              {error && <div className="room-error">{error}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}
                disabled={loading || !nickname.trim() || !roomName.trim()}>
                {loading ? '생성 중...' : '방 만들기'}
              </button>
            </form>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div key="join" className="room-entry-form"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <button className="room-back-btn" onClick={() => { setMode('select'); setError('') }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="10 4 6 8 10 12"/>
              </svg>
            </button>
            <h2 className="room-entry-title" style={{ marginBottom: 24 }}>코드로 참가</h2>
            <form onSubmit={handleJoin} style={{ width: '100%' }}>
              <div className="form-group">
                <label className="form-label">내 닉네임</label>
                <input className="form-input" placeholder="예: 지수" value={nickname}
                  onChange={e => setNickname(e.target.value)} autoFocus/>
              </div>
              <div className="form-group">
                <label className="form-label">룸코드</label>
                <input className="form-input" placeholder="XXXXXX" value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6}
                  style={{ letterSpacing: '0.2em', fontFamily: 'monospace' }}/>
              </div>
              {error && <div className="room-error">{error}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}
                disabled={loading || !nickname.trim() || code.trim().length !== 6}>
                {loading ? '참가 중...' : '참가하기'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── 공동 일정 방 ────────────────────────────────────────── */
function RoomView({ roomCode, nickname, onLeave }: {
  roomCode: string; nickname: string; onLeave: () => void
}) {
  const { toast, show: showToast } = useToast()
  const [myMemberId, setMyMemberIdState] = useState<string | null>(() => getMyMemberId(roomCode))
  const [members, setMembers] = useState<RoomMember[]>([])
  const [tasks, setTasks] = useState<RoomTask[]>([])
  const [completions, setCompletions] = useState<RoomCompletion[]>([])
  const [roomName, setRoomName] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const date = TODAY

  useEffect(() => {
    let memberId = getMyMemberId(roomCode)

    async function init() {
      setLoading(true)
      try {
        const { data: room } = await supabase.from('rooms').select('name').eq('code', roomCode).single()
        if (room) setRoomName(room.name)

        if (!memberId) {
          const { data: m, error: me } = await supabase
            .from('room_members').insert({ room_code: roomCode, nickname }).select().single()
          if (me) showToast('멤버 등록 실패: ' + me.message)
          else if (m) { memberId = m.id; setMyMemberId(roomCode, m.id) }
        }
        setMyMemberIdState(memberId)

        const { data: mList, error: mErr } = await supabase
          .from('room_members').select('*').eq('room_code', roomCode)
        if (mErr) showToast('멤버 로드 실패')
        else setMembers(mList ?? [])

        const { data: tList, error: tErr } = await supabase
          .from('room_tasks').select('*').eq('room_code', roomCode).order('order_idx')
        if (tErr) showToast('태스크 로드 실패')
        else setTasks(tList ?? [])

        const { data: cList, error: cErr } = await supabase
          .from('room_completions').select('*').eq('room_code', roomCode).eq('date', date)
        if (cErr) showToast('완료 기록 로드 실패')
        else setCompletions(cList ?? [])

      } catch {
        showToast('데이터 로드 중 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [roomCode])

  // Realtime 구독
  useEffect(() => {
    const taskSub = supabase.channel(`tasks:${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_tasks', filter: `room_code=eq.${roomCode}` },
        () => supabase.from('room_tasks').select('*').eq('room_code', roomCode).order('order_idx')
          .then(({ data }) => { if (data) setTasks(data) }))
      .subscribe()

    const compSub = supabase.channel(`completions:${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_completions', filter: `room_code=eq.${roomCode}` },
        () => supabase.from('room_completions').select('*').eq('room_code', roomCode).eq('date', date)
          .then(({ data }) => { if (data) setCompletions(data) }))
      .subscribe()

    const memberSub = supabase.channel(`members:${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_code=eq.${roomCode}` },
        () => supabase.from('room_members').select('*').eq('room_code', roomCode)
          .then(({ data }) => { if (data) setMembers(data) }))
      .subscribe()

    return () => {
      supabase.removeChannel(taskSub)
      supabase.removeChannel(compSub)
      supabase.removeChannel(memberSub)
    }
  }, [roomCode, date])

  async function handleAddTask(task: { title: string; time?: string; category: TaskCategory }) {
    // 낙관적 업데이트
    const tempId = `temp_${Date.now()}`
    const optimistic: RoomTask = {
      id: tempId, room_code: roomCode,
      title: task.title, time: task.time,
      category: task.category, order_idx: tasks.length,
    }
    setTasks(prev => [...prev, optimistic])

    const { data, error } = await supabase.from('room_tasks').insert({
      room_code: roomCode,
      title: task.title,
      time: task.time ?? null,
      category: task.category,
      order_idx: tasks.length,
    }).select().single()

    if (error) {
      setTasks(prev => prev.filter(t => t.id !== tempId))
      showToast('태스크 저장 실패: ' + error.message)
    } else if (data) {
      setTasks(prev => prev.map(t => t.id === tempId ? data : t))
    }
  }

  async function handleToggle(taskId: string, memberId: string) {
    if (memberId !== myMemberId) return

    const existing = completions.find(
      c => c.task_id === taskId && c.member_id === memberId && c.date === date
    )
    const newCompleted = existing ? !existing.completed : true

    // 낙관적 업데이트
    if (existing) {
      setCompletions(prev => prev.map(c =>
        c.id === existing.id ? { ...c, completed: newCompleted } : c
      ))
    } else {
      setCompletions(prev => [...prev, {
        id: `temp_${Date.now()}`, room_code: roomCode,
        member_id: memberId, task_id: taskId, date, completed: true
      }])
    }

    const { error } = await supabase.from('room_completions').upsert({
      room_code: roomCode,
      member_id: memberId,
      task_id: taskId,
      date,
      completed: newCompleted,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'member_id,task_id,date' })

    if (error) {
      const { data: fresh } = await supabase
        .from('room_completions').select('*').eq('room_code', roomCode).eq('date', date)
      if (fresh) setCompletions(fresh)
      showToast('저장 실패: ' + error.message)
    }
  }

  async function handleDeleteTask(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    const { error } = await supabase.from('room_tasks').delete().eq('id', taskId)
    if (error) {
      const { data } = await supabase
        .from('room_tasks').select('*').eq('room_code', roomCode).order('order_idx')
      if (data) setTasks(data)
      showToast('삭제 실패: ' + error.message)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(`${window.location.origin}/?join=${roomCode}`)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  function isCompleted(taskId: string, memberId: string) {
    return completions.some(c => c.task_id === taskId && c.member_id === memberId && c.completed)
  }

  function getMemberRate(memberId: string) {
    if (tasks.length === 0) return null
    const done = tasks.filter(t => isCompleted(t.id, memberId)).length
    return Math.round((done / tasks.length) * 100)
  }

  if (loading) {
    return (
      <div className="room-loading">
        <div className="room-loading-spinner"/>
        <span>불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="room-view">
      {/* 토스트 */}
      <div className="room-toast-wrap">
        <AnimatePresence>
          {toast && <Toast key="toast" msg={toast.msg} type={toast.type}/>}
        </AnimatePresence>
      </div>

      {/* 방 헤더 */}
      <div className="room-header">
        <div>
          <div className="room-name">{roomName}</div>
          <div className="room-date">{format(new Date(date), 'M월 d일 (E)', { locale: ko })}</div>
        </div>
        <div className="room-header-right">
          <button className="room-code-btn" onClick={copyCode}>
            <span>{copied ? '복사됨' : roomCode}</span>
            {!copied && (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="9" height="9" rx="1"/>
                <path d="M3 11H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1"/>
              </svg>
            )}
          </button>
          <button className="room-invite-btn" onClick={copyInviteLink} title="초대 링크 복사">
            {inviteCopied ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2 7 5.5 10.5 12 3.5"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            )}
            <span style={{ fontSize: 11 }}>{inviteCopied ? '복사됨' : '초대'}</span>
          </button>
          <button className="icon-btn" onClick={onLeave} title="방 나가기">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2h4v12h-4"/>
              <polyline points="7 11 10 8 7 5"/>
              <line x1="1" y1="8" x2="10" y2="8"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 멤버 달성률 */}
      <div className="room-members-row">
        {members.map(m => {
          const rate = getMemberRate(m.id)
          const isMe = m.id === myMemberId
          return (
            <div key={m.id} className={`room-member-chip ${isMe ? 'me' : ''}`}>
              <span className="member-name">{m.nickname}{isMe ? ' (나)' : ''}</span>
              <span className="member-rate" style={{
                color: rate === null ? 'var(--text-3)'
                  : rate >= 80 ? 'var(--success)'
                  : rate >= 50 ? 'var(--accent-light)'
                  : 'var(--danger)'
              }}>
                {rate !== null ? `${rate}%` : '--'}
              </span>
            </div>
          )
        })}
      </div>

      {/* 태스크 헤더 */}
      <div className="task-section-header" style={{ marginBottom: 12 }}>
        <span className="section-title">공유 태스크</span>
        <button className="add-btn" onClick={() => setAddOpen(true)}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="6" y1="1" x2="6" y2="11"/>
            <line x1="1" y1="6" x2="11" y2="6"/>
          </svg>
          추가
        </button>
      </div>

      {/* 비교 테이블 */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
          </svg>
          <p>공유 태스크를 추가해보세요</p>
        </div>
      ) : (
        <div className="comparison-table">
          <div className="comp-row comp-header">
            <div className="comp-task-col">태스크</div>
            {members.map(m => (
              <div key={m.id} className="comp-member-col">
                {m.nickname}{m.id === myMemberId ? ' (나)' : ''}
              </div>
            ))}
            <div className="comp-del-col"/>
          </div>
          {tasks.map(task => {
            const meta = CATEGORY_META[task.category as TaskCategory] ?? CATEGORY_META.other
            return (
              <div key={task.id} className="comp-row">
                <div className="comp-task-col">
                  <span className="comp-task-dot" style={{ background: meta.color }}/>
                  <span className="comp-task-title">{task.title}</span>
                  {task.time && <span className="comp-task-time">{task.time}</span>}
                </div>
                {members.map(m => {
                  const done = isCompleted(task.id, m.id)
                  const isMe = m.id === myMemberId
                  return (
                    <div key={m.id} className="comp-member-col">
                      <button
                        className={`comp-check ${done ? 'checked' : ''} ${isMe ? 'mine' : 'others'}`}
                        onClick={() => handleToggle(task.id, m.id)}
                        disabled={!isMe}
                      >
                        {done && (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
                            strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2 7 5.5 10.5 12 3.5"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  )
                })}
                <div className="comp-del-col">
                  <button className="task-del" onClick={() => handleDeleteTask(task.id)}>
                    <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor"
                      strokeWidth={2} strokeLinecap="round">
                      <line x1="4" y1="4" x2="12" y2="12"/>
                      <line x1="12" y1="4" x2="4" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddTaskModal open={addOpen} date={date} onClose={() => setAddOpen(false)} onAdd={handleAddTask}/>
    </div>
  )
}

/* ── 메인 SharedView ─────────────────────────────────────── */
export default function SharedView({ initialCode }: { initialCode?: string | null }) {
  const savedCode = getLastRoomCode()
  const savedNick = savedCode ? getMyNickname(savedCode) : ''

  const [roomCode, setRoomCode] = useState<string | null>(savedCode)
  const [nickname, setNickname] = useState<string>(savedNick)

  function handleEnter(code: string, nick: string, _isNew: boolean) {
    setLastRoomCode(code)
    setMyNickname(code, nick)
    setRoomCode(code)
    setNickname(nick)
  }

  function handleLeave() {
    // localStorage는 유지 — 진입 화면에서 "바로 입장" 버튼으로 언제든 재참가 가능
    setRoomCode(null)
    setNickname('')
  }

  if (!roomCode || !nickname) {
    return <RoomEntry savedCode={savedCode} initialCode={initialCode ?? null} onEnter={handleEnter}/>
  }

  return (
    <RoomView
      key={roomCode}
      roomCode={roomCode}
      nickname={nickname}
      onLeave={handleLeave}
    />
  )
}
