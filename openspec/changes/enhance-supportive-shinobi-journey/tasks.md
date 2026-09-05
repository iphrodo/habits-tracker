## 1. OpenSpec and audit baseline

- [x] 1.1 Read the complete source prompt, change proposal, design, delta specs, implementation, and existing tests.
- [x] 1.2 Audit every previous task against implementation and verification evidence; reopen unsupported completion claims.
- [x] 1.3 Add normative accessibility, mobile edge-case, PWA lifecycle/privacy, local-time, restart retry, zero-cost, craving-reason, and inline-error requirements.
- [x] 1.4 Run strict OpenSpec validation after the specification and task rewrite.

## 2. Data compatibility and settings

- [x] 2.1 Preserve a deliberately stored zero daily cost when tracker settings are read.
- [x] 2.2 Reject negative, non-finite, and non-numeric daily-cost updates while accepting 0, 7, and 7.5.
- [x] 2.3 Verify missing or null legacy daily cost falls back to €7 without rewriting an intentional zero.
- [x] 2.4 Verify new database creation and additive migration idempotency.
- [x] 2.5 Verify legacy attempt rows and nullable personal-reason fields remain readable.
- [x] 2.6 Verify completed historical savings remain frozen after the current cost changes.

## 3. Attempt mutations and compatibility

- [x] 3.1 Make the legacy restart endpoint return the first successful response for an identical retry.
- [x] 3.2 Verify identical restart retry does not duplicate history or change the active start date, including response-loss simulation.
- [x] 3.3 Preserve conflict behavior for a genuinely different request reusing an idempotency key.
- [x] 3.4 Verify new-path history insertion and active-attempt creation are atomic against a real transaction failure.
- [x] 3.5 Verify the legacy endpoint contract remains compatible with installed clients.

## 4. Local date and time editing

- [x] 4.1 Add pure local civil date/time serialization and parsing helpers without UTC date-field conversion.
- [x] 4.2 Use local form helpers for start-date edit, initial start, and new-path forms.
- [x] 4.3 Cover Europe/Sofia 2026-01-01 00:30, UTC boundaries, 00:01, 23:59, unchanged roundtrip, date-only edits, and time-only edits.

## 5. PWA privacy and foreground lifecycle

- [x] 5.1 Set manifest name, short name, document title, and Apple mobile web app title to the private label «Вільно».
- [x] 5.2 Apply a bounded timeout to every client API request used by the application.
- [x] 5.3 Keep usable data visible and avoid full-screen loading during background refresh.
- [x] 5.4 Recompute local time, savings, and rank progress immediately on visibility and focus events.
- [x] 5.5 Deduplicate overlapping visibility, focus, and online refreshes and clean up listeners.
- [ ] 5.6 Cover initial load, timeout, initial failure, foreground events, deduplication, immediate recomputation, and failed stale-data refresh.

## 6. Settings and craving experience

- [x] 6.1 Show action-local accessible save errors in Settings without clearing the reason or cost drafts.
- [x] 6.2 Clear the Settings error after successful retry and keep start-date dialog errors local to that dialog.
- [x] 6.3 Show the personal reason throughout first and second Chakra rounds and on «Як зараз?» without obscuring stage content.
- [x] 6.4 Suppress the reason card cleanly when no reason exists and keep random wisdom behind the active craving overlay.
- [ ] 6.5 Add component/behavior tests for Settings errors and the Chakra reason states.
- [x] 6.6 Replace the primary «днів без куріння» counter label with the supportive «день/дні/днів свободи» wording and protect it with a regression test.

## 7. Accessibility and mobile resilience

- [x] 7.1 Ensure chips and edit, update, delete, dismiss, and navigation actions have approximately 44×44 CSS pixel hit areas.
- [ ] 7.2 Move focus into every dialog/bottom sheet, trap Tab within it, close dismissible overlays with Escape, and restore trigger focus.
- [x] 7.3 Add programmatic dialog titles, live error semantics, form labels, selected-chip state, and active-navigation state.
- [x] 7.4 Add visible and screen-reader-readable «Пройдений», «Поточний», and «Майбутній» rank states.
- [x] 7.5 Verify all decorative animation and transition paths respect reduced motion.
- [ ] 7.6 Verify 320px viewport, safe areas, bottom navigation, vertical scrolling, long reason/Ukrainian copy, large money, history, and small-screen dialogs.

## 8. Time, money, history, DB, and API regression coverage

- [x] 8.1 Cover elapsed boundaries from 0 minutes through 365+ days and future-start clamping.
- [x] 8.2 Cover proportional €7 savings at 1h, 6h, 12h, 1d, 7d, 30d, 180d, and 365d plus zero-cost behavior and display-only rounding.
- [x] 8.3 Cover one/multiple completed attempts, current plus completed totals, gaps excluded, and large values.
- [x] 8.4 Add handler-level tests for tracker GET, settings success/validation/zero, restart retry/conflict, craving validation, history response, and controlled server failures where supported.
- [x] 8.5 Retain rank threshold/post-365 and all eight wisdom-category regression coverage.

## 9. Reviewability and full verification

- [x] 9.1 Format `app.vue` and extract only coherent helpers/components or composables that materially improve reviewability.
- [x] 9.2 Run formatter/lint if configured, typecheck, unit and integration tests, and production build.
- [x] 9.3 Run strict OpenSpec validation after implementation.
- [ ] 9.4 Perform available browser checks for Today, ranks, settings, Chakra, history, long content, large values, dialogs, bottom navigation, and safe areas; record environments not actually tested.
- [ ] 9.5 Perform available PWA checks for initial launch, foreground/background, Safari/standalone, offline failure, timeout recovery, and second Chakra round; record environments not actually tested.
- [x] 9.6 Re-audit every source-prompt requirement against spec, implementation, automated evidence, and required manual verification before closing any remaining tasks.
