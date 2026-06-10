/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// 새 버전 즉시 활성화
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// 푸시 수신 → 잠금화면 알림 표시
self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title, body, tag } = event.data.json() as { title: string; body: string; tag?: string }
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag: tag ?? 'reminder',
      renotify: true,
      silent: false,
      data: { url: '/' },
    })
  )
})

// 알림 탭 → 앱 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string })?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return (client as WindowClient).focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
