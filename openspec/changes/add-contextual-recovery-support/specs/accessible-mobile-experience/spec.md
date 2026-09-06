## ADDED Requirements

### Requirement: Accessible supportive disclosures and choices
The Recovery disclosure and expanded timeline, five intensity choices, coping chips, wisdom accordion, and Chakra progress SHALL use semantic controls or progress semantics, visible keyboard focus, programmatic names and state, and approximately 44 by 44 CSS pixel touch targets where interactive. Recovery state SHALL remain textual, Chakra progress SHALL have an accessible label or value, and icon-only disclosure marks SHALL not be the sole accessible name.

#### Scenario: Complete support flows by keyboard
- **WHEN** the owner navigates Recovery, wisdom, intensity, coping, and Chakra controls by keyboard or assistive technology
- **THEN** controls are reachable, named, visibly focused, and expose selected, expanded, timeline, or progress state as appropriate

### Requirement: Compact Today hierarchy on narrow iPhone screens
The added Recovery, practice, and optional insight content SHALL remain compact or collapsed by default so a 320 CSS pixel-wide Today screen remains vertically usable and no essential text or action is clipped, overlaps the bottom navigation, or causes horizontal scrolling. Recovery SHALL expand in place or in a managed bottom sheet rather than occupying a permanent full timeline on Today.

#### Scenario: Today at 320 CSS pixels
- **WHEN** Today is viewed on a 320 CSS pixel-wide iPhone viewport with Recovery, wisdom, practice, and one insight available
- **THEN** the page has no horizontal overflow, the default cards remain scannable, and all content can be reached by vertical scrolling above the safe-area navigation

