## Purpose

Present cautious, evidence-based recovery landmarks from the current smoke-free start without implying personalized medical measurement, guaranteed outcomes, or false precision.

## ADDED Requirements

### Requirement: WHO recovery milestone catalog
The application SHALL use the following discrete WHO-derived milestones without strengthening their claims: at 20 minutes heart rate and blood pressure decrease; at 12 hours blood carbon monoxide returns to normal; during 2–12 weeks circulation and lung function improve; during 1–9 months coughing and shortness of breath decrease; at 1 year coronary heart disease risk is approximately half that of a person who continues smoking; during 5–15 years stroke risk gradually falls to that of a person who does not smoke; at 10 years lung cancer risk is approximately half that of a person who continues smoking; and at 15 years coronary heart disease risk becomes approximately that of a person who does not smoke. The application MUST NOT express recovery as an organ, oxygen, circulation, detoxification, or overall-health percentage and MUST NOT claim guaranteed, complete, or personalized recovery.

#### Scenario: One month on the current journey
- **WHEN** the active smoke-free period has elapsed for one month
- **THEN** the timeline represents applicable point and range milestones with discrete textual states and shows no health-recovery percentage

#### Scenario: Fifteen-year journey
- **WHEN** the active smoke-free period has elapsed for at least 15 years
- **THEN** every catalog milestone is shown as completed and the application makes no stronger claim than the catalog wording

### Requirement: Recovery state calculation uses the active journey
The application SHALL calculate recovery state exclusively from the active attempt's `startedAt` and current time. Point milestones SHALL be future before their threshold and completed at or after it; range milestones SHALL be future before their lower bound, current from the lower bound until the upper bound, and completed at or after the upper bound. Starting a new journey SHALL restart only the current recovery calculation and SHALL preserve prior attempt history without storing historical health percentages.

#### Scenario: Exact early boundaries
- **WHEN** elapsed time changes from 19 to 20 minutes and from 11 hours 59 minutes to 12 hours
- **THEN** the corresponding point milestone changes from future to completed exactly at its threshold

#### Scenario: Enter and finish a range
- **WHEN** elapsed time reaches 2 weeks and later reaches 12 weeks
- **THEN** the 2–12 week milestone changes from future to current and then to completed without an interpolated percentage

#### Scenario: Begin a new journey after history exists
- **WHEN** a previous attempt is closed and a new active attempt starts
- **THEN** recovery timing begins at the new timestamp while the completed attempt remains unchanged in history

### Requirement: Compact and expandable recovery presentation
Today SHALL show one compact «Відновлення» disclosure containing the latest completed landmark when one exists and either the most recently started current range or nearest future landmark. A future point MAY show cautious approximate time wording such as «приблизно через…», but SHALL NOT use a hard medical «залишилось» countdown. Activating the disclosure SHALL reveal an inline view or bottom sheet with the full timeline and SHALL NOT create another primary navigation tab.

#### Scenario: Thirteen hours elapsed
- **WHEN** the current journey has elapsed for 13 hours
- **THEN** the compact card identifies the 12-hour landmark as completed and the 2–12 week period as the next orientation

#### Scenario: Expand the card
- **WHEN** the owner activates «Відновлення»
- **THEN** all milestones become available in the current view or an accessible bottom sheet without changing the three-tab navigation

### Requirement: Recovery timeline states and source
The expanded recovery view SHALL pair every milestone with its duration, cautious short description, and visible textual state equivalent to «Пройдений орієнтир», «Поточний період» or «Наступний орієнтир»/«Попереду» so state is not conveyed by color alone. It SHALL include the quiet disclaimer «Орієнтовні зміни організму після припинення куріння. Індивідуальний перебіг може відрізнятися.» and a «Джерело: ВООЗ» link to `https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation`.

#### Scenario: Review recovery without color perception
- **WHEN** the owner expands the recovery timeline
- **THEN** every state is understandable from its marker and text and the official WHO source and disclaimer are available

