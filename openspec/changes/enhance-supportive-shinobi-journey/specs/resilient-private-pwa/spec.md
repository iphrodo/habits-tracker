## Purpose

Make the installed iPhone experience private on the Home Screen and resilient when Safari or the PWA moves between foreground, background, online, and failed-network states.

## ADDED Requirements

### Requirement: Private Home Screen identity
The web app manifest name and short name and the Apple mobile web app title SHALL be «Вільно». Home Screen metadata SHALL NOT contain wording equivalent to smoking, days without smoking, quit smoking, or smoke free. Internal branding such as «ВІЛЬНО · 忍道» MAY remain in the interface.

#### Scenario: Add the app to an iPhone Home Screen
- **WHEN** Safari reads the manifest and Apple application-title metadata
- **THEN** the installed application is labeled only «Вільно»

### Requirement: Bounded network requests
Client requests SHALL have a bounded timeout or abort behavior. A timeout or network failure SHALL enter a controlled error state and SHALL NOT leave the application loading indefinitely.

#### Scenario: Initial tracker request never responds
- **WHEN** the first tracker request exceeds its configured timeout
- **THEN** full-screen loading ends and a retryable error is shown

### Requirement: Non-blocking foreground refresh
Full-screen loading SHALL be reserved for the initial load when no usable tracker data exists. On `visibilitychange` to visible and on window `focus`, the application SHALL immediately recompute elapsed time, savings, and rank progress from the local clock, keep valid stale data visible, and refresh server state in the background. Failed background refresh SHALL retain the usable data and MAY show unobtrusive feedback.

#### Scenario: Return from background with cached state
- **WHEN** the app becomes visible after time has elapsed
- **THEN** time-derived values update immediately without a full-screen loader while server refresh continues

### Requirement: Foreground refresh deduplication
Nearly simultaneous focus, visibility, and online events SHALL share or deduplicate an in-flight tracker refresh so that they do not create uncontrolled concurrent requests. Event listeners SHALL be removed when the application unmounts.

#### Scenario: Focus follows visibility change
- **WHEN** visibility and focus events fire while one refresh is still pending
- **THEN** only one tracker refresh remains in flight and both events settle from that operation
