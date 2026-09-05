## Purpose

Keep the personal tracker usable with touch, keyboard, assistive technology, reduced motion, and narrow iPhone layouts without changing its calm visual identity.

## ADDED Requirements

### Requirement: Comfortable and semantic controls
Important interactive controls SHALL use semantic buttons or labeled form controls and SHALL expose an approximately 44 by 44 CSS pixel hit area. Compact chips MAY retain their visual shape, but their clickable area SHALL remain comfortable. Icon-only or otherwise ambiguous controls SHALL have an accessible name, and selected navigation or chip state SHALL be programmatically exposed.

#### Scenario: Operate the interface without precise pointing
- **WHEN** the owner uses navigation, chips, edit, update, or delete actions on a touch device or by keyboard
- **THEN** each action has a comfortable hit area, a visible keyboard focus indicator, and an accessible name and state

### Requirement: Managed modal focus
An opened dialog or bottom sheet SHALL receive focus, keep sequential keyboard focus inside the overlay, close with Escape where dismissal is available, and return focus to the control that opened it. Dialog titles and errors SHALL be associated with their overlay or form.

#### Scenario: Open and close the start-date editor
- **WHEN** the owner opens the editor with a keyboard and then dismisses it
- **THEN** focus moves into the editor while open and returns to the edit trigger after dismissal

### Requirement: Rank status is not color-only
Every rank card SHALL expose a visible and screen-reader-readable Ukrainian status equivalent to «Пройдений», «Поточний», or «Майбутній». Color MAY reinforce the status but SHALL NOT be its only indication.

#### Scenario: Review ranks without color perception
- **WHEN** the owner reviews the rank list
- **THEN** the state of every rank is understandable from text and semantics alone

### Requirement: Reduced motion
When the device requests `prefers-reduced-motion: reduce`, decorative animation and non-essential transitions SHALL be removed or reduced to an effectively immediate change.

#### Scenario: Reduced-motion preference is enabled
- **WHEN** the interface displays character progress, chakra, loading, or other animated states
- **THEN** decorative movement does not continue and the content remains fully usable

### Requirement: Mobile edge-case resilience
The Today, ranks, settings, Chakra, history, navigation, and dialogs SHALL remain usable on a small iPhone viewport and with safe-area insets, long Ukrainian text, a 280-character personal reason, and formatted values of at least €1,000 and €10,000. Content SHALL scroll vertically without being hidden by the bottom navigation.

#### Scenario: Long content on a narrow iPhone
- **WHEN** the owner opens settings and a dialog on a 320 CSS pixel-wide viewport with a long reason and a five-digit saving
- **THEN** text wraps, controls remain reachable, safe areas are respected, and no essential content is clipped behind navigation
