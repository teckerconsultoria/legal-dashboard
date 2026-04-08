---
status: done
story_id: 1-2-authentication
epic_id: epic-1
priority: high
---

# Story 1.2: Authentication

As a user,
I want to log in with email/password,
So that I can access my dashboard securely.

## Implementation Specification

### Stack
- **Auth:** Supabase Auth
- **Provider:** Email/Password

### Tasks

1. Set up Supabase Auth middleware
2. Create login page at `/login`
3. Create protected route wrapper
4. Update layout with auth state
5. Add logout functionality

### Acceptance Criteria

**Given** a user with valid credentials
**When** they log in with email and password
**Then** they are redirected to dashboard
**And** their session persists across page refreshes

**Given** a user with invalid credentials
**When** they attempt to log in
**Then** they see an error message "Invalid credentials"