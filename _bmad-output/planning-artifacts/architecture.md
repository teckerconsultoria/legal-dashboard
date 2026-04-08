---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
inputDocuments:
  - name: _bmad-output/planning-artifacts/prd.md
    type: prd
workflowType: 'architecture'
project_name: 'teste-dev'
user_name: 'Lemos'
date: '2026-04-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Scope
- **Type:** Web Application (SaaS Dashboard)
- **Domain:** Legal Tech
- **Complexity:** Medium-High

### Key Architectural Implications
1. **Multi-tenant SaaS** - Each lawyer/law firm has their own OAB view
2. **External API Integration** - Escavador API v2 (Bearer token auth)
3. **Data Calculation** - Health metrics (staleness, active/inactive) computed from raw API data
4. **LGPD Compliance** - Data masking required for personal info
5. **Cost/Usage Tracking** - Admin needs visibility into API usage

### Technical Constraints
- Rate limit: 500 req/min (Escavador)
- Auth: Centralized API tokens managed by admin
- Caching: Needed for performance

### MVP Architecture
- OAB selector → Health Panel KPIs
- Case table with drill-down
- Case detail view
- Admin dashboard

---

## Starter Template

### Selected Stack: Next.js 16.2 (React)

**Rationale:**
- Full-stack capabilities with API routes
- Server-side rendering for initial load
- Built-in optimization for dashboards
- Large ecosystem

**Alternative Considered:**
- Vue.js - Good alternative but less ecosystem for dashboards
- React + Express - More setup, less integrated

---

## Core Architectural Decisions

### 1. Data Storage: Supabase v2.101
- PostgreSQL with built-in Auth
- Row Level Security (RLS) for multi-tenancy
- Cache table for API responses
- Audit log storage

### 2. Hosting: Vercel
- Optimized for Next.js
- Edge caching, automatic SSL
- Alternative: Railway, AWS

### 3. Authentication
- Supabase Auth (built-in)
- OAuth providers configurable
- Session management via JWT

### 4. API Integration
- Server-side calls to Escavador API
- Rate limiting: 500 req/min enforced
- Token management via admin dashboard

---

## Implementation Patterns

### Caching Strategy
- **Server-side:** In-memory cache with TTL (upstash/redis optional)
- **Client-side:** React Query for API responses
- **TTL:** 5 min default for health KPIs

### State Management
- **Server State:** React Query (TanStack Query)
- **Client State:** Zustand
- **No Redux needed**

### API Design
- Route Handlers in `/app/api/`
- Server components by default
- Client components only where needed

### Multi-tenancy
- RLS policies in Supabase
- User belongs to organization (law firm)
- All queries filtered by org_id

---

## Project Structure

```
/app
  /layout.tsx          # Root layout with auth
  /page.tsx           # Homepage (OAB selector)
  /(dashboard)
    /layout.tsx       # Dashboard layout
    /page.tsx         # Health panel
    /insights/page.tsx # Insights panel
    /cases/[id]/page.tsx # Case detail
    /admin/page.tsx   # Admin dashboard
  /api
    /escavador        # Escavador API proxy
    /health           # Health metrics
/components
  /ui                 # Reusable UI components
  /dashboard          # Dashboard-specific
/lib
  /supabase.ts       # Supabase client
  /escavador.ts      # Escavador API
  /metrics.ts        # Health calculations
/types
  /index.ts         # TypeScript types
```

### Key Boundaries
- **Server:** API calls to Escavador, metrics calculation
- **Client:** Rendering, user interaction
- **Shared:** Types, utilities

---

## Architecture Validation

### PRD Requirements Coverage
- ✅ OAB Selector → `/app/page.tsx`
- ✅ Health Panel → `/(dashboard)/page.tsx`
- ✅ Case Table → `/app/cases/`
- ✅ Case Detail → `/app/cases/[id]/`
- ✅ Admin Dashboard → `/app/admin/`
- ✅ Escavador API → `/app/api/escavador/`

### Technical Validation
- ✅ Multi-tenant: Supabase RLS
- ✅ Auth: Supabase Auth
- ✅ Caching: Server-side + React Query
- ✅ Rate limiting: 500 req/min
- ✅ LGPD: Data masking

### Edge Cases
- ✅ 401/402 errors: Clear error messages
- ✅ Rate limit hit: Queue with backoff
- ✅ Stale data: Show "last verified"

---

## Summary

| Component | Choice |
|-----------|-------|
| Framework | Next.js 16.2 |
| Database | Supabase |
| Hosting | Vercel |
| Auth | Supabase Auth |
| State | React Query + Zustand |
| Caching | Server-side TTL |