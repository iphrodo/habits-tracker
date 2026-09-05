## Purpose

Offer a small daily Japanese-styled reflection that supports the owner's path without false attribution, engagement streaks, or pressure to open it.

## ADDED Requirements

### Requirement: Categorized original daily wisdom
The application SHALL deterministically choose one concise daily card in the device timezone from categories for craving, calm, identity, progress, discipline, recovery after a difficult day, freedom, and patience. Cards SHALL be original application copy or neutral thoughts; they SHALL not be attributed to historical people, Naruto creators, or characters.

#### Scenario: Same local date
- **WHEN** the owner reloads the application on the same local date and timezone
- **THEN** the same category and card are shown

### Requirement: No wisdom engagement streak
The application SHALL allow a card to be opened, ignored, or marked read without affecting the smoke-free timer, ranks, history, or any engagement score. It SHALL not show missed-card counts or penalties.

#### Scenario: Several unopened days
- **WHEN** the owner returns after not opening wisdom cards for several days
- **THEN** the current day's card remains available with no missed-card message
