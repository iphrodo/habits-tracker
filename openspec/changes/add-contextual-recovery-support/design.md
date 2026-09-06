## Context

See `proposal.md` for motivation. The application is a compact Nuxt PWA whose main experience and state orchestration currently live in `app.vue`; server persistence is implemented by idempotent numbered SQLite/Turso migrations in `server/utils/db.ts`. Rank thresholds and time helpers are already shared, wisdom is chosen by local date, and the Chakra flow currently writes a craving event immediately after trigger selection. Existing user work has archived the preceding OpenSpec change, so this change must extend the current main specs without editing that archive.

## Goals / Non-Goals

**Goals:**

- Keep calculations for recovery, stage/context selection, rank-relative reveal progress, and insights pure and unit-testable.
- Keep Today compact by default while adding all requested information and accessible disclosure behavior.
- Deploy craving schema changes safely against both fresh and existing databases.
- Preserve existing endpoints and stored wisdom-read rows for installed-client compatibility even though the current UI stops creating read state.

**Non-Goals:**

- Medical personalization, health percentages, symptom tracking, diagnoses, or guarantees.
- A fourth navigation tab, an analytics dashboard, journal, task system, streak, XP, or notifications.
- A component-architecture rewrite or new third-party UI/state dependency.
- Destructive removal of legacy `daily_wisdom_reads` data or endpoints.

## Decisions

### Use pure catalogs and derived view models

Add small modules for recovery milestones and practices, and extend the existing wisdom module with explicit journey-context inputs. Recovery output will contain each milestone's `future`, `current`, or `completed` textual state plus compact-card selections; it will not contain a health percentage. Thresholds use elapsed durations matching the requested orientation points: 20 minutes, 12 hours, 14–84 days, 30–270 days, 365 days, 5–15 365-day years, 10 365-day years, and 15 365-day years. Overlapping WHO ranges may both be current in the expanded timeline; the compact card chooses the most recently started current range, otherwise the earliest future entry, alongside the latest completed entry.

This centralizes boundary semantics for the required tests and avoids embedding claims or arithmetic in the template. Calendar-month arithmetic was considered, but these are approximate population-level orientation ranges rather than calendar anniversaries; elapsed-duration constants are stable across timezone and daylight-saving transitions.

### Calculate character reveal within the current rank interval

Extend rank helpers to return current and next thresholds and a normalized interval progress. The existing muted base image remains fully rendered. A precisely aligned color overlay uses CSS mask gradients (including the WebKit-prefixed form needed by iOS Safari) with a roughly 48px feather around the dynamic reveal boundary. At the final rank the normalized value is 100. Reduced-motion CSS removes the short mask-position/state transition.

This corrects the current `elapsed / next milestone` behavior, which does not restart the visual cycle at each rank. A plain clipped container was rejected because it produces the exact hard horizontal boundary the change must remove. New raster assets were rejected because the same source artwork already aligns perfectly and CSS can provide the required muted/full-color pair.

### Derive wisdom and practice from one server-known context

The daily-wisdom query will derive active elapsed days, whether completed history exists, and whether the current attempt is a recent restart. Wisdom categories are filtered/weighted by the requested stages and then selected through a deterministic hash/index of local date plus context key; selection is varied between dates but stable on reload. Transitional gaps (days 4–6) use a union of early and middle themes, while day 90 belongs to middle and values greater than 90 use late themes. Recovery/self-compassion entries are excluded unless restart history is present and recent (within the first seven active days).

Practice uses its own curated catalog and deterministic selection with the same local date and a simple stage (`early` 0–6, `middle` 7–90, `late` 91+). It is returned beside wisdom but has no read/completion field. The existing read table and endpoint remain untouched for old clients; the current UI removes the button, stamp, mutation, and dependency on `readAt`.

Random runtime selection was rejected because reload stability is required. A single combined wisdom/practice catalog was rejected because it makes applicability and the absence of practice completion semantics harder to enforce.

### Submit one craving event after the optional choices

The Chakra UI becomes a short state machine: running → check-in → trigger → intensity → coping. Trigger selection is held locally while optional intensity and coping are chosen or skipped, then one request creates the event. Skipping at the trigger step records nothing; skipping either later step stores `NULL`. The server validates integer intensity in the inclusive range 1–5 and a closed coping-method vocabulary.

Submitting at the end avoids update endpoints and partial event writes. To keep voluntary logging safe, closing the flow before final submission records nothing. Existing `createCravingEvent(trigger, rank, requestId)` call sites/tests will be updated to pass optional values, while omitted values remain valid.

### Add one additive idempotent migration

Append a new numbered migration containing `ALTER TABLE craving_events ADD COLUMN intensity INTEGER CHECK (intensity IS NULL OR (intensity BETWEEN 1 AND 5))` and `ALTER TABLE craving_events ADD COLUMN coping_method TEXT` with an allowed-values check where supported by the existing migration style. Inserts will name columns explicitly so pre-change and post-change table order cannot break them. Legacy rows naturally read as `NULL`; no backfill is performed.

Rollback is application-first: the prior app ignores the additive columns. The database columns remain because SQLite column removal would be destructive and unnecessary.

### Compute insights from a bounded recent event set

Fetch recent craving rows (the existing 30-day window) and pass them to a pure insight selector. Fewer than five total relevant rows yields no insight. A unique dominant trigger is the primary compact pattern; when no unique trigger exists, a unique dominant coping method or a unique trigger among maximum-intensity rows may be used. Ties at each candidate level are omitted instead of broken alphabetically, preventing arbitrary claims. The response carries display-ready insight kind/key/count rather than diagnostic language; UI maps controlled keys to supportive Ukrainian copy.

The existing SQL `LIMIT 1` approach was rejected because it silently breaks ties and currently presents a pattern after only two repeated events.

### Keep Recovery inline and collapsed

Use a semantic button controlling an inline expanded region in Today. This reuses the existing accordion pattern, avoids additional modal focus complexity, and keeps the default screen compact. Each timeline row includes marker plus visible state text. WHO attribution opens the official HTTPS page, and the disclaimer is visually quiet rather than an alert.

### Use native progress semantics for Chakra

Keep the large countdown and add a thin `progressbar`/native progress line whose value is elapsed seconds from 0 to 60. It updates with the existing one-second timer and carries a screen-reader label. No new animation loop is introduced; reduced-motion retains immediate value changes without decorative transition.

## Risks / Trade-offs

- [CSS masking differs between browser engines] → Set both standard and `-webkit-` mask properties, retain the muted base as a complete fallback, and verify on iPhone Safari-sized rendering.
- [WHO wording or source page may change] → Keep the source URL and claims in one catalog and reproduce only the supplied cautious claims; do not infer extra medical detail.
- [Overlapping WHO ranges can show more than one current period] → Permit truthful overlap in the expanded timeline and choose only the most recently begun range for the compact card.
- [Today becomes longer] → Keep Recovery and wisdom collapsed, show at most one insight, and verify 320px width plus a contemporary iPhone viewport.
- [Holding craving choices until the final step can lose an unfinished entry] → This is consistent with voluntary capture; every intermediate step has skip/close behavior and no partial record is preferable to silently recording incomplete intent.
- [Legacy clients still post wisdom read state] → Preserve the existing endpoint and table while removing the interaction only from the new UI.

## Migration Plan

1. Ship the additive craving-columns migration before code paths rely on the columns; application startup continues to apply numbered migrations idempotently.
2. Deploy server parsing, explicit-column inserts, response types, and pure insight/context selection.
3. Deploy the Today/Chakra UI and styling; old craving rows surface nullable fields and remain included in trigger-only analysis.
4. If rollback is necessary, redeploy the prior application. Leave additive nullable columns and existing read records in place; they do not change prior behavior.
