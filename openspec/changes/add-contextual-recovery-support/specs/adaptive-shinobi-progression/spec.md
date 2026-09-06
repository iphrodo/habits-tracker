## ADDED Requirements

### Requirement: Soft rank-relative character reveal
Today SHALL render two precisely aligned versions of the current rank character: a fully visible muted base layer at low visual emphasis and a full-color layer revealed from bottom to top in proportion to progress from the current rank threshold to the next rank threshold. The boundary between layers SHALL use a soft feather approximately 30–60 CSS pixels at the rendered character size rather than a hard horizontal clip. The character SHALL NOT display percentage text over the artwork.

#### Scenario: Thirty-two percent through a rank
- **WHEN** rank-relative progress is 32 percent
- **THEN** approximately the lower 32 percent of the character is full color, the remainder stays visibly muted, and a soft blend connects the two regions

#### Scenario: Enter the next rank
- **WHEN** the next rank threshold is reached
- **THEN** the newly selected rank character begins its own reveal cycle from its rank threshold while the separate rank progress indicator reflects the new interval

#### Scenario: Final rank continuity
- **WHEN** the journey is at or beyond the final rank
- **THEN** the final character remains fully colored and the elapsed timer continues

