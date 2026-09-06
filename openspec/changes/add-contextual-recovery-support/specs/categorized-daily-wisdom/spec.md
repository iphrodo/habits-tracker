## MODIFIED Requirements

### Requirement: Categorized original daily wisdom
The application SHALL deterministically choose one concise daily card in the device timezone from an eligible, context-weighted set while retaining variety between dates. During days 0–3 it SHALL prefer calm, craving, patience, beginning, and discipline themes; during days 7–90 it SHALL prefer progress, discipline, freedom, and identity; after day 90 it SHALL prefer freedom, identity, and progress. Recovery-after-a-difficult-moment, continuation, or self-compassion themes SHALL be eligible only when completed attempt history establishes a recent restart context. Cards SHALL be original application copy or neutral thoughts and SHALL not be attributed to historical people, Naruto creators, or characters.

#### Scenario: Same local date and context
- **WHEN** the owner reloads the application on the same local date, timezone, and journey context
- **THEN** the same eligible category and card are shown

#### Scenario: Same local date
- **WHEN** the owner reloads the application on the same local date and timezone without changing journey context
- **THEN** the same category and card are shown

#### Scenario: First attempt begins
- **WHEN** an owner in the first days of a first attempt has no completed journey history
- **THEN** recovery-after-a-difficult-moment copy is excluded from selection

#### Scenario: Recent restart
- **WHEN** an owner recently began a new active attempt and completed attempt history exists
- **THEN** supportive recovery, continuation, and self-compassion copy can participate in the varied selection

### Requirement: No wisdom engagement streak
The application SHALL expose wisdom only as a collapsed-to-expanded accordion interaction and SHALL NOT offer or persist a «Прочитано» action, read state, completion state, streak, unread count, missed-card count, reward, or penalty. Opening or ignoring a card SHALL not affect the smoke-free timer, ranks, history, or any engagement score.

#### Scenario: Several unopened days
- **WHEN** the owner returns after not opening wisdom cards for several days
- **THEN** the current day's card remains available with no read control, missed-card message, or engagement state
