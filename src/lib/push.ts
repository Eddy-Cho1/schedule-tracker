import { format } from 'date-fns'

const SUPABASE_URL = 'https://qwyvqnrklasaiirkhhjz.supabase.co'
export const VAPID_PUBLIC_KEY = 'BIQ6zdSXS5sRe3wVRrwBC0z4e-8Tc3-AdTah_RbYv4fmKhpiXk_Kmy9wZb5erPYYWNgQTfZ7t6ZdXQm8twkWaP0'

// device_id: 기기마다 고유 ID (localStorage)
export function getDeviceId(): string {
  let id = localStorage.getItem('push_device_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('push_device_id', id) }
  return id
}

export function isPushEnabled(): boolean {
  return localStorage.getItem('push_enabled') === '1'
}
export function setPushEnabled(val: boolean) {
  localStorage.setItem('push_enabled', val ? '1' : '0')
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

// 푸시 구독 + Supabase 등록
export async function subscribeToPush(memberId?: string | null): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const key = sub.getKey('p256dh')
  const authKey = sub.getKey('auth')
  if (!key || !authKey) return false

  const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)))
  const auth   = btoa(String.fromCharCode(...new Uint8Array(authKey)))

  const res = await fetch(`${SUPABASE_URL}/functions/v1/register-push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: getDeviceId(),
      endpoint: sub.endpoint,
      p256dh,
      auth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      member_id: memberId ?? null,
    }),
  })

  if (!res.ok) return false
  setPushEnabled(true)
  return true
}

// 오늘 일정(시간 있는 것만) Supabase에 동기화
export async function syncSchedule(tasks: { title: string; time?: string; category: string }[]) {
  if (!isPushEnabled()) return
  const timedTasks = tasks.filter(t => t.time)
  if (timedTasks.length === 0) return

  await fetch(`${SUPABASE_URL}/functions/v1/sync-schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: getDeviceId(),
      date: format(new Date(), 'yyyy-MM-dd'),
      tasks: timedTasks.map(t => ({ title: t.title, time: t.time, category: t.category })),
    }),
  })
}

// 구독 해제
export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
  setPushEnabled(false)
}
