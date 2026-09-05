import { describe, expect, it } from 'vitest'
import config from '../nuxt.config'

describe('private PWA metadata', () => {
  it('uses only the private app name in the manifest and Apple metadata', () => {
    const value = config as any
    expect(value.pwa.manifest.name).toBe('Вільно')
    expect(value.pwa.manifest.short_name).toBe('Вільно')
    expect(value.app.head.title).toBe('Вільно')
    expect(value.app.head.meta).toContainEqual({ name: 'apple-mobile-web-app-title', content: 'Вільно' })
    expect(JSON.stringify(value.pwa.manifest)).not.toMatch(/куріння|smoking|quit smoking/i)
  })
})
