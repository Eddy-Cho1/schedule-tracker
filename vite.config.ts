import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: '일정 트래커',
        short_name: '일정',
        description: 'MakeYourself 일정 트래커 — 주간·월간 일정 관리',
        theme_color: '#ffffff',
        background_color: '#f7f7fb',
        display: 'standalone',
        start_url: '/',
        orientation: 'any',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
