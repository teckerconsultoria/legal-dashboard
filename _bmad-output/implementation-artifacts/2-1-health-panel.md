---
status: ready-for-dev
story_id: 2-1-health-panel
epic_id: epic-2
priority: high
---

# Story 2.1: Health Panel KPIs

As a lawyer,
I want to see my portfolio health metrics,
So that I know which cases need attention.

## Implementation Specification

### Tasks

1. Create API route for processes list with status
2. Calculate staleness % from process data
3. Calculate active/inactive ratio
4. Display health metrics cards

### Acceptance Criteria

**Given** a valid OAB selection
**When** the Health Panel loads
**Then** displays: Total processes, Staleness %, Active/Inactive ratio
**And** all metrics show "last verified" date