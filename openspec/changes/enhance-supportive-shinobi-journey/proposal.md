## Why

«Вільно» already tracks an active smoke-free period, but its language and interaction model still frame the experience primarily as a streak. The application needs to preserve completed progress, support an immediate craving without shame, and make the practical benefit of time without smoking visible while retaining the calm shinobi theme.

## What Changes

- Add an optional personal reason for living smoke-free and make it prominent during a craving.
- Replace the one-step chakra pause with a three-stage, repeatable 60-second support flow and optional trigger logging with simple, non-medical insights.
- Rework starting a new period as a compassionate “new path” flow that records the chosen date/time and preserves the prior period and its cost basis.
- Rename and expand history into «Історія шляху», including each period's duration and savings plus total time and savings across periods.
- Add editable daily smoking cost (default €7.00), proportional current savings, and immutable historical savings.
- Revise ranks and all supporting messages for a gradual, non-punitive 0–365 day progression; continue the timer after the maximum rank.
- Replace attribution-risky wisdom copy with categorized, concise original support messages and optional practical prompts.
- Preserve the existing Nuxt/Turso/no-account/PWA architecture and migrate existing data safely.

## Capabilities

### New Capabilities
- `supportive-smoke-free-journey`: Personal reason, compassionate new-path flow, retained journey history, and psychologically supportive progress language.
- `craving-support`: Guided chakra concentration, optional craving triggers, and non-medical trigger insights.
- `smoking-cost-savings`: Configurable daily cost and accurate current, historical, and total savings.
- `adaptive-shinobi-progression`: Revised rank cadence, stage-appropriate messaging, and continued post-year tracking.
- `categorized-daily-wisdom`: Deterministic daily, categorized original wisdom cards without engagement streaks.

### Modified Capabilities

- None; this repository has no main-spec capability paths yet. This change establishes the requirements for the existing implemented tracker.

## Impact

- Affects the Nuxt UI in `app.vue`, shared time/rank helpers, server types, Turso schema migrations, tracker and attempt APIs, wisdom data, and tests.
- Adds Turso tables/columns through backward-compatible migrations; existing attempts and wisdom-read records remain usable.
- Adds no authentication, analytics, third-party user service, or client-only persistence.
