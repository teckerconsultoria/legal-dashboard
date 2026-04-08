---
status: ready-for-dev
story_id: 3-1-admin-dashboard
epic_id: epic-3
priority: medium
---

# Story 3.1: Admin Dashboard

As an admin,
I want to see API usage by user/team,
So that I can manage costs and rate limits.

## Implementation Specification

### Tasks

1. Create admin page at `/admin`
2. Show credit usage today
3. Show per-user usage
4. Show rate limit status
5. Add configuration controls

### Acceptance Criteria

**Given** an admin user
**When** they navigate to admin dashboard
**Then** they see: Credit usage today, per-user usage, rate limit status
**And** they can configure sample sizes and rate limits