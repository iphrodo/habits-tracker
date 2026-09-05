## Purpose

Support a lasting smoke-free identity without shame, while preserving every completed period as part of the owner's personal journey.

## ADDED Requirements

### Requirement: Optional personal reason
The application SHALL let the owner save an optional reason for wanting to live smoke-free, selected from provided reasons or entered as custom text. The reason SHALL persist on the server and remain editable without changing any attempt.

#### Scenario: Save a custom reason
- **WHEN** the owner saves a custom reason in settings
- **THEN** it remains visible after reload and is available on the current-path screen

### Requirement: Local civil-time editing
Date and time controls SHALL display the user's local civil date and time for a stored timestamp without deriving the date field from UTC. Saving an unchanged form SHALL preserve the same instant, including near UTC-midnight boundaries. The production implementation SHALL use the environment timezone rather than hard-coding a named timezone.

#### Scenario: Edit January 1 shortly after local midnight
- **WHEN** a timestamp represents 2026-01-01 00:30 in Europe/Sofia and the owner opens and saves the form unchanged
- **THEN** the form still shows January 1 at 00:30 and the saved timestamp represents the same instant

### Requirement: Action-local settings errors
Failure to save the personal reason, daily cost, or start date SHALL show concise inline feedback adjacent to the action that caused it, preserve entered values, and allow retry by submitting again. The feedback SHALL use accessible error semantics such as an alert or live region and SHALL clear after a successful save. It SHALL NOT replace the application with a full-screen error.

#### Scenario: Settings save fails and succeeds on retry
- **WHEN** saving settings fails and the owner submits the unchanged values again successfully
- **THEN** the values remain present after failure, an inline error is announced, and that error disappears after success

### Requirement: Compassionate new path
When the owner records a new cigarette, the application SHALL use neutral, supportive wording, allow an exact past or current date and time, and optionally record one trigger. It SHALL atomically end the active period at that selected moment and start the new active period from the same moment without removing previous data. Retrying the same request SHALL return its original successful state without another mutation.

#### Scenario: Record a new cigarette after a completed period
- **WHEN** the owner confirms an eligible selected moment with an active period
- **THEN** the previous period remains in history and a new active period counts from the selected moment

#### Scenario: New-path transaction fails after ending the active row
- **WHEN** a later write in the new-path transaction fails
- **THEN** the active attempt remains active and no partial history or trigger record is retained

### Requirement: Idempotent legacy restart compatibility
The legacy restart endpoint SHALL remain compatible with installed clients. Retrying the same logical restart request, including after a lost response, SHALL return the successful state from the first request without completing another attempt, duplicating history, or changing the active start date. Reusing an idempotency key for genuinely different operation data SHALL still be rejected.

#### Scenario: Retry a legacy restart after response loss
- **WHEN** the same legacy restart request is delivered twice
- **THEN** both responses are successful and the database has the same logical state as after one request

### Requirement: Journey history and whole-path summary
The settings screen SHALL call completed records «Історія шляху» and show each period's duration, date range, and retained savings. It SHALL also show total smoke-free time and total retained savings across all completed periods plus the active period, excluding gaps between periods.

#### Scenario: Several periods with a gap
- **WHEN** history has two completed periods and one active period separated by smoking intervals
- **THEN** the summary adds only the three recorded durations and their savings

### Requirement: Backward-compatible server persistence
Settings, craving events, and attempt economics SHALL use the existing server-backed no-account storage architecture. Schema changes SHALL be additive and idempotent; legacy attempts and missing optional fields SHALL remain readable with safe defaults. Migration and application startup SHALL NOT delete history, replace the active start date, or create a new active attempt without an explicit owner action.

#### Scenario: Open an existing pre-enhancement database
- **WHEN** the application initializes against legacy attempt rows without the new optional fields
- **THEN** migration preserves the rows and active start date, supplies safe economic defaults, and does not create or remove an attempt

### Requirement: Supportive language
The application SHALL avoid language that labels a new period as failure, loss, reset, or erased progress. It SHALL use brief Ukrainian messages that shift from handling a moment at early stages to autonomy and identity at later stages. The primary Today counter SHALL describe elapsed days as «день свободи», «дні свободи», or «днів свободи» rather than repeatedly labeling them «без куріння».

#### Scenario: New path confirmation
- **WHEN** the owner opens the new-path flow
- **THEN** the screen communicates that one cigarette does not erase the path already completed

#### Scenario: Primary elapsed-day label
- **WHEN** the Today screen shows the main elapsed-day counter
- **THEN** its Ukrainian label uses the grammatically appropriate form of «дні свободи» and does not say «днів без куріння»
