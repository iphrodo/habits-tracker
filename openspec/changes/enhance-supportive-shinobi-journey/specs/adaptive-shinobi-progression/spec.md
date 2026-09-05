## Purpose

Use the Naruto-inspired rank metaphor as a quiet marker of a changing smoke-free life rather than a punitive game streak.

## ADDED Requirements

### Requirement: Gradual rank cadence
The application SHALL use these rank milestones: Академія at start, Генін at 1 day, Команда шинобі at 3, Чунін at 7, Токубецу джонін at 14, Джонін at 30, АНБУ at 60, Саннін at 90, Каге at 180, a thematic rank at 270, and Легенда Листа at 365. Rank cards SHALL retain Japanese decoration, Ukrainian name, day, and short original supporting text.

#### Scenario: Mid-year progression
- **WHEN** the active period reaches 270 completed days
- **THEN** it receives the thematic 270-day rank before «Легенда Листа» at 365 days

### Requirement: Post-year continuity
After 365 full days the active timer SHALL continue to show exact elapsed time and «Легенда Листа» as the maximum rank. It SHALL not add endless ranks or present the year as the end of the application.

#### Scenario: Four hundred and eight days
- **WHEN** an active period has elapsed for 408 days
- **THEN** the maximum rank remains «Легенда Листа» and the timer still shows 408 days
