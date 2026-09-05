<script setup lang="ts">
import type { Attempt, DailyWisdomState, TrackerState } from './server/utils/types'
import { MILESTONES, elapsedParts } from './server/utils/types'
import { NINJA_LEVELS, rankForDays } from './shared/ranks'
import { useRegisterSW } from 'virtual:pwa-register/vue'

type Tab = 'today' | 'milestones' | 'settings'

const tab = ref<Tab>('today')
const state = ref<TrackerState | null>(null)
const wisdom = ref<DailyWisdomState | null>(null)
const loading = ref(true)
const offline = ref(!navigator.onLine)
const wisdomError = ref('')
const startDialog = ref(false)
const editDialog = ref(false)
const restartDialog = ref(false)
const deleteHistoryAttempt = ref<Attempt | null>(null)
const characterOpen = ref(false)
const scrollOpen = ref(false)
const celebration = ref('')
const pauseEndsAt = ref<number | null>(null)
const now = ref(Date.now())
const formDate = ref('')
const formTime = ref('')
const formError = ref('')
const saving = ref(false)
const characterImageError = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
let refreshTimer: ReturnType<typeof setInterval> | undefined
let wisdomRefreshTimer: ReturnType<typeof setInterval> | undefined
const { needRefresh, updateServiceWorker } = useRegisterSW()

const active = computed(() => state.value?.activeAttempt || null)
const progress = computed(() => active.value ? elapsedParts(active.value.startedAt, now.value) : null)
const level = computed(() => rankForDays(progress.value?.days || 0))
const nextMilestone = computed(() => MILESTONES.find((day) => day > (progress.value?.days || 0)) || null)
const milestoneProgress = computed(() => nextMilestone.value ? Math.min(100, ((progress.value?.days || 0) / nextMilestone.value) * 100) : 100)
const passedMilestones = computed(() => MILESTONES.filter((day) => day <= (progress.value?.days || 0)))
const unacknowledged = computed(() => passedMilestones.value.filter((day) => !state.value?.acknowledgedMilestones.includes(day)))
const pauseRemaining = computed(() => Math.max(0, Math.ceil(((pauseEndsAt.value || 0) - now.value) / 1000)))
const pauseDone = computed(() => pauseEndsAt.value !== null && pauseRemaining.value === 0)

function pluralDays(days: number) { const last = days % 10; const hundred = days % 100; return hundred >= 11 && hundred <= 14 ? 'днів' : last === 1 ? 'день' : last >= 2 && last <= 4 ? 'дні' : 'днів' }
function localInput(timestamp: number) { const date = new Date(timestamp); return { date: date.toISOString().slice(0, 10), time: date.toTimeString().slice(0, 5) } }
function timezone() { return Intl.DateTimeFormat().resolvedOptions().timeZone }
function requestId() { return crypto.randomUUID() }
function formatDate(timestamp: number) { return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp) }

async function loadWisdom() {
  try { wisdom.value = await $fetch<DailyWisdomState>('/api/wisdom/today', { query: { timezone: timezone() }, timeout: 8_000 }); wisdomError.value = '' }
  catch { wisdomError.value = 'Не вдалося оновити слова дня. Спробуй ще раз, коли буде зв’язок.' }
}
async function load() {
  loading.value = true
  try { const [tracker] = await Promise.all([$fetch<TrackerState>('/api/tracker', { timeout: 8_000 }), loadWisdom()]); state.value = tracker; offline.value = false; queueCelebration() }
  catch { offline.value = true }
  finally { loading.value = false }
}
function openStart(edit = false) { formError.value = ''; const input = localInput(edit && active.value ? active.value.startedAt : Date.now()); formDate.value = input.date; formTime.value = input.time; if (edit) editDialog.value = true; else startDialog.value = true }
function startTimestamp() { return new Date(`${formDate.value}T${formTime.value}`).getTime() }
async function saveStart() {
  const startedAt = startTimestamp(); formError.value = ''
  if (!Number.isFinite(startedAt) || startedAt > Date.now() + 2_000) { formError.value = 'Оберіть момент у минулому.'; return }
  saving.value = true
  try { state.value = active.value ? await $fetch<TrackerState>(`/api/attempts/${active.value.id}`, { method: 'PATCH', body: { startedAt, timezone: timezone(), version: active.value.version, requestId: requestId() } }) : await $fetch<TrackerState>('/api/attempts', { method: 'POST', body: { startedAt, timezone: timezone(), requestId: requestId() } }); startDialog.value = false; editDialog.value = false; queueCelebration() }
  catch (error: any) { formError.value = error?.data?.statusMessage || 'Не вдалося зберегти. Спробуй ще раз.' }
  finally { saving.value = false }
}
async function restart() { saving.value = true; try { state.value = await $fetch<TrackerState>('/api/attempts/restart', { method: 'POST', body: { requestId: requestId() } }); restartDialog.value = false; await loadWisdom() } catch (error: any) { formError.value = error?.data?.statusMessage || 'Не вдалося почати нову спробу.' } finally { saving.value = false } }
async function deleteSelectedHistoryAttempt() { if (!deleteHistoryAttempt.value) return; saving.value = true; try { state.value = await $fetch<TrackerState>(`/api/attempts/${deleteHistoryAttempt.value.id}`, { method: 'DELETE', body: { requestId: requestId() } }); deleteHistoryAttempt.value = null } catch (error: any) { formError.value = error?.data?.statusMessage || 'Не вдалося видалити спробу.' } finally { saving.value = false } }
async function markWisdomRead() { if (!wisdom.value) return; saving.value = true; try { wisdom.value = await $fetch<DailyWisdomState>('/api/wisdom/read', { method: 'POST', body: { date: wisdom.value.date, wisdomId: wisdom.value.wisdom.id, timezone: timezone(), requestId: requestId() } }); wisdomError.value = '' } catch { wisdomError.value = 'Не вдалося зберегти печатку. Повтори, коли буде зв’язок.' } finally { saving.value = false } }
async function queueCelebration() { if (!unacknowledged.value.length || !state.value) return; const latest = Math.max(...unacknowledged.value); try { state.value = await $fetch<TrackerState>('/api/milestones/acknowledge', { method: 'POST', body: { days: unacknowledged.value, requestId: requestId() } }); celebration.value = `Новий рівень: ${NINJA_LEVELS.find((item) => item.day === latest)?.name || `${latest} ${pluralDays(latest)}`}`; characterOpen.value = true } catch { /* progress remains visible */ } }
watch(() => level.value.art, () => { characterImageError.value = false })
function beginPause() { pauseEndsAt.value = Date.now() + 60_000 }
function closePause() { pauseEndsAt.value = null }
onMounted(() => { load(); timer = setInterval(() => { now.value = Date.now() }, 1_000); refreshTimer = setInterval(load, 300_000); wisdomRefreshTimer = setInterval(loadWisdom, 60_000); window.addEventListener('online', load); window.addEventListener('offline', () => offline.value = true); document.addEventListener('visibilitychange', () => { if (!document.hidden) load() }) })
onBeforeUnmount(() => { if (timer) clearInterval(timer); if (refreshTimer) clearInterval(refreshTimer); if (wisdomRefreshTimer) clearInterval(wisdomRefreshTimer) })
</script>

<template>
  <main class="app-shell">
    <div v-if="offline" class="offline" role="status">Немає зв’язку. Дані оновляться, щойно ти знову будеш онлайн.</div>
    <div v-if="needRefresh && !startDialog && !editDialog && pauseEndsAt === null" class="update-banner" role="status"><span>Доступне оновлення.</span><button @click="updateServiceWorker(true)">Оновити</button><button @click="needRefresh = false">Пізніше</button></div>
    <section v-if="loading" class="center-state"><span class="loading-mark">忍</span><p>Завантажуємо твій шлях…</p></section>
    <section v-else-if="!state" class="center-state"><span class="loading-mark">忍</span><p>Не вдалося завантажити трекер.</p><button class="primary" @click="load">Спробувати ще раз</button></section>
    <template v-else>
      <header class="topbar"><div><p class="eyebrow">ВІЛЬНО · 忍道</p><h1>{{ tab === 'today' ? 'Твій шлях шинобі' : tab === 'milestones' ? 'Ранги шляху' : 'Налаштування' }}</h1></div><span class="status-dot" :class="{ online: !offline }" :aria-label="offline ? 'Офлайн' : 'Онлайн'"></span></header>
      <section v-if="tab === 'today'" class="today">
        <template v-if="active && progress">
          <div class="rank-label"><span>{{ level.japanese }}</span><strong>{{ level.name }}</strong></div>
          <button class="character" :class="`character-${level.art}`" type="button" :aria-expanded="characterOpen" :aria-label="`Рівень: ${level.name}`" @click="characterOpen = !characterOpen"><img v-if="!characterImageError" :key="level.art" :src="`/characters/naruto-${level.art}.png`" alt="Наруто Узумакі" width="1024" height="1536" @error="characterImageError = true"><span v-else class="character-fallback" aria-hidden="true">忍</span><span class="character-aura" aria-hidden="true"></span></button>
          <p v-if="characterOpen" class="character-note" role="status">{{ celebration || level.note }}</p>
          <div class="counter"><strong>{{ progress.days }}</strong><span>{{ pluralDays(progress.days) }} без куріння</span></div>
          <p class="subcounter">{{ String(progress.hours).padStart(2, '0') }} год {{ String(progress.minutes).padStart(2, '0') }} хв</p>
          <div class="milestone-card"><div class="row"><span v-if="nextMilestone">До {{ nextMilestone }} {{ pluralDays(nextMilestone) }}</span><span v-else>Ти пройшов усі ранги</span><strong>{{ Math.round(milestoneProgress) }}%</strong></div><div class="progress"><span :style="{ width: `${milestoneProgress}%` }"></span></div></div>
          <article v-if="wisdom" class="wisdom-card" :class="{ open: scrollOpen }"><button class="scroll-head" type="button" :aria-expanded="scrollOpen" @click="scrollOpen = !scrollOpen"><span>今日の言葉</span><strong>Слова на сьогодні</strong><i>{{ scrollOpen ? '−' : '+' }}</i></button><div v-if="scrollOpen" class="scroll-body"><p class="wisdom-japanese">{{ wisdom.wisdom.japanese }}</p><p class="romaji">{{ wisdom.wisdom.romaji }}</p><p class="translation">{{ wisdom.wisdom.translation }}</p><p class="reflection">{{ wisdom.wisdom.reflection }}</p><a :href="wisdom.wisdom.source" target="_blank" rel="noreferrer">{{ wisdom.wisdom.sourceLabel }}</a><button v-if="!wisdom.readAt" class="stamp-button" :disabled="saving" @click="markWisdomRead">Прочитано <span>読</span></button><p v-else class="read-stamp" aria-label="Картку прочитано">読 · Прочитано</p></div></article>
          <p v-else-if="wisdomError" class="wisdom-error">{{ wisdomError }}</p>
          <button class="primary breath" type="button" @click="beginPause">Концентрація чакри <span>60 с</span></button><p class="started">Початок: {{ formatDate(active.startedAt) }}</p>
        </template>
        <section v-else class="onboarding"><span class="loading-mark">忍</span><h2>Почни свій шлях</h2><p>Відміть момент, з якого ти не куриш. Ми подбаємо про точний відлік.</p><button class="primary" @click="openStart()">Почати зараз</button><button class="quiet" @click="openStart()">Вказати дату й час</button></section>
      </section>
      <section v-else-if="tab === 'milestones'" class="milestones"><p class="support">Шкала поєднує ранги, статуси та авторські етапи твого шляху.</p><div class="rank-grid"><button v-for="item in NINJA_LEVELS" :key="item.day" :class="{ earned: (progress?.days || 0) >= item.day }" :aria-label="`${item.name}, ${item.day} ${pluralDays(item.day)}`"><span>{{ item.japanese }}</span><strong>{{ item.name }}</strong><small>{{ item.day === 0 ? 'Початок' : `${item.day} ${pluralDays(item.day)}` }}</small></button></div></section>
      <section v-else class="settings"><button v-if="active" class="setting" @click="openStart(true)"><span>Початок відліку</span><strong>{{ formatDate(active.startedAt) }}</strong></button><article class="install"><h2>Додай на екран iPhone</h2><p>У Safari натисни «Поширити», потім «На початковий екран».</p></article><article v-if="state.history.length" class="history"><h2>Попередні спроби</h2><div v-for="attempt in state.history" :key="attempt.id" class="history-item"><p>{{ formatDate(attempt.startedAt) }} — {{ attempt.endedAt ? formatDate(attempt.endedAt) : '' }}</p><button class="quiet" @click="deleteHistoryAttempt = attempt">Видалити</button></div></article><button v-if="active" class="danger" @click="restartDialog = true">Почати нову спробу</button></section>
      <nav aria-label="Основна навігація"><button :class="{ selected: tab === 'today' }" @click="tab = 'today'">Сьогодні</button><button :class="{ selected: tab === 'milestones' }" @click="tab = 'milestones'">Ранги</button><button :class="{ selected: tab === 'settings' }" @click="tab = 'settings'">Налаштування</button></nav>
    </template>
    <div v-if="pauseEndsAt !== null" class="modal pause" role="dialog" aria-modal="true"><div class="modal-card"><span class="chakra">螺旋丸</span><p v-if="!pauseDone" class="pause-number">{{ pauseRemaining }}</p><h2>{{ pauseDone ? 'Ти впорався з цією хвилиною.' : 'Збери свою чакру' }}</h2><p>{{ pauseDone ? 'Наступний момент — теж твій.' : 'Повільний вдих. Ти не мусиш нічого вирішувати зараз.' }}</p><button class="quiet" @click="closePause">{{ pauseDone ? 'Повернутися' : 'Вийти з паузи' }}</button></div></div>
    <div v-if="startDialog || editDialog" class="modal" role="dialog" aria-modal="true"><form class="modal-card" @submit.prevent="saveStart"><h2>{{ editDialog ? 'Виправити початок' : 'Почати відлік' }}</h2><p>Часовий пояс: {{ timezone() }}</p><label>Дата<input v-model="formDate" type="date" required></label><label>Час<input v-model="formTime" type="time" required></label><p v-if="formError" class="error">{{ formError }}</p><button class="primary" :disabled="saving">Підтвердити</button><button class="quiet" type="button" @click="startDialog = false; editDialog = false">Скасувати</button></form></div>
    <div v-if="restartDialog" class="modal" role="dialog" aria-modal="true"><section class="modal-card"><h2>Почати знову?</h2><p>Поточна спроба залишиться в історії. Новий відлік почнеться з Академії.</p><p v-if="formError" class="error">{{ formError }}</p><button class="danger" :disabled="saving" @click="restart">Почати нову спробу</button><button class="quiet" @click="restartDialog = false">Скасувати</button></section></div>
    <div v-if="deleteHistoryAttempt" class="modal" role="dialog" aria-modal="true"><section class="modal-card"><h2>Видалити цю спробу?</h2><p>Буде видалено лише запис від {{ formatDate(deleteHistoryAttempt.startedAt) }}. Поточний відлік не зміниться.</p><p v-if="formError" class="error">{{ formError }}</p><button class="danger" :disabled="saving" @click="deleteSelectedHistoryAttempt">Видалити спробу</button><button class="quiet" @click="deleteHistoryAttempt = null">Скасувати</button></section></div>
  </main>
</template>

<style>
.character-fallback { position: relative; z-index: 1; display: grid; height: 100%; place-items: center; color: #f3a336; font-family: serif; font-size: 8rem; }
</style>
