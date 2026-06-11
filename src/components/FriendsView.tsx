import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  supabase, upsertProfile, createFriendRequestToken,
  getFriendRequest, acceptFriendRequest, getFriends,
  removeFriend, Profile, User,
} from '../lib/supabase'

/* ── 구글 로그인 프롬프트 (재사용) ──────────────────────── */
import { signInWithGoogle } from '../lib/supabase'

function GoogleLoginPrompt() {
  const [loading, setLoading] = useState(false)
  return (
    <div className="room-entry">
      <motion.div className="room-entry-select"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="room-entry-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h2 className="room-entry-title">친구</h2>
        <p className="room-entry-desc">친구 기능을 사용하려면<br/>구글 계정으로 로그인해주세요</p>
        <button className="google-login-btn" onClick={async () => { setLoading(true); await signInWithGoogle() }} disabled={loading}>
          {loading ? <div className="bell-spinner" style={{ width: 18, height: 18 }}/> : (
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          )}
          {!loading && <span>Google로 로그인</span>}
        </button>
      </motion.div>
    </div>
  )
}

/* ── 친구 요청 수락 화면 ─────────────────────────────────── */
function AcceptScreen({ token, user, onDone }: { token: string; user: User; onDone: () => void }) {
  const [requesterName, setRequesterName] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepting' | 'done' | 'error' | 'self'>('loading')

  useEffect(() => {
    getFriendRequest(token).then(async req => {
      if (!req) { setStatus('error'); return }
      if (req.requester_id === user.id) { setStatus('self'); return }
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', req.requester_id).single()
      setRequesterName(profile?.display_name ?? '알 수 없음')
      setStatus('ready')
    })
  }, [token])

  async function handleAccept() {
    setStatus('accepting')
    const ok = await acceptFriendRequest(token, user.id)
    setStatus(ok ? 'done' : 'error')
  }

  return (
    <div className="room-entry">
      <motion.div className="room-entry-select" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="room-entry-icon" style={{ fontSize: 32 }}>👋</div>
        {status === 'loading' && <p className="room-entry-desc">확인 중...</p>}
        {status === 'self' && <>
          <h2 className="room-entry-title">본인 링크</h2>
          <p className="room-entry-desc">본인이 만든 친구 요청 링크입니다.</p>
          <button className="btn-cancel" style={{ marginTop: 16, width: '100%' }} onClick={onDone}>돌아가기</button>
        </>}
        {status === 'error' && <>
          <h2 className="room-entry-title">유효하지 않은 링크</h2>
          <p className="room-entry-desc">이미 사용됐거나 만료된 링크입니다.</p>
          <button className="btn-cancel" style={{ marginTop: 16, width: '100%' }} onClick={onDone}>돌아가기</button>
        </>}
        {(status === 'ready' || status === 'accepting') && <>
          <h2 className="room-entry-title">친구 요청</h2>
          <p className="room-entry-desc"><strong style={{ color: 'var(--text-1)' }}>{requesterName}</strong>님이<br/>친구 요청을 보냈습니다</p>
          <button className="btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={handleAccept} disabled={status === 'accepting'}>
            {status === 'accepting' ? '처리 중...' : '수락하기'}
          </button>
          <button className="btn-cancel" style={{ marginTop: 10, width: '100%' }} onClick={onDone}>거절</button>
        </>}
        {status === 'done' && <>
          <h2 className="room-entry-title">친구 추가 완료!</h2>
          <p className="room-entry-desc"><strong style={{ color: 'var(--text-1)' }}>{requesterName}</strong>님과<br/>친구가 됐습니다 🎉</p>
          <button className="btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={onDone}>친구 목록 보기</button>
        </>}
      </motion.div>
    </div>
  )
}

/* ── 친구 목록 메인 ─────────────────────────────────────── */
function FriendsList({ user }: { user: User }) {
  const [friends, setFriends] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    upsertProfile(user)
    getFriends(user.id).then(f => { setFriends(f); setLoading(false) })
  }, [user.id])

  async function copyInviteLink() {
    const token = await createFriendRequestToken(user.id)
    const url = `${window.location.origin}/?friend=${token}`
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  async function handleRemove(friendId: string) {
    setRemoving(friendId)
    await removeFriend(user.id, friendId)
    setFriends(prev => prev.filter(f => f.id !== friendId))
    setRemoving(null)
  }

  return (
    <div className="friends-wrap">
      {/* 헤더 */}
      <div className="friends-header">
        <div className="friends-me">
          {user.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} className="friends-avatar" alt="me"/>
            : <div className="friends-avatar-placeholder">{(user.user_metadata?.full_name ?? user.email ?? '?')[0].toUpperCase()}</div>
          }
          <div>
            <div className="friends-me-name">{user.user_metadata?.full_name ?? user.email}</div>
            <div className="friends-me-email">{user.email}</div>
          </div>
        </div>
        <button className="friends-invite-btn" onClick={copyInviteLink}>
          {linkCopied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2 7 5.5 10.5 12 3.5"/>
              </svg>
              복사됨
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              친구 요청 링크 복사
            </>
          )}
        </button>
      </div>

      {/* 친구 목록 */}
      <div className="friends-section-title">친구 {friends.length}명</div>

      {loading ? (
        <div className="room-loading"><div className="room-loading-spinner"/><span>불러오는 중...</span></div>
      ) : friends.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>아직 친구가 없습니다<br/>친구 요청 링크를 공유해보세요</p>
        </div>
      ) : (
        <div className="friends-list">
          <AnimatePresence>
            {friends.map(f => (
              <motion.div key={f.id} className="friend-row"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }}>
                {f.avatar_url
                  ? <img src={f.avatar_url} className="friends-avatar sm" alt={f.display_name}/>
                  : <div className="friends-avatar-placeholder sm">{f.display_name[0].toUpperCase()}</div>
                }
                <span className="friend-name">{f.display_name}</span>
                <button className="friend-remove-btn"
                  onClick={() => handleRemove(f.id)}
                  disabled={removing === f.id}>
                  {removing === f.id ? '...' : '삭제'}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

/* ── 메인 FriendsView ────────────────────────────────────── */
export default function FriendsView({ friendToken }: { friendToken?: string | null }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAccept, setShowAccept] = useState(!!friendToken)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) return (
    <div className="room-loading"><div className="room-loading-spinner"/><span>확인 중...</span></div>
  )

  if (!user) return <GoogleLoginPrompt />

  if (showAccept && friendToken) {
    return <AcceptScreen token={friendToken} user={user} onDone={() => setShowAccept(false)} />
  }

  return <FriendsList user={user} />
}
