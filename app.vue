<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import type { Attempt, DailyWisdomState, TrackerState } from './server/utils/types'
import { elapsedParts, formatMoney, journeyTotals, MILESTONES, savedMoney } from './server/utils/types'
import { localDateTimeToTimestamp, timestampToLocalDateTime } from './shared/local-date-time'
import { NINJA_LEVELS, rankForDays, rankStatusForDay } from './shared/ranks'
import { createRefreshCoordinator } from './shared/refresh-coordinator'

type Tab = 'today' | 'milestones' | 'settings'
type Dialog = 'start' | 'edit' | 'new-path' | null
type Trigger = 'stress' | 'coffee' | 'alcohol' | 'after_food' | 'company' | 'boredom' | 'habit' | 'other'

const API_TIMEOUT = 8_000
const triggerLabels: Record<Trigger, string> = {
  stress: 'Стрес',
  coffee: 'Кава',
  alcohol: 'Алкоголь',
  after_food: 'Після їжі',
  company: 'Компанія',
  boredom: 'Нудьга',
  habit: 'Звичка',
  other: 'Інше',
}
const reasonSuggestions = [
  'Хочу перестати залежати',
  'Заради здоров’я',
  'Заради сім’ї',
  'Хочу краще себе почувати',
  'Не хочу витрачати гроші',
  'Хочу більше контролю над своїм життям',
]

const tab = ref<Tab>('today')
const state = ref<TrackerState | null>(null)
const wisdom = ref<DailyWisdomState | null>(null)
const loading = ref(true)
const offline = ref(!navigator.onLine)
const loadError = ref('')
const actionError = ref('')
const settingsError = ref('')
const dialogError = ref('')
const wisdomError = ref('')
const saving = ref(false)
const dialog = ref<Dialog>(null)
const deleteHistoryAttempt = ref<Attempt | null>(null)
const scrollOpen = ref(false)
const characterOpen = ref(false)
const now = ref(Date.now())
const formDate = ref('')
const formTime = ref('')
const originalFormTimestamp = ref<number | undefined>()
const selectedTrigger = ref<Trigger | undefined>()
const reasonDraft = ref('')
const costDraft = ref('7')
const chakraEndsAt = ref<number | null>(null)
const chakraRound = ref(0)
const chakraStage = ref<'running' | 'checkin' | 'trigger'>('running')
const { needRefresh, updateServiceWorker } = useRegisterSW()

let timer: ReturnType<typeof setInterval> | undefined
let focusReturn: HTMLElement | null = null

const active = computed(() => state.value?.activeAttempt || null)
const progress = computed(() => active.value ? elapsedParts(active.value.startedAt, now.value) : null)
const level = computed(() => rankForDays(progress.value?.days || 0))
const nextMilestone = computed(() => MILESTONES.find(day => day > (progress.value?.days || 0)) || null)
const milestoneProgress = computed(() => {
  if (!progress.value || !nextMilestone.value) return 100
  const elapsedDays = progress.value.days + progress.value.hours / 24 + progress.value.minutes / 1_440
  return Math.min(100, elapsedDays / nextMilestone.value * 100)
})
const currentSaved = computed(() => active.value
  ? savedMoney(active.value.startedAt, active.value.dailySmokingCostAtStart, now.value)
  : 0)
const totals = computed(() => journeyTotals(state.value?.history || [], active.value, now.value))
const totalSaved = computed(() => totals.value.savedMoney)
const totalParts = computed(() => elapsedParts(0, totals.value.elapsedMilliseconds))
const longest = computed(() => Math.max(
  0,
  ...(state.value?.history || []).map(item => Math.floor(
    Math.max(0, (item.endedAt || item.startedAt) - item.startedAt) / 86_400_000,
  )),
  progress.value?.days || 0,
))
const chakraRemaining = computed(() => Math.max(
  0,
  Math.ceil(((chakraEndsAt.value || 0) - now.value) / 1_000),
))
const chakraText = computed(() => {
  const elapsed = 60 - chakraRemaining.value
  const messages = chakraRound.value
    ? [
        'Не поспішай нічого вирішувати.',
        'Дозволь відчуттю бути тут, не виконуючи його.',
        'Ця хвиля зміниться. Тобі не потрібно йти за нею.',
      ]
    : [
        'Не треба боротися з бажанням. Просто поміть його.',
        'Повільний вдих. Ще повільніший видих.',
        'Бажання — це сигнал, а не команда.',
      ]
  return messages[Math.min(2, Math.floor(elapsed / 20))]
})

function pluralDays(days: number) {
  const last = days % 10
  const hundred = days % 100
  return hundred >= 11 && hundred <= 14 ? 'днів' : last === 1 ? 'день' : last >= 2 && last <= 4 ? 'дні' : 'днів'
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

function formatPeriod(milliseconds: number) {
  const parts = elapsedParts(0, milliseconds)
  return `${parts.days} ${pluralDays(parts.days)} ${parts.hours ? `${parts.hours} год` : ''}`.trim()
}

function timezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function requestId() {
  return crypto.randomUUID()
}

function apiFetch<T>(url: string, options: Record<string, unknown> = {}) {
  return $fetch<T>(url, { ...options, timeout: API_TIMEOUT })
}

function setForm(value: number) {
  const local = timestampToLocalDateTime(value)
  originalFormTimestamp.value = value
  formDate.value = local.date
  formTime.value = local.time
  selectedTrigger.value = undefined
}

function formTimestamp() {
  return localDateTimeToTimestamp(formDate.value, formTime.value, originalFormTimestamp.value)
}

function rankStatus(day: number) {
  return rankStatusForDay(day, progress.value?.days || 0)
}

async function loadWisdom() {
  try {
    wisdom.value = await apiFetch<DailyWisdomState>('/api/wisdom/today', {
      query: { timezone: timezone() },
    })
    wisdomError.value = ''
  } catch {
    wisdomError.value = 'Слова дня тимчасово недоступні.'
  }
}

async function refreshTracker() {
  const initialLoad = !state.value
  if (initialLoad) loading.value = true
  try {
    const tracker = await apiFetch<TrackerState>('/api/tracker')
    state.value = tracker
    if (initialLoad) {
      reasonDraft.value = tracker.settings.personalReason || ''
      costDraft.value = String(tracker.settings.dailySmokingCost)
    }
    offline.value = false
    loadError.value = ''
    void loadWisdom()
  } catch (cause: any) {
    offline.value = !navigator.onLine
    loadError.value = cause?.data?.statusMessage
      || (offline.value ? 'Немає з’єднання з інтернетом.' : 'Не вдалося оновити дані. Спробуй ще раз.')
  } finally {
    if (initialLoad) loading.value = false
  }
}

const refreshCoordinator = createRefreshCoordinator(refreshTracker, () => {
  now.value = Date.now()
})

function load() {
  return refreshCoordinator.run()
}

function rememberFocus() {
  focusReturn = document.activeElement instanceof HTMLElement ? document.activeElement : null
}

async function focusDialog() {
  await nextTick()
  document.querySelector<HTMLElement>('[data-active-dialog] [data-dialog-title]')?.focus()
}

async function restoreFocus() {
  await nextTick()
  focusReturn?.focus()
  focusReturn = null
}

function openDialog(kind: Exclude<Dialog, null>) {
  rememberFocus()
  dialogError.value = ''
  setForm(kind === 'edit' && active.value ? active.value.startedAt : Date.now())
  dialog.value = kind
  void focusDialog()
}

function closeDialog() {
  dialog.value = null
  void restoreFocus()
}

function handleDialogKeydown(event: KeyboardEvent, close: () => void) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return
  const container = event.currentTarget as HTMLElement
  const controls = [...container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter(item => item.offsetParent !== null)
  if (!controls.length) return
  const first = controls[0]!
  const last = controls[controls.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

async function saveStart() {
  const startedAt = formTimestamp()
  if (!Number.isFinite(startedAt) || startedAt > Date.now() + 2_000) {
    dialogError.value = 'Оберіть коректний момент у минулому.'
    return
  }
  saving.value = true
  dialogError.value = ''
  try {
    state.value = active.value
      ? await apiFetch<TrackerState>(`/api/attempts/${active.value.id}`, {
          method: 'PATCH',
          body: { startedAt, timezone: timezone(), version: active.value.version, requestId: requestId() },
        })
      : await apiFetch<TrackerState>('/api/attempts', {
          method: 'POST',
          body: { startedAt, timezone: timezone(), requestId: requestId() },
        })
    closeDialog()
  } catch (cause: any) {
    dialogError.value = cause?.data?.statusMessage || 'Не вдалося зберегти. Спробуй ще раз.'
  } finally {
    saving.value = false
  }
}

async function saveNewPath() {
  if (!active.value) return
  const startedAt = formTimestamp()
  if (!Number.isFinite(startedAt)) {
    dialogError.value = 'Оберіть коректні дату й час.'
    return
  }
  saving.value = true
  dialogError.value = ''
  try {
    state.value = await apiFetch<TrackerState>('/api/attempts/new-path', {
      method: 'POST',
      body: {
        startedAt,
        timezone: timezone(),
        version: active.value.version,
        trigger: selectedTrigger.value,
        rankKey: level.value.name,
        requestId: requestId(),
      },
    })
    closeDialog()
  } catch (cause: any) {
    dialogError.value = cause?.data?.statusMessage || 'Не вдалося зберегти момент. Спробуй ще раз.'
  } finally {
    saving.value = false
  }
}

async function saveSettings() {
  const cost = Number(costDraft.value.replace(',', '.'))
  if (!Number.isFinite(cost) || cost < 0 || cost > 10_000) {
    settingsError.value = 'Вкажіть коректну денну суму від 0 до 10 000.'
    return
  }
  saving.value = true
  settingsError.value = ''
  try {
    state.value = await apiFetch<TrackerState>('/api/settings', {
      method: 'PATCH',
      body: {
        personalReason: reasonDraft.value || null,
        dailySmokingCost: cost,
        requestId: requestId(),
      },
    })
  } catch (cause: any) {
    settingsError.value = cause?.data?.statusMessage || 'Не вдалося зберегти. Спробуй ще раз.'
  } finally {
    saving.value = false
  }
}

async function markWisdomRead() {
  if (!wisdom.value) return
  actionError.value = ''
  try {
    wisdom.value = await apiFetch<DailyWisdomState>('/api/wisdom/read', {
      method: 'POST',
      body: {
        date: wisdom.value.date,
        wisdomId: wisdom.value.wisdom.id,
        timezone: timezone(),
        requestId: requestId(),
      },
    })
  } catch {
    actionError.value = 'Не вдалося зберегти відмітку.'
  }
}

function startChakra(round = 0) {
  if (chakraEndsAt.value === null) rememberFocus()
  chakraRound.value = round
  chakraStage.value = 'running'
  chakraEndsAt.value = Date.now() + 60_000
  void focusDialog()
}

function closeChakra() {
  chakraEndsAt.value = null
  void restoreFocus()
}

async function recordTrigger(trigger: Trigger | undefined) {
  actionError.value = ''
  if (trigger) {
    try {
      state.value = await apiFetch<TrackerState>('/api/cravings', {
        method: 'POST',
        body: { trigger, rankKey: level.value.name, requestId: requestId() },
      })
    } catch {
      actionError.value = 'Не вдалося зберегти тригер.'
    }
  }
  closeChakra()
}

function openDeleteHistory(attempt: Attempt) {
  rememberFocus()
  deleteHistoryAttempt.value = attempt
  void focusDialog()
}

function closeDeleteHistory() {
  deleteHistoryAttempt.value = null
  void restoreFocus()
}

async function deleteHistory() {
  if (!deleteHistoryAttempt.value) return
  saving.value = true
  actionError.value = ''
  try {
    state.value = await apiFetch<TrackerState>(`/api/attempts/${deleteHistoryAttempt.value.id}`, {
      method: 'DELETE',
      body: { requestId: requestId() },
    })
    closeDeleteHistory()
  } catch {
    actionError.value = 'Не вдалося видалити запис. Спробуй ще раз.'
  } finally {
    saving.value = false
  }
}

function refreshWhenVisible() {
  if (!document.hidden) void load()
}

function refreshWhenFocused() {
  void load()
}

function markOffline() {
  offline.value = true
}

onMounted(() => {
  void load()
  timer = setInterval(() => {
    now.value = Date.now()
    if (chakraEndsAt.value && chakraRemaining.value === 0 && chakraStage.value === 'running') {
      chakraStage.value = 'checkin'
    }
  }, 1_000)
  document.addEventListener('visibilitychange', refreshWhenVisible)
  window.addEventListener('focus', refreshWhenFocused)
  window.addEventListener('online', refreshWhenFocused)
  window.addEventListener('offline', markOffline)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('visibilitychange', refreshWhenVisible)
  window.removeEventListener('focus', refreshWhenFocused)
  window.removeEventListener('online', refreshWhenFocused)
  window.removeEventListener('offline', markOffline)
})
</script>

<template>
  <main class="app-shell">
    <div v-if="offline" class="offline" role="status">
      Немає зв’язку. Дані оновляться, коли він з’явиться.
    </div>
    <div v-if="needRefresh" class="update-banner" role="status">
      Доступне оновлення
      <button type="button" @click="updateServiceWorker(true)">Оновити</button>
    </div>
    <section v-if="loading" class="center-state" aria-busy="true">
      <span class="loading-mark" aria-hidden="true">忍</span>
      <p>Завантажуємо твій шлях…</p>
    </section>

    <template v-else-if="state">
      <header class="topbar">
        <div>
          <p class="eyebrow">ВІЛЬНО · 忍道</p>
          <h1>{{ tab === 'today' ? 'Твій шлях шинобі' : tab === 'milestones' ? 'Ранги шляху' : 'Налаштування' }}</h1>
        </div>
        <span
          class="status-dot"
          :class="{ online: !offline }"
          role="img"
          :aria-label="offline ? 'Офлайн' : 'Онлайн'"
        />
      </header>
      <p v-if="loadError" class="refresh-error" role="status">{{ loadError }}</p>
      <p v-if="actionError" class="refresh-error" role="alert">{{ actionError }}</p>

      <section v-if="tab === 'today'" class="today">
        <template v-if="active && progress">
          <div class="rank-label">
            <span>{{ level.japanese }}</span>
            <strong>{{ level.name }}</strong>
          </div>
          <button
            class="character"
            type="button"
            :aria-expanded="characterOpen"
            :aria-label="`Поточний ранг: ${level.name}. Показати пояснення`"
            @click="characterOpen = !characterOpen"
          >
            <img :src="`/characters/naruto-${level.art}.png?v=2`" alt="" width="1024" height="1536">
            <span class="character-color" :style="{ clipPath: `inset(${100 - milestoneProgress}% 0 0 0)` }">
              <img :src="`/characters/naruto-${level.art}.png?v=2`" alt="" width="1024" height="1536">
            </span>
          </button>
          <p v-if="characterOpen" class="character-note">{{ level.note }}</p>
          <div class="counter">
            <strong>{{ progress.days }}</strong>
            <span>{{ pluralDays(progress.days) }} свободи</span>
          </div>
          <p class="subcounter">
            {{ String(progress.hours).padStart(2, '0') }} год {{ String(progress.minutes).padStart(2, '0') }} хв
          </p>
          <article class="money-card">
            <span>Залишилося в тебе</span>
            <strong>{{ formatMoney(currentSaved) }}</strong>
          </article>
          <div class="milestone-card">
            <div class="row">
              <span v-if="nextMilestone">До {{ nextMilestone }} {{ pluralDays(nextMilestone) }}</span>
              <span v-else>Твій шлях триває</span>
              <strong>{{ Math.round(milestoneProgress) }}%</strong>
            </div>
            <div
              class="progress"
              role="progressbar"
              aria-label="Прогрес до наступного рангу"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="Math.round(milestoneProgress)"
            >
              <span :style="{ width: `${milestoneProgress}%` }" />
            </div>
          </div>
          <article v-if="state.settings.personalReason" class="reason-card">
            <span>Твоя причина</span>
            <strong>{{ state.settings.personalReason }}</strong>
          </article>
          <article v-if="state.triggerInsight" class="insight">
            Останнім часом бажання найчастіше виникало: {{ triggerLabels[state.triggerInsight.trigger as Trigger] }}.
          </article>
          <button class="primary breath" type="button" @click="startChakra()">
            Концентрація чакри <span>60 с</span>
          </button>
          <article v-if="wisdom" class="wisdom-card" :class="{ open: scrollOpen }">
            <button
              class="scroll-head"
              type="button"
              :aria-expanded="scrollOpen"
              @click="scrollOpen = !scrollOpen"
            >
              <span>今日の言葉 · {{ wisdom.wisdom.category }}</span>
              <strong>Слова на сьогодні</strong>
              <i aria-hidden="true">{{ scrollOpen ? '−' : '+' }}</i>
            </button>
            <div v-if="scrollOpen" class="scroll-body">
              <p class="wisdom-japanese">{{ wisdom.wisdom.japanese }}</p>
              <p class="romaji">{{ wisdom.wisdom.romaji }}</p>
              <p class="translation">{{ wisdom.wisdom.translation }}</p>
              <p class="reflection">{{ wisdom.wisdom.reflection }}</p>
              <p v-if="wisdom.wisdom.practice" class="practice">{{ wisdom.wisdom.practice }}</p>
              <button v-if="!wisdom.readAt" class="stamp-button" type="button" @click="markWisdomRead">
                Прочитано <span>読</span>
              </button>
              <p v-else class="read-stamp">読 · Прочитано</p>
            </div>
          </article>
          <p v-else-if="wisdomError" class="wisdom-error">{{ wisdomError }}</p>
        </template>

        <section v-else class="onboarding">
          <span class="loading-mark" aria-hidden="true">忍</span>
          <h2>Почни свій шлях</h2>
          <p>Відміть момент, з якого ти не куриш. Ми подбаємо про точний відлік.</p>
          <button class="primary" type="button" @click="openDialog('start')">Почати зараз</button>
          <button class="quiet" type="button" @click="openDialog('start')">Вказати дату й час</button>
        </section>
      </section>

      <section v-else-if="tab === 'milestones'" class="milestones">
        <p class="support">Нові етапи ближчі на початку. Далі шлях просто стає твоїм життям.</p>
        <div class="rank-grid">
          <article
            v-for="item in NINJA_LEVELS"
            :key="item.day"
            class="rank-card"
            :class="{ earned: item.day <= level.day, current: item.day === level.day }"
          >
            <span>{{ item.japanese }}</span>
            <strong>{{ item.name }}</strong>
            <small>{{ item.day === 0 ? 'Початок' : `${item.day} ${pluralDays(item.day)}` }}</small>
            <b class="rank-status">{{ rankStatus(item.day) }}</b>
            <em>{{ item.note }}</em>
          </article>
        </div>
      </section>

      <section v-else class="settings">
        <button v-if="active" class="setting" type="button" @click="openDialog('edit')">
          <span>Початок відліку</span>
          <strong>{{ formatDate(active.startedAt) }}</strong>
        </button>
        <article class="settings-card">
          <label for="personal-reason">
            Чому я хочу бути вільним від куріння?
            <textarea id="personal-reason" v-model="reasonDraft" maxlength="280" placeholder="Необов’язково" />
          </label>
          <div class="chips" aria-label="Готові причини">
            <button
              v-for="reason in reasonSuggestions"
              :key="reason"
              type="button"
              :aria-pressed="reasonDraft === reason"
              @click="reasonDraft = reason"
            >
              {{ reason }}
            </button>
          </div>
          <label for="daily-cost">
            Раніше на куріння за день
            <input id="daily-cost" v-model="costDraft" inputmode="decimal">
          </label>
          <p>Використовуємо цю суму для приблизного розрахунку економії.</p>
          <p v-if="settingsError" class="error" role="alert" aria-live="polite">{{ settingsError }}</p>
          <button class="primary" type="button" :disabled="saving" @click="saveSettings">Зберегти</button>
        </article>
        <article class="history">
          <h2>Історія шляху</h2>
          <div class="journey-total">
            <span>Усього часу без куріння</span>
            <strong>{{ totalParts.days }} {{ pluralDays(totalParts.days) }} {{ totalParts.hours }} год</strong>
            <span>Усього залишилося в тебе</span>
            <strong>{{ formatMoney(totalSaved) }}</strong>
            <small>Найдовший пройдений відрізок: {{ longest }} {{ pluralDays(longest) }}</small>
          </div>
          <div v-for="attempt in state.history" :key="attempt.id" class="history-item">
            <p>
              <strong>{{ formatPeriod((attempt.endedAt || attempt.startedAt) - attempt.startedAt) }}</strong><br>
              {{ formatDate(attempt.startedAt) }} — {{ attempt.endedAt ? formatDate(attempt.endedAt) : '' }}<br>
              {{ formatMoney(attempt.finalSavedMoney ?? 0) }} зекономлено
            </p>
            <button class="quiet" type="button" @click="openDeleteHistory(attempt)">Видалити запис</button>
          </div>
        </article>
        <article class="install">
          <h2>Додай на екран iPhone</h2>
          <p>У Safari натисни «Поширити», потім «На початковий екран».</p>
        </article>
        <button v-if="active" class="quiet new-path" type="button" @click="openDialog('new-path')">
          Зафіксувати нову сигарету
        </button>
      </section>

      <nav aria-label="Основна навігація">
        <button type="button" :class="{ selected: tab === 'today' }" :aria-current="tab === 'today' ? 'page' : undefined" @click="tab = 'today'">Сьогодні</button>
        <button type="button" :class="{ selected: tab === 'milestones' }" :aria-current="tab === 'milestones' ? 'page' : undefined" @click="tab = 'milestones'">Ранги</button>
        <button type="button" :class="{ selected: tab === 'settings' }" :aria-current="tab === 'settings' ? 'page' : undefined" @click="tab = 'settings'">Налаштування</button>
      </nav>
    </template>

    <section v-else class="center-state">
      <p>{{ loadError || 'Не вдалося завантажити трекер.' }}</p>
      <button class="primary" type="button" @click="load">Спробувати ще раз</button>
    </section>

    <div
      v-if="chakraEndsAt !== null"
      class="modal pause"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chakra-title"
      data-active-dialog
      @keydown="handleDialogKeydown($event, closeChakra)"
    >
      <section class="modal-card">
        <span class="chakra" aria-hidden="true">螺旋丸</span>
        <template v-if="chakraStage === 'running'">
          <p class="pause-number" aria-live="off">{{ chakraRemaining }}</p>
          <h2 id="chakra-title" tabindex="-1" data-dialog-title>Концентрація чакри</h2>
          <p>{{ chakraText }}</p>
        </template>
        <template v-else-if="chakraStage === 'checkin'">
          <h2 id="chakra-title" tabindex="-1" data-dialog-title>Як зараз?</h2>
          <button class="primary" type="button" @click="chakraStage = 'trigger'">Вже легше</button>
          <button class="quiet" type="button" @click="startChakra(1)">Ще 60 секунд</button>
          <button class="quiet" type="button" @click="chakraStage = 'trigger'">Випити води</button>
          <button class="quiet" type="button" @click="chakraStage = 'trigger'">Пройтися</button>
        </template>
        <template v-else>
          <h2 id="chakra-title" tabindex="-1" data-dialog-title>Що викликало бажання?</h2>
          <div class="chips">
            <button v-for="(label, key) in triggerLabels" :key="key" type="button" @click="recordTrigger(key as Trigger)">
              {{ label }}
            </button>
          </div>
          <button class="quiet" type="button" @click="recordTrigger(undefined)">Пропустити</button>
        </template>
        <article v-if="state?.settings.personalReason" class="reason-card craving-reason">
          <span>Твоя причина</span>
          <strong>{{ state.settings.personalReason }}</strong>
        </article>
        <button v-if="chakraStage === 'running'" class="quiet" type="button" @click="closeChakra">Повернутися</button>
      </section>
    </div>

    <div
      v-if="dialog"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="path-dialog-title"
      data-active-dialog
      @keydown="handleDialogKeydown($event, closeDialog)"
    >
      <form class="modal-card" @submit.prevent="dialog === 'new-path' ? saveNewPath() : saveStart()">
        <h2 id="path-dialog-title" tabindex="-1" data-dialog-title>
          {{ dialog === 'edit' ? 'Виправити початок' : dialog === 'new-path' ? 'Ця сигарета не стирає пройдений шлях.' : 'Почати відлік' }}
        </h2>
        <p>{{ dialog === 'new-path' ? 'Зафіксуй момент і виріши, що робити далі. Попередній період залишиться в історії.' : `Часовий пояс: ${timezone()}` }}</p>
        <label for="path-date">Дата<input id="path-date" v-model="formDate" type="date" required></label>
        <label for="path-time">Час<input id="path-time" v-model="formTime" type="time" required></label>
        <div v-if="dialog === 'new-path'" class="chips" aria-label="Тригер нової сигарети">
          <button
            v-for="(label, key) in triggerLabels"
            :key="key"
            type="button"
            :class="{ selected: selectedTrigger === key }"
            :aria-pressed="selectedTrigger === key"
            @click="selectedTrigger = key as Trigger"
          >
            {{ label }}
          </button>
        </div>
        <p v-if="dialogError" class="error" role="alert" aria-live="polite">{{ dialogError }}</p>
        <button class="primary" :disabled="saving">Підтвердити</button>
        <button class="quiet" type="button" @click="closeDialog">Скасувати</button>
      </form>
    </div>

    <div
      v-if="deleteHistoryAttempt"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      data-active-dialog
      @keydown="handleDialogKeydown($event, closeDeleteHistory)"
    >
      <section class="modal-card">
        <h2 id="delete-dialog-title" tabindex="-1" data-dialog-title>Видалити цей запис?</h2>
        <p>Буде видалено лише обраний запис. Поточний шлях не зміниться.</p>
        <button class="quiet" type="button" :disabled="saving" @click="deleteHistory">Видалити запис</button>
        <button class="quiet" type="button" @click="closeDeleteHistory">Скасувати</button>
      </section>
    </div>
  </main>
</template>

<style>
.character {
  position: relative;
  width: min(100%, 330px);
  height: clamp(300px, 46vh, 380px);
  overflow: visible;
  background: transparent;
  border: 0;
  margin: auto;
  display: block;
}

.character img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: grayscale(1) contrast(2.1) brightness(.62) sepia(.12);
  opacity: .68;
  mix-blend-mode: multiply;
}

.character > img { opacity: .18; }
.character-color { position: absolute; inset: 0; overflow: hidden; transition: clip-path .28s ease; }
.character-color img { filter: none; opacity: 1; mix-blend-mode: normal; }
.money-card, .reason-card, .insight, .settings-card, .journey-total { margin: 14px 0; padding: 14px 16px; border: 1px solid #e4d4b8; border-radius: 16px; background: #fffaf1; }
.money-card span, .reason-card span, .journey-total span { display: block; color: #675f56; font-size: .85rem; }
.money-card strong, .reason-card strong, .journey-total strong { display: block; margin-top: 3px; color: #263c32; overflow-wrap: anywhere; }
.money-card strong { font-size: 1.35rem; }
.insight { font-size: .92rem; color: #575044; }
.settings-card label { display: grid; gap: 7px; margin: 12px 0; font-weight: 700; }
.settings-card input, .settings-card textarea { box-sizing: border-box; width: 100%; min-height: 44px; border: 1px solid #b8aa95; border-radius: 10px; background: #fffdf8; padding: 10px; font: inherit; }
.settings-card textarea { min-height: 76px; resize: vertical; }
.settings-card p { color: #675f56; font-size: .85rem; }
.chips { display: flex; flex-wrap: wrap; gap: 7px; margin: 10px 0; }
.chips button { min-width: 44px; min-height: 44px; padding: 8px 12px; border: 1px solid #b8aa95; border-radius: 999px; background: #fffaf1; color: #433b32; font: inherit; }
.chips button.selected, .chips button[aria-pressed="true"] { border-color: #9f4622; background: #fae4c9; }
.rank-grid em { display: block; margin-top: 7px; font-size: .78rem; font-style: normal; opacity: .82; }
.rank-card { min-height: 142px; padding: 12px; background: #fcf6e9; color: #776e64; display: grid; align-content: center; gap: 5px; border: 1px solid #e2d5c0; border-radius: 13px; text-align: left; }
.rank-card span { font-family: serif; color: #8d8175; }
.rank-card.earned { color: #2a2627; background: #fff4dd; border-color: #c66d2e; box-shadow: 0 7px 15px #bd6b2520; }
.rank-card.earned span { color: #8f321f; }
.rank-card.current { outline: 2px solid #8f321f; outline-offset: 2px; }
.rank-status { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; }
.journey-total small { display: block; margin-top: 10px; color: #675f56; }
.new-path { width: 100%; margin-top: 14px; color: #80452c; }
.practice { border-left: 3px solid #a95e2d; padding-left: 10px; }
.pause .modal-card { text-align: center; }
.chakra { display: block; color: #a94d26; font-size: 2rem; }
.pause-number { font-size: 4rem; font-weight: 800; margin: 8px 0; }
.modal-card .quiet, .modal-card .primary { width: 100%; margin-top: 10px; }
.modal-card label { display: grid; gap: 6px; margin: 12px 0; text-align: left; font-weight: 700; }
.error { color: #982f1d; }
.refresh-error { padding: 10px 12px; border: 1px solid #d5b184; border-radius: 12px; background: #fff5df; color: #714223; }
.craving-reason { order: 5; margin: 4px 0; text-align: left; }
.update-banner button { min-width: 44px; min-height: 44px; padding: 8px 11px; }
.history-item .quiet { min-width: 44px; min-height: 44px; padding: 8px 10px; }
.modal { padding: calc(20px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom)); overflow-y: auto; }
.modal-card { max-height: calc(100dvh - 40px - env(safe-area-inset-top) - env(safe-area-inset-bottom)); overflow-y: auto; }

@media (prefers-reduced-motion: reduce) {
  .character-color { transition: none; }
}
</style>
