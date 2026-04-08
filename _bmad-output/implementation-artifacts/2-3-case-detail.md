---
status: ready-for-dev
story_id: 2-3-case-detail
epic_id: epic-2
priority: high
---

# Story 2.3: Case Detail

As a lawyer,
I want to view detailed information about a case,
So that I can see movements and current status.

## Implementation Specification

### Tasks

1. Create case detail API route
2. Add drawer/modal for case details
3. Display movements timeline
4. Add LGPD masking

### Acceptance Criteria

**Given** cases in the table
**When** I click on a case row
**Then** a detail drawer opens showing: Case header (CNJ, subject), Status, Movements timeline
**And** data is masked according to LGPD