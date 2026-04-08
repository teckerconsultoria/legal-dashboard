---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
  - complete
inputDocuments:
  - name: _bmad-output/planning-artifacts/prd.md
    type: prd
  - name: _bmad-output/planning-artifacts/architecture.md
    type: architecture
---

# Legal Dashboard Homepage - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Legal Dashboard Homepage, decomposing the requirements from the PRD, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: OAB Selector - Select state + number to identify lawyer
FR2: Health Panel - View KPIs: total processes, staleness %, active/inactive
FR3: Case Table - List all cases with filtering (by tribunal, status, date)
FR4: Case Detail - View capa, movements, status of individual case
FR5: Admin Dashboard - Monitor API usage per user/team
FR6: User Authentication - Login with email/password or OAuth

### NonFunctional Requirements

NFR1: Page Load - Health KPIs visible within 3 seconds
NFR2: Rate Limiting - Max 500 req/min (client-side enforcement)
NFR3: Uptime - 99.5% availability
NFR4: Error Handling - Clear error messages for 401/402/404/422
NFR5: LGPD Compliance - Data masking for personal information
NFR6: Audit Logs - All queries and actions logged
NFR7: Caching - Server-side TTL (5 min default)

### Additional Requirements

- Next.js 16.2 framework with API routes
- Supabase v2.101 for database and auth
- Vercel hosting
- Multi-tenant with RLS policies
- Server-side cache with TTL

### UX Design Requirements

(No UX document available - using PRD requirements)

### FR Coverage Map

| FR | Epic |
|---|------|
| FR1, FR2 | Epic 1: Infrastructure & Core |
| FR3, FR4 | Epic 2: Case Management |
| FR5 | Epic 3: Admin & Monitoring |
| FR6 | Epic 1: Infrastructure & Core |

## Epic List

Epic 1: Infrastructure & Core
Epic 2: Case Management
Epic 3: Admin & Monitoring

---

## Epic 1: Infrastructure & Core

**Epic Goal:** Set up the foundational infrastructure including project setup, authentication, and OAB selector.

### Story 1.1: Project Setup

As a developer,
I want a Next.js 16.2 project with Supabase integration,
So that I can build the dashboard features.

**Acceptance Criteria:**

**Given** a clean development environment
**When** I run the scaffold command with Next.js + Supabase
**Then** the project builds successfully with no errors
**And** TypeScript compiles without errors
**And** All dependencies install without conflicts

### Story 1.2: Authentication

As a user,
I want to log in with email/password,
So that I can access my dashboard securely.

**Acceptance Criteria:**

**Given** a user with valid credentials
**When** they log in with email and password
**Then** they are redirected to the dashboard
**And** their session persists across page refreshes

**Given** a user with invalid credentials
**When** they attempt to log in
**Then** they see an error message "Invalid credentials"

### Story 1.3: OAB Selector

As a lawyer,
I want to select my OAB (state + number),
So that I can view my case portfolio.

**Acceptance Criteria:**

**Given** a logged-in user
**When** they select OAB state from dropdown and enter OAB number
**Then** they see the Health Panel with KPIs
**And** KPIs load within 3 seconds

---

## Epic 2: Case Management

**Epic Goal:** Implement case listing and detail views.

### Story 2.1: Health Panel

As a lawyer,
I want to see my portfolio health metrics,
So that I know which cases need attention.

**Acceptance Criteria:**

**Given** a valid OAB selection
**When** the Health Panel loads
**Then** it displays: Total processes count, Staleness %, Active/Inactive ratio
**And** all metrics show "last verified" date

### Story 2.2: Case Table

As a lawyer,
I want to see all my cases in a table with filters,
So that I can find specific cases easily.

**Acceptance Criteria:**

**Given** cases in the portfolio
**When** the case table loads
**Then** it displays: CNJ number, Subject, Court, Status, Last check date
**And** filters work: by tribunal, by status, by date range

### Story 2.3: Case Detail

As a lawyer,
I want to view detailed information about a case,
So that I can see movements and current status.

**Acceptance Criteria:**

**Given** cases in the table
**When** I click on a case row
**Then** a detail drawer opens showing: Case header (CNJ, subject), Status, Movements timeline
**And** data is masked according to LGPD if showing personal info

---

## Epic 3: Admin & Monitoring

**Epic Goal:** Implement admin dashboard for API usage monitoring.

### Story 3.1: Admin Dashboard

As an admin,
I want to see API usage by user/team,
So that I can manage costs and rate limits.

**Acceptance Criteria:**

**Given** an admin user
**When** they navigate to admin dashboard
**Then** they see: Credit usage today, per-user usage, rate limit status
**And** they can configure sample sizes and rate limits

### Story 3.2: Audit Logs

As an admin,
I want to see who accessed what data,
So that I can comply with LGPD requirements.

**Acceptance Criteria:**

**Given** user queries
**When** queries are executed
**Then** they are logged with: user_id, timestamp, OAB queried, result count
**And** logs are queryable by admin