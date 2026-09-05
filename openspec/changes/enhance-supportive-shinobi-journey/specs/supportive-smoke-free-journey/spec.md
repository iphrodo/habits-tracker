## Purpose

Support a lasting smoke-free identity without shame, while preserving every completed period as part of the owner's personal journey.

## ADDED Requirements

### Requirement: Optional personal reason
The application SHALL let the owner save an optional reason for wanting to live smoke-free, selected from provided reasons or entered as custom text. The reason SHALL persist on the server and remain editable without changing any attempt.

#### Scenario: Save a custom reason
- **WHEN** the owner saves a custom reason in settings
- **THEN** it remains visible after reload and is available on the current-path screen

### Requirement: Compassionate new path
When the owner records a new cigarette, the application SHALL use neutral, supportive wording, allow an exact past or current date and time, and optionally record one trigger. It SHALL end the active period at that selected moment and start the new active period from the same moment without removing previous data.

#### Scenario: Record a new cigarette after a completed period
- **WHEN** the owner confirms an eligible selected moment with an active period
- **THEN** the previous period remains in history and a new active period counts from the selected moment

### Requirement: Journey history and whole-path summary
The settings screen SHALL call completed records «Історія шляху» and show each period's duration, date range, and retained savings. It SHALL also show total smoke-free time and total retained savings across all completed periods plus the active period, excluding gaps between periods.

#### Scenario: Several periods with a gap
- **WHEN** history has two completed periods and one active period separated by smoking intervals
- **THEN** the summary adds only the three recorded durations and their savings

### Requirement: Supportive language
The application SHALL avoid language that labels a new period as failure, loss, reset, or erased progress. It SHALL use brief Ukrainian messages that shift from handling a moment at early stages to autonomy and identity at later stages.

#### Scenario: New path confirmation
- **WHEN** the owner opens the new-path flow
- **THEN** the screen communicates that one cigarette does not erase the path already completed
