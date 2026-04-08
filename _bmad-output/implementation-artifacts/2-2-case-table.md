---
status: ready-for-dev
story_id: 2-2-case-table
epic_id: epic-2
priority: high
---

# Story 2.2: Case Table

As a lawyer,
I want to see all my cases in a table with filters,
So that I can find specific cases easily.

## Implementation Specification

### Tasks

1. Add case list display with columns
2. Add filter by tribunal (sigla)
3. Add filter by status
4. Add filter by date range
5. Add click to view details

### Acceptance Criteria

**Given** cases in the portfolio
**When** the case table loads
**Then** displays: CNJ number, Subject, Court, Status, Last check date
**And** filters work: by tribunal, by status, by date range