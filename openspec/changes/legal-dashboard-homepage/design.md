## Context

The legal dashboard homepage is a net-new feature that provides law firms and attorneys with a unified view of their case portfolio through two lenses: data health (quality metrics) and strategic insights (analytics). The primary entry point is an OAB selector, which gates access to the dashboard.

Current constraints:
- Escavador API v2 has a rate limit of 500 requests/minute
- API calls consume credits (tracked via `Creditos-Utilizados` header)
- Update operations are asynchronous (PENDENTE → SUCESSO/ERRO/NAO_ENCONTRADO)
- No existing backend for legal data - this is a greenfield integration
- LGPD compliance required for displaying party names

## Goals / Non-Goals

**Goals:**
- Create a functional homepage with OAB selector as the entry point
- Implement Data Health panel with staleness, completeness, and active/inactive metrics
- Implement Strategic Insights panel with distribution and trend analysis
- Enable drill-down to individual process details
- Support async update workflow with job status tracking
- Handle rate limiting and sampling gracefully

**Non-Goals:**
- Mobile-first design (focus on desktop dashboard first)
- Real-time WebSocket updates (polling is acceptable for MVP)
- Multi-OAB management in single view (one OAB at a time)
- Automated data sync jobs (manual trigger for MVP)
- OAuth integration with OAB system (direct input for MVP)

## Decisions

### 1. Architecture Pattern: Backend-for-Frontend (BFF)

**Decision**: Implement a thin BFF layer between the frontend and Escavador API.

**Rationale**:
- Hides API credentials from client-side
- Enables caching and aggregation of metrics
- Allows rate limiting and retry logic server-side
- Supports future caching layer without frontend changes

**Alternatives considered**:
- Direct frontend-to-API: Rejected due to credential exposure and limited caching
- Full separate backend service: Overkill for MVP - BFF provides sufficient abstraction

### 2. State Management: Client-side with Server Cache

**Decision**: Use client-side state (React Query / SWR) with server-side Redis cache for process data.

**Rationale**:
- Escavador data is relatively static (changes on update)
- Cache reduces API calls and costs
- Client state handles UI state (filters, selected tab)
- Server cache stores recent OAB queries and process data

### 3. Sampling Strategy: Two-Tier

**Decision**: Implement "Quick View" (first 100 processes) vs "Full Analysis" (paginated crawl).

**Rationale**:
- Quick View enables fast prototype feedback
- Full Analysis provides accurate metrics but costs more
- Clear UI indication of sample size used
- User makes informed trade-off

**Thresholds**:
- Quick View: 1-3 pages (up to 300 processes)
- Full Analysis: All pages (with progress indicator)

### 4. Async Update Flow: Polling-based

**Decision**: Use polling with exponential backoff for job status updates (instead of webhooks).

**Rationale**:
- Simpler to implement than callback endpoint
- Works behind firewalls/NAT without configuration
- Escavador supports callbacks but requires token validation setup
- Polling frequency: 2s (0-3 attempts), 5s (4-6), 10s (7+)

**Alternatives considered**:
- Webhooks: Requires public endpoint, token validation - deferred to v2

### 5. LGPD Handling: Role-Based Masking

**Decision**: Implement role-based display with three tiers.

**Rationale**:
- Legal case data is public, but party names are personal data
- Aggregate views can use initials/masking
- Detail views for authorized roles only
- Audit log for all reveal actions

**Tiers**:
- Viewer: Masked names (J*** S****), no CPF/CNPJ
- Analyst: Full names in detail, masked in aggregates
- Admin: Full access, audit trail

## Risks / Trade-offs

| Risk | Mitigation |
|------|-------------|
| API rate limit (500/min) exceeded | Client-side token bucket, queue requests, show warning |
| High API costs (per-request) | Aggressive caching, sampling default, credit tracking UI |
| Job status stuck in PENDENTE | Timeout after 5 minutes, manual retry option |
| IA classification (ATIVO/INATIVO) wrong | Show confidence indicator, allow manual override |
| Stale data returned after update request | Re-fetch with cache-bust after SUCESSO status |
| CNJ format validation errors | Client-side validation before API call |

## Migration Plan

1. **Phase 1 - Skeleton**: OAB selector + basic process list (no metrics)
2. **Phase 2 - Health Panel**: Add staleness, completeness KPIs
3. **Phase 3 - Insights Panel**: Add distribution and time series
4. **Phase 4 - Detail View**: Add process detail with async update
5. **Phase 5 - Polish**: LGPD masking, filters, sampling toggle

Rollback: Each phase is independently deployable. Revert to previous phase tag if issues.

## Open Questions

1. **Authentication**: Will there be user accounts, or is this an internal tool with shared credentials?
2. **Multi-OAB**: Should the homepage support saving multiple OABs for quick switch?
3. **Callback endpoint**: Is there infrastructure for webhook URLs, or defer to polling?
4. **Persistence**: Does OAB history persist (localStorage vs. backend)?
