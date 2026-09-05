## Purpose

Make the financial value of smoke-free time visible with exact proportional calculations while preserving the value assigned to completed periods.

## ADDED Requirements

### Requirement: Editable daily smoking cost
The application SHALL persist a daily smoking cost and currency in server settings, defaulting to EUR €7.00. The owner SHALL be able to edit the cost in settings with a concise explanation of its use.

#### Scenario: First use
- **WHEN** no cost setting exists
- **THEN** the interface and calculations use €7.00 per day

### Requirement: Proportional active savings
The current period's savings SHALL equal `max(0, elapsedMilliseconds) / 86400000 × dailySmokingCost` and SHALL be formatted in the configured currency rounded only for display. Updates, reloads, background return, and a future start time SHALL never display negative savings.

#### Scenario: Six hours at the default cost
- **WHEN** an active period has elapsed for six hours at €7.00 per day
- **THEN** the displayed savings are €1.75

### Requirement: Immutable completed-period savings
When a period ends, the application SHALL retain its daily cost and final savings. Editing the current daily cost later SHALL not alter amounts shown for completed periods.

#### Scenario: Change cost after an ended period
- **WHEN** a €7.00-per-day period ends and the owner changes the current cost to €8.00
- **THEN** that completed period still shows savings calculated at €7.00
