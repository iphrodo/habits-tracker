## Purpose

Give the owner a calm, optional way to pause during a craving and recognize recurring contexts without making medical claims or creating obligations.

## ADDED Requirements

### Requirement: Guided chakra concentration
The application SHALL provide a voluntary 60-second «Концентрація чакри» flow with three timed messages. On completion it SHALL ask how the owner feels and offer «Вже легше», «Ще 60 секунд», «Випити води», and «Пройтися» without treating any choice as success or failure.

#### Scenario: Repeat the pause
- **WHEN** the owner chooses «Ще 60 секунд» after the first round
- **THEN** a second 60-second round begins with the alternate calm messages

### Requirement: Optional trigger capture
After a concentration round, the application SHALL offer optional trigger choices: stress, coffee, alcohol, after food, company, boredom, habit, and other. It SHALL record the selected trigger with timestamp, active-period day, and current rank when available.

#### Scenario: Skip trigger capture
- **WHEN** the owner closes or skips the trigger prompt
- **THEN** concentration remains complete and no craving event is required or recorded

### Requirement: Non-medical trigger insight
When recorded events are sufficient to identify a most frequent trigger in a recent period, the application SHALL display one short observational insight in Ukrainian. It SHALL not call the trigger a problem or make a medical conclusion.

#### Scenario: Repeated coffee events
- **WHEN** coffee is the most frequent recorded trigger in the recent period
- **THEN** the application can say that coffee occurred most often recently
