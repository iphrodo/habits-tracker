## 1. Data model and server contracts

- [x] 1.1 Add additive, idempotent Turso migration for tracker settings, frozen attempt economics, and craving events; backfill existing attempts with the €7 default.
- [x] 1.2 Extend shared server types and tracker-state assembly with settings, frozen historical values, journey totals, and a safe recent trigger insight.
- [x] 1.3 Add validated settings read/update persistence for personal reason and daily smoking cost with EUR default.
- [x] 1.4 Implement an idempotent new-path mutation with selected date/time, optional trigger, overlap/version validation, retained history, and frozen final savings.
- [x] 1.5 Implement an idempotent optional craving-event mutation and keep the old restart route compatible with installed clients.

## 2. Pure domain helpers and content

- [x] 2.1 Add precise non-negative elapsed-time, proportional savings, money-formatting, and period-total helpers with no persisted ticking values.
- [x] 2.2 Replace rank data with the eleven specified milestones, including the 270-day stage, stage-appropriate original notes, and post-year behavior.
- [x] 2.3 Replace attributed proverb entries with categorized original daily wisdom, maintaining deterministic date selection and read-state compatibility.

## 3. Today experience

- [x] 3.1 Add visible but secondary current savings, compact personal-reason card, and optional recent trigger insight while preserving existing information hierarchy and character treatment.
- [x] 3.2 Replace the chakra pause with its three timed stages, alternate repeat round, completion check-in, optional water/walk actions, and optional trigger capture.
- [x] 3.3 Apply calm, stage-aware Ukrainian support copy and reduced-motion-safe transitions throughout the Today flow.

## 4. Settings and journey history

- [x] 4.1 Add settings controls for exact start date/time, editable reason, and editable €7/day baseline with validated save/error states.
- [x] 4.2 Replace «Попередні спроби» with «Історія шляху», period duration/date/savings, longest segment, and all-period duration/savings summary.
- [x] 4.3 Replace the restart dialog with the supportive new-path flow, selected timestamp, optional trigger, and preserved-history explanation; retain per-record test deletion.

## 5. Validation and delivery readiness

- [x] 5.1 Add unit tests for time boundaries, rank cadence (including 60/90/270/365+), €7 proportional savings, historical frozen savings, totals, and future timestamps.
- [x] 5.2 Add API/database tests for migration/backfill, settings persistence, new-path atomicity/idempotency, trigger capture/insight, and compatibility with old attempt rows.
- [ ] 5.3 Verify keyboard semantics, 44px touch targets, contrast, reduced motion, narrow iPhone layout, safe areas, and PWA foreground reload behavior.
- [x] 5.4 Run typecheck, tests, production build, strict OpenSpec validation, and a local Turso-backed API smoke test; record any manual iPhone checks still required.
