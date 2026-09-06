## Why

The current supportive shinobi journey already tracks rank progress, offers a Chakra pause, and records craving triggers, but its character reveal is visually abrupt and its daily support is not yet contextual. The next increment should add trustworthy recovery landmarks and richer optional craving reflection without turning the personal tracker into a medical dashboard, checklist, or game.

## What Changes

- Refine the existing two-layer Naruto artwork so rank progress reveals full color from bottom to top through a soft feathered boundary, with reduced-motion support.
- Add a compact, expandable «Відновлення» experience based only on the discrete milestones and cautious wording published by WHO, including attribution and a quiet disclaimer and never health percentages.
- Select wisdom from journey-appropriate categories while preserving date-stable variety and reserving recovery-after-a-difficult-moment copy for journeys with restart history.
- Separate «Практика дня» into a curated, stage-aware, local-calendar-day-stable suggestion without completion, streak, reward, or missed state; remove the persisted «Прочитано» interaction from wisdom.
- Extend the existing voluntary craving flow with optional 1–5 intensity and coping-method choices, a visible skip path, and compact descriptive insights only after at least five relevant events.
- Keep the personal reason visible throughout Chakra and add restrained elapsed-time progress while retaining the 60-second countdown.
- Preserve the existing three-tab mobile-first architecture, server-backed persistence, history, and legacy craving rows.

## Capabilities

### New Capabilities

- `evidence-based-recovery`: Discrete WHO recovery milestones, current/next state calculation, compact Today presentation, expanded timeline, disclaimer, and source attribution.
- `contextual-daily-practice`: Curated, journey-stage-aware behavioral suggestions that remain stable for a local calendar day and have no completion model.

### Modified Capabilities

- `adaptive-shinobi-progression`: Make the existing rank character reveal visibly gradual, softly feathered, and tied to progress within the current rank interval.
- `categorized-daily-wisdom`: Make daily selection context-aware, prevent inappropriate recovery copy on a first journey, and remove the read/checklist state from the experience.
- `craving-support`: Add optional intensity and coping capture, a five-event insight threshold, coping insights, and restrained Chakra time progress.
- `supportive-smoke-free-journey`: Preserve new-journey history while restarting recovery timing and expose richer optional craving fields through additive persistence.
- `accessible-mobile-experience`: Cover recovery disclosure, craving choice steps, wisdom accordion, Chakra progress, focus behavior, textual state, and narrow-iPhone layout.

## Impact

The change affects the Today and Chakra UI in `app.vue`, supporting styles, tracker and wisdom response types, pure shared/server calculation modules, craving and wisdom API handlers, and the SQLite-compatible schema initialization in `server/utils/db.ts`. It adds an idempotent additive migration for nullable craving fields, retains existing endpoints where practical, adds no heavy dependency or navigation tab, and expands unit/API/UI contract coverage plus mobile viewport verification.
