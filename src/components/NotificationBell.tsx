import React, { useState, useEffect } from 'react'
import { subscribeToPush, unsubscribeFromPush, isPushEnabled } from '../lib/push'
import { getMyMemberId, getLastRoomCode } from '../lib/supabase'

type State = 'unsupported' | 'loading' | 'granted' | 'denied' | 'default'

export default function NotificationBell() {
  const [state, setState] = useState<State>('default')

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('unsupported'); return
    }
    const perm = Notification.permission
    if (perm === 'granted' && isPushEnabled()) setState('granted')
    else if (perm === 'denied') setState('denied')
    else setState('default')
  }, [])

  if (state === 'unsupported') return null

  async function handleClick() {
    if (state === 'granted') {
      await unsubscribeFromPush()
      setState('default')
      return
    }
    if (state === 'denied') {
      alert('브라우저 설정에서 알림을 허용해주세요.')
      return
    }
    setState('loading')
    const roomCode = getLastRoomCode()
    const memberId = roomCode ? getMyMemberId(roomCode) : null
    const ok = await subscribeToPush(memberId)
    setState(ok ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'default')
  }

  return (
    <button
      className={`bell-btn ${state}`}
      onClick={handleClick}
      title={state === 'granted' ? '알림 켜짐 (클릭해 끄기)' : '알림 허용'}
    >
      {state === 'loading' ? (
        <div className="bell-spinner"/>
      ) : state === 'granted' ? (
        /* 채워진 벨 (활성) */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
      ) : state === 'denied' ? (
        /* 벨 + 슬래시 (차단됨) */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          <path d="M18.63 13A17.9 17.9 0 0 1 18 8"/>
          <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/>
          <path d="M18 8a6 6 0 0 0-9.33-5"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        /* 빈 벨 (기본) */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      )}
    </button>
  )
}
