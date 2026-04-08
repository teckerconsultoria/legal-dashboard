---
status: done
story_id: 1-3-oab-selector
epic_id: epic-1
priority: high
---

# Story 1.3: OAB Selector

As a lawyer,
I want to select my OAB (state + number),
So that I can view my case portfolio.

## Implementation Specification

### Tasks

1. Add React Query provider
2. Create API route for Escavador proxy
3. Connect OAB selector to health metrics fetch
4. Display health KPIs

### Acceptance Criteria

**Given** a logged-in user
**When** they select OAB state from dropdown and enter OAB number
**Then** they see the Health Panel with KPIs
**And** KPIs load within 3 seconds