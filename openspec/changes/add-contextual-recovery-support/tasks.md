## 1. Pure domain models

- [x] 1.1 Add rank-interval helpers and tests proving reveal progress restarts at each rank, reaches 100% at the final rank, and remains bounded.
- [x] 1.2 Add the curated WHO recovery catalog and pure active-journey state/compact-summary calculations without any health percentage field.
- [x] 1.3 Add recovery boundary tests for 0 and 19 minutes, 20 minutes, 11h59m, 12h, 13h, 2 and 12 weeks, 1 and 9 months, 1, 5, 10, and 15 years, 365+ day behavior, and ranges; prove that a new journey restarts Recovery from the new active `startDate` while preserving all previous journey history unchanged.
- [x] 1.4 Add a separate curated practice catalog, stage filtering, and deterministic local-date selection with no completion state.
- [x] 1.5 Add practice tests for same-day reload stability, next-local-day variation, UTC-boundary stability in a local timezone, stage eligibility, and absence of completion metadata.
- [x] 1.6 Extend wisdom selection with deterministic journey-stage weighting and recent-restart eligibility, then test first-attempt exclusion, restart inclusion, same-day stability, and multi-day variety.

## 2. Craving persistence and insights

- [x] 2.1 Add an idempotent migration for nullable `intensity` and `coping_method`, switch craving inserts to explicit columns, and preserve legacy wisdom-read storage/endpoints for installed clients.
- [x] 2.2 Extend craving types and API validation for optional integer intensity 1–5 and exactly these coping methods: «Концентрація чакри», «Вода», «Прогулянка», «Змінив заняття», «Просто почекав», «Поговорив з кимось», «Інше», and «Ще не стало легше»; preserve trigger-only requests and every existing trigger option: «Стрес», «Кава», «Алкоголь», «Після їжі», «Компанія», «Нудьга», «Звичка», and «Інше».
- [x] 2.3 Implement a pure five-event-minimum insight selector for unique dominant trigger, highest-intensity trigger, and coping method with stable non-misleading tie behavior.
- [x] 2.4 Update tracker persistence/response assembly to read recent legacy and enriched events safely and expose at most one descriptive insight.
- [x] 2.5 Add API, insight, and database tests for legacy rows, complete enriched events, skipped optional fields, valid 1–5 values, invalid bounds, fewer than five events, dominant trigger, ties, coping insight, and additive old-database migration.

## 3. Daily support API

- [x] 3.1 Derive elapsed stage and recent-restart context on the server and return the date-stable contextual wisdom plus independently curated practice from the existing daily endpoint.
- [x] 3.2 Update response contracts and API tests while ensuring the current UI no longer creates or displays wisdom read state.

## 4. Today and Chakra experience

- [x] 4.1 Replace the hard character clip with aligned muted/color layers, a 30–60px CSS mask feather, rank-relative reveal value, full-color final rank, and reduced-motion behavior without overlay percentage text.
- [x] 4.2 Add the compact semantic «Відновлення» disclosure and inline full timeline with textual states, cautious approximate timing, quiet disclaimer, and official WHO link.
- [x] 4.3 Simplify wisdom to its existing accordion and render «今日の修行 · Практика дня» inside it without read, completion, streak, counter, or missed state.
- [x] 4.4 Extend Chakra to the preserved eight trigger options → optional five-button intensity → the exact eight optional coping-method chips defined by the API contract, submit one event after the optional flow, and retain obvious skip/close behavior.
- [x] 4.5 Add a restrained accessible 0–60 Chakra progress indicator while keeping the large countdown and personal reason visible in running and check-in states; render no empty personal-reason block when no reason is configured.
- [x] 4.6 Render at most one controlled-language Today insight only when returned by the server, preserving the requested information hierarchy and three-tab navigation.

## 5. Accessibility and responsive verification

- [x] 5.1 Add or update UI contract tests for semantic expanded/selected/progress states, visible labels, focus treatment, 44px targets, reduced motion, no health percentage copy, and no wisdom/practice completion controls.
- [x] 5.2 Verify the Today default and expanded Recovery/Chakra flows at 320px and a representative iPhone viewport, correcting horizontal overflow, safe-area, clipping, focus, and excessive default-page length issues.

## 6. Final validation

- [x] 6.1 Run the available formatter/lint command if configured, TypeScript typecheck, full test suite, and production build; fix all regressions.
- [x] 6.2 Run strict validation for `add-contextual-recovery-support`, review the final diff for accidental redesign/architecture drift, prohibited medical/game/task language, notifications, a complex journal, or new heavy third-party dependencies, and record all checks as passing before marking the change complete.
- [x] 6.3 Prepare the final report covering: changed files; Naruto reveal implementation; added WHO milestones; source-attribution location; Practice of the Day behavior; contextual-wisdom behavior; added craving fields; insight behavior; whether a DB migration was added; backward compatibility; the number of added tests; typecheck/test/build/OpenSpec results; and manual checks still required on iPhone.
- [x] 6.4 Keep the completed work local and do not create or open a pull request unless the user explicitly requests it in a separate follow-up.
