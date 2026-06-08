import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qwyvqnrklasaiirkhhjz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eXZxbnJrbGFzYWlpcmtoaGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDU2MTYsImV4cCI6MjA5NjM4MTYxNn0.YJG5U5QciOakiYTHuLP3iocHQxHb9YDOI6gjB8MRaZ8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export type RoomTask = {
  id: string
  room_code: string
  title: string
  time?: string
  category: string
  order_idx: number
}

export type RoomMember = {
  id: string
  room_code: string
  nickname: string
}

export type RoomCompletion = {
  id: string
  room_code: string
  member_id: string
  task_id: string
  date: string
  completed: boolean
}

// 로컬에 내 멤버 ID 저장 (룸별)
export function getMyMemberId(roomCode: string): string | null {
  return localStorage.getItem(`room_member_${roomCode}`)
}

export function setMyMemberId(roomCode: string, memberId: string) {
  localStorage.setItem(`room_member_${roomCode}`, memberId)
}

// 마지막으로 접속한 룸 코드
export function getLastRoomCode(): string | null {
  return localStorage.getItem('last_room_code')
}

export function setLastRoomCode(code: string) {
  localStorage.setItem('last_room_code', code)
}

// 닉네임 저장 (룸별)
export function getMyNickname(roomCode: string): string {
  return localStorage.getItem(`room_nick_${roomCode}`) ?? ''
}

export function setMyNickname(roomCode: string, nickname: string) {
  localStorage.setItem(`room_nick_${roomCode}`, nickname)
}

// 방 나갈 때 로컬 데이터 삭제
export function clearRoomStorage(roomCode: string) {
  localStorage.removeItem(`room_nick_${roomCode}`)
  localStorage.removeItem(`room_member_${roomCode}`)
  localStorage.removeItem('last_room_code')
}

// 6자리 룸코드 생성
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
