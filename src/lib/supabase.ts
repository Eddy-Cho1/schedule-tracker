import { createClient, User } from '@supabase/supabase-js'

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

// ── Auth ────────────────────────────────────────────────────
export type { User }

export async function getAuthUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

// ── Profiles ────────────────────────────────────────────────
export type Profile = { id: string; display_name: string; avatar_url: string | null }

export async function upsertProfile(user: User) {
  const display_name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '익명'
  const avatar_url = user.user_metadata?.avatar_url ?? null
  await supabase.from('profiles').upsert({ id: user.id, display_name, avatar_url }, { onConflict: 'id' })
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

// ── Friends ─────────────────────────────────────────────────
export type FriendRequest = { id: string; requester_id: string; token: string; status: string; addressee_id: string | null }
export type Friendship = { id: string; user_id_1: string; user_id_2: string }

function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[b % 58])
    .join('')
}

export async function createFriendRequestToken(requesterId: string): Promise<string> {
  const token = randomToken()
  await supabase.from('friend_requests').insert({ requester_id: requesterId, token })
  return token
}

export async function getFriendRequest(token: string): Promise<FriendRequest | null> {
  const { data } = await supabase.from('friend_requests').select('*').eq('token', token).eq('status', 'pending').maybeSingle()
  return data
}

export async function acceptFriendRequest(token: string, addresseeId: string): Promise<boolean> {
  const req = await getFriendRequest(token)
  if (!req || req.requester_id === addresseeId) return false

  const { error: ue } = await supabase.from('friend_requests')
    .update({ status: 'accepted', addressee_id: addresseeId })
    .eq('token', token)
  if (ue) return false

  const [a, b] = [req.requester_id, addresseeId].sort()
  const { error: fe } = await supabase.from('friendships')
    .upsert({ user_id_1: a, user_id_2: b }, { onConflict: 'user_id_1,user_id_2' })
  return !fe
}

export async function getFriends(userId: string): Promise<Profile[]> {
  const { data } = await supabase.from('friendships')
    .select('user_id_1, user_id_2')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
  if (!data) return []
  const friendIds = data.map(f => f.user_id_1 === userId ? f.user_id_2 : f.user_id_1)
  if (friendIds.length === 0) return []
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds)
  return profiles ?? []
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const [a, b] = [userId, friendId].sort()
  await supabase.from('friendships').delete().eq('user_id_1', a).eq('user_id_2', b)
}
