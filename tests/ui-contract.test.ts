import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const app = readFileSync(new URL('../app.vue', import.meta.url), 'utf8')
const globalCss = readFileSync(new URL('../assets/main.css', import.meta.url), 'utf8')

describe('accessible UI contract', () => {
  it('keeps the personal reason in the active Chakra overlay and omits it through v-if when empty', () => {
    expect(app).toContain('v-if="state?.settings.personalReason" class="reason-card craving-reason"')
    expect(app).toContain('{{ state.settings.personalReason }}')
    expect(app).toContain('v-else-if="chakraStage === \'checkin\'"')
  })

  it('renders action-local live errors for settings and date dialogs', () => {
    expect(app).toContain('v-if="settingsError" class="error" role="alert" aria-live="polite"')
    expect(app).toContain('v-if="dialogError" class="error" role="alert" aria-live="polite"')
  })

  it('declares dialog naming, focus handling, selected states, and active navigation', () => {
    expect(app).toContain('aria-labelledby="path-dialog-title"')
    expect(app).toContain('@keydown="handleDialogKeydown($event, closeDialog)"')
    expect(app).toContain(':aria-pressed="selectedTrigger === key"')
    expect(app).toContain(':aria-current="tab === \'settings\' ? \'page\' : undefined"')
  })

  it('keeps important targets at 44px and supports safe areas and reduced motion', () => {
    expect(globalCss).toContain('button{min-height:44px')
    expect(app).toMatch(/\.chips button \{[^}]*min-width: 44px;[^}]*min-height: 44px;/)
    expect(globalCss).toContain('env(safe-area-inset-bottom)')
    expect(`${globalCss}\n${app}`).toContain('prefers-reduced-motion: reduce')
  })

  it('routes client API calls through the bounded timeout wrapper', () => {
    expect(app).toContain('const API_TIMEOUT = 8_000')
    expect(app).toContain('return $fetch<T>(url, { ...options, timeout: API_TIMEOUT })')
    expect(app.match(/\$fetch</g)).toHaveLength(1)
  })

  it('uses full-screen loading only before usable state exists', () => {
    expect(app).toContain('const initialLoad = !state.value')
    expect(app).toContain('if (initialLoad) loading.value = true')
    expect(app).toContain('if (initialLoad) loading.value = false')
    expect(app).toContain('<template v-else-if="state">')
  })
})
