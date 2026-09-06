## MODIFIED Requirements

### Requirement: Guided chakra concentration
The application SHALL provide a voluntary 60-second «Концентрація чакри» flow with three timed messages, the existing 60-to-0 number countdown, and a restrained visual indicator of elapsed time. On completion it SHALL ask how the owner feels and offer «Вже легше», «Ще 60 секунд», «Випити води», and «Пройтися» without treating any choice as success or failure. When a personal reason exists, one compact supportive reason card SHALL remain available during timed stages, the «Як зараз?» check-in, and a repeated round without obscuring breathing or focus content. During the active craving flow the personal reason SHALL have priority over random wisdom. When the reason is empty, no empty heading or card SHALL appear.

#### Scenario: Repeat the pause
- **WHEN** the owner chooses «Ще 60 секунд» after the first round
- **THEN** a second 60-second round begins with the alternate calm messages and fresh elapsed-time progress

#### Scenario: Personal reason supports an active craving
- **WHEN** the owner has saved a personal reason and opens concentration
- **THEN** the reason is visible throughout the timed flow and check-in without replacing the stage message

#### Scenario: Concentration without a personal reason
- **WHEN** the owner has not saved a reason and opens concentration
- **THEN** concentration works normally without an empty reason card or label

### Requirement: Optional trigger capture
After a concentration round, the application SHALL offer the existing optional trigger choices: stress, coffee, alcohol, after food, company, boredom, habit, and other. After a trigger is chosen it SHALL allow an optional intensity from 1 through 5 using five accessible buttons rather than a slider, followed by an optional coping-method choice from Chakra concentration, water, walk, changed activity, waited, talked with someone, other, and not easier yet. Every optional step SHALL provide an obvious «Пропустити» action. A saved event SHALL include its timestamp, trigger, active-period day, current rank when available, and nullable intensity and coping method.

#### Scenario: Complete all craving fields
- **WHEN** the owner selects a trigger, intensity 1–5, and coping method
- **THEN** one event is stored with all selected values and its active-journey context

#### Scenario: Skip intensity and coping
- **WHEN** the owner selects a trigger and skips both later prompts
- **THEN** one event is stored with nullable intensity and coping method

#### Scenario: Skip trigger capture
- **WHEN** the owner skips the trigger prompt
- **THEN** concentration remains complete and no craving event is required or recorded

#### Scenario: Reject invalid intensity
- **WHEN** a client submits an intensity below 1, above 5, or not an integer
- **THEN** the server rejects the request without storing an event

### Requirement: Non-medical trigger insight
The application SHALL derive at most one compact, descriptive Today insight only when at least five relevant recorded craving events exist. Supported patterns MAY describe the dominant trigger, the trigger most often associated with the highest recorded intensity, or the most frequently selected coping method. A tied or insufficient sample SHALL produce either a stable accurate description or no insight and SHALL NOT imply diagnosis, causation, relapse prediction, or instructions.

#### Scenario: Fewer than five events
- **WHEN** fewer than five relevant craving events are recorded
- **THEN** no personal insight is shown

#### Scenario: Dominant coffee trigger
- **WHEN** at least five relevant events exist and coffee is the unique most frequent trigger
- **THEN** the application can say that coffee appeared most often recently

#### Scenario: Repeated coffee events
- **WHEN** at least five relevant recorded events make coffee the unique most frequent trigger in the recent period
- **THEN** the application can say that coffee occurred most often recently

#### Scenario: Stable tie behavior
- **WHEN** leading trigger or coping counts are tied
- **THEN** the application either omits that insight or uses a deterministic non-misleading tie description

#### Scenario: Dominant coping method
- **WHEN** at least five relevant events include a uniquely most frequent coping method
- **THEN** the application can describe that method as most frequently selected during recorded moments

## ADDED Requirements

### Requirement: Backward-compatible craving records
Craving intensity and coping method SHALL be nullable additions. Legacy events without either field SHALL remain readable and count toward eligible trigger patterns, while calculations that require intensity or coping SHALL ignore missing values safely.

#### Scenario: Read a legacy craving row
- **WHEN** the database contains a pre-change craving event with only trigger and journey context
- **THEN** tracker loading and trigger insight calculation continue without migration loss or runtime error
