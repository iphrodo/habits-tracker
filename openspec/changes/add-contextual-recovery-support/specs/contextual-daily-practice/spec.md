## Purpose

Offer one small, concrete, optional behavioral suggestion suited to the current journey while avoiding daily-task mechanics, pressure, and runtime-generated advice.

## ADDED Requirements

### Requirement: Curated practice catalog
The application SHALL select «今日の修行 · Практика дня» from a version-controlled catalog of concise original texts with stable identifiers and stage or context tags. Practice text SHALL be concrete, non-moralizing, and free of commands implying obligation or guilt; it SHALL NOT be generated at runtime by an AI or external API.

#### Scenario: Render a daily practice
- **WHEN** the Today wisdom card is expanded during an active journey
- **THEN** it includes one authored practice applicable to the current journey context

### Requirement: Local-day-stable contextual selection
Practice selection SHALL be deterministic for the combination of local calendar date and applicable journey stage so reloads during that local day return the same practice. The eligible set SHALL be filtered for early, middle, or late journey context before date-stable selection, and a local date SHALL be derived in the requested device timezone rather than from UTC.

#### Scenario: Reload on the same local date
- **WHEN** the owner reloads repeatedly on one local calendar date with the same journey context
- **THEN** the same practice is returned

#### Scenario: Cross UTC midnight within one local date
- **WHEN** UTC date changes while the owner's local calendar date remains unchanged
- **THEN** the selected practice does not change

#### Scenario: Next local date
- **WHEN** the owner's local calendar date advances
- **THEN** selection can produce a different eligible practice

#### Scenario: Stage filtering
- **WHEN** the active journey is in an early, middle, or late stage
- **THEN** only practices tagged as applicable to that stage participate in selection

### Requirement: Practice is not a task
The application SHALL NOT provide a checkbox, completion state, read state, streak, reward, counter, missed state, notification, or persistence record for practice engagement.

#### Scenario: Ignore a practice
- **WHEN** the owner does not act on or open a practice and returns on a later date
- **THEN** no missed message, penalty, count, or completion history is shown

