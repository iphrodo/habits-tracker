## MODIFIED Requirements

### Requirement: Backward-compatible server persistence
Settings, craving events, and attempt economics SHALL use the existing server-backed no-account storage architecture. Schema changes SHALL be additive and idempotent; legacy attempts and craving events missing optional intensity or coping-method fields SHALL remain readable with safe nullable values. Migration and application startup SHALL NOT delete history, replace the active start date, create a new active attempt without an explicit owner action, or fabricate historical recovery measurements. A new journey SHALL retain previous attempts and craving events while recovery calculations use only the new active start timestamp.

#### Scenario: Open an existing pre-enhancement database
- **WHEN** the application initializes against legacy attempt and craving rows without the new optional fields
- **THEN** migration preserves all rows and the active start date, exposes nullable craving fields, supplies safe economic defaults, and does not create or remove an attempt

#### Scenario: Start a new journey
- **WHEN** the owner records a new cigarette and starts another active period
- **THEN** previous history and craving records remain stored while current recovery timing starts from the new active period

