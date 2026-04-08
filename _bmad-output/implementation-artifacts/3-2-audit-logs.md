---
status: ready-for-dev
story_id: 3-2-audit-logs
epic_id: epic-3
priority: medium
---

# Story 3.2: Audit Logs

As an admin,
I want to see who accessed what data,
So that I can comply with LGPD requirements.

## Implementation Specification

### Tasks

1. Create audit logs API route
2. Display logs in admin page
3. Show user_id, timestamp, OAB queried
4. Add filtering

### Acceptance Criteria

**Given** user queries
**When** queries are executed
**Then** they are logged with: user_id, timestamp, OAB queried, result count
**And** logs are queryable by admin