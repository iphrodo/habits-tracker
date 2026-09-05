## Context

See [proposal.md](proposal.md). The application is a client-rendered Nuxt PWA with one page component, Nitro handlers, and a shared Turso/libSQL database. `attempts` is the source of truth for time: an active row has `ended_at IS NULL`, while completed rows are history. Existing migrations are versioned in `server/utils/db.ts`; mutation receipts make writes idempotent.

## Goals / Non-Goals

**Goals:**

- Extend the existing API/state response rather than introducing a second client data model.
- Preserve old rows through additive, idempotent Turso migrations.
- Keep elapsed time timestamp-derived; keep completed savings immutable.
- Keep all new interactions optional, touch-friendly, and contained in the established three-tab UI.

**Non-Goals:**

- Accounts, per-user isolation, medical assessment, push notifications, journal entries, engagement streaks, or a broad component-framework rewrite.

## Decisions

### Single settings row and frozen attempt economics

Add a singleton `tracker_settings` row holding `personal_reason`, `daily_smoking_cost`, and `currency`, initialized lazily to `NULL`, `7`, and `EUR`. Add nullable `daily_smoking_cost_at_start` and `final_saved_money` to `attempts`.

New active attempts copy the current cost to their start-cost column. Ending an attempt computes its final saving from its actual duration and frozen start cost inside the same transaction. Old completed rows derive a historical default of €7 and are backfilled with final values during migration; old active rows use €7 as their frozen cost. This avoids repricing prior history after a settings edit.

An alternative of calculating all history from the current setting was rejected because it changes the meaning of already completed periods. A separate finance ledger was rejected because an attempt has one relevant cost basis and final value.

### New-path transaction retains history

Replace the semantic restart operation with a `new-path` request accepting a selected timestamp, timezone, optional trigger, active attempt version, and request ID. The server validates that the timestamp is no earlier than the active start and no later than server time, atomically ends the active row at that time, freezes its saving, optionally stores the trigger, then inserts the new active row with the same timestamp and current cost.

The old restart route can remain as a compatibility alias using server time until the UI moves fully to the new request. This is safer than deleting an existing endpoint while an installed PWA may still use it.

### Craving events as compact immutable records

Add `craving_events` with an ID, creation timestamp, normalized trigger key, attempt ID (nullable for an event that cannot be tied later), period day, and rank key. Record only selected choices; skipping creates no row. The tracker response can include a server-computed recent top trigger when at least a small threshold is met, avoiding unnecessary client aggregation and retaining the no-medical-claim wording centrally.

Free-form journaling was rejected to keep the action lightweight and avoid collecting more sensitive text than needed.

### Deterministic original wisdom catalog

Replace source-attributed proverb entries with a local catalog whose entries contain an ID, category, Japanese decorative label, Ukrainian thought, and optional small practice. Date hashing continues to choose one stable item per timezone day. Read marks remain independent from attempts and have no progress implications.

This avoids unverifiable attribution while preserving the existing daily-card and server-read API.

### Rank and message helpers remain pure

Change shared rank data to the eleven specified day boundaries and add pure helpers for elapsed milliseconds, savings, duration formatting inputs, and stage-aware support copy. The UI derives all live values from `Date.now()` and server records; it does not persist ticking values.

### Incremental UI changes

Keep `app.vue` as the composition root. Add small local components only where a modal or dense card benefits from isolation; retain the existing bottom navigation, character presentation, cream palette, and safe-area behavior. The reason card is compact on Today, rises into the completed craving flow, and settings owns editing. The concentration overlay moves through `running → check-in → trigger` states with exit/skip actions at every step.

Local date/time form values are assembled from local civil getters and parsed with the environment timezone; UTC ISO date slicing is not used for date inputs. Client API calls share a bounded timeout. Focus/visibility/online events update the local clock immediately and use one in-flight refresh coordinator so usable state remains visible. Overlay focus is managed without adding a component framework.

## Risks / Trade-offs

- [An old installed client calls the old restart endpoint] → retain an alias with the existing idempotent behavior during this change.
- [Existing attempts lack new monetary columns] → migrations backfill safely and all reads use safe defaults.
- [A manually selected new-path time overlaps the active start] → validate on the server and return a field-level message without mutation.
- [The large single Vue file becomes harder to maintain] → extract only coherent interaction blocks if doing so reduces risk; do not redesign routing.
- [iOS caches PWA assets and standalone layout differs] → preserve manifest behavior and verify installed PWA manually after deployment.

## Migration Plan

1. Add a new ordered Turso migration creating `tracker_settings` and `craving_events`, and adding frozen-cost/final-saving columns to attempts.
2. Backfill existing attempts using €7.00; calculate final savings for completed rows and attach €7.00 to existing active rows.
3. Deploy code that reads safe defaults before exposing the updated UI.
4. Verify tracker state, migration idempotency, new path, settings edits, and history totals against a copy of production data.
5. Roll back application code if needed; additive columns/tables are harmless to the prior version and no existing data is deleted.
