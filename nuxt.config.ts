import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-05',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/main.css'],
  runtimeConfig: {
    databasePath: process.env.NUXT_DATABASE_PATH || resolve(process.cwd(), 'data', 'vilno.sqlite'),
    trustedOrigin: process.env.NUXT_TRUSTED_ORIGIN || '',
  },
  app: {
    head: {
      htmlAttrs: { lang: 'uk' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f7f0e3' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
      link: [{ rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.svg' }],
    },
  },
  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Вільно — дні без куріння', short_name: 'Вільно',
      start_url: '/', scope: '/', display: 'standalone',
      theme_color: '#f7f0e3', background_color: '#f7f0e3', lang: 'uk',
      icons: [
        { src: '/icons/icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icons/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
      ],
    },
    workbox: { navigateFallbackDenylist: [/^\/api\//], globPatterns: ['**/*.{js,css,html,svg,ico}'] },
  },
})
