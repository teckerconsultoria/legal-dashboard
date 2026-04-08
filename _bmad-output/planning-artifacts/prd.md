---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation (skipped - incremental product)
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - name: docs/deep-research-report.md
    type: research
workflowType: 'prd'
classification:
  projectType: Web Application (SaaS Dashboard)
  domain: Legal Tech
  complexity: Medium-High
  projectContext: greenfield
vision:
  summary: A dashboard that transforms Escavador API data into actionable portfolio health metrics and strategic insights for Brazilian lawyers
  differentiator: Health and Insights panels with calculated metrics that raw API doesn't provide (staleness, active/inactive, update queue)
  coreInsight: Lawyers need automated, portfolio-level visibility into case health/status
---

# Product Requirements Document - Legal Dashboard Homepage

**Author:** Lemos
**Date:** 2026-04-08

---

## Project Classification

- **Project Type:** Web Application (SaaS Dashboard)
- **Domain:** Legal Tech
- **Complexity:** Medium-High (LGPD compliance, court integrations)
- **Project Context:** Greenfield (new product)

---

## Product Vision

**Vision:** A dashboard that transforms Escavador API data into actionable portfolio health metrics and strategic insights for Brazilian lawyers.

**What Makes It Special:**
- **Health Panel:** "Quão confiável, completa, consistente e atual está a carteira de processos?"
- **Insights Panel:** "O que dá para aprender com essa carteira?"
- Calculates data health metrics (staleness, active/inactive status, update queue) that the raw API doesn't provide directly

**Core Insight:** Lawyers need automated, portfolio-level visibility into case health/status - a monitoring/dashboard layer on top of Escavador API.

---

## Executive Summary

**Vision:** Provide Brazilian lawyers with a dashboard that transforms Escavador API data into actionable portfolio health metrics and strategic insights.

**Problem:** Lawyers need automated, portfolio-level visibility into case health/status that the raw API doesn't provide. They must manually check each case to know which are active, stale, or need updating.

**Solution:** A SaaS dashboard with:
- **Health Panel:** "Quão confiável, completa, consistente e atual está a carteira de processos?"
- **Insights Panel:** "O que dá para aprender com essa carteira?"

**Target Users:** Brazilian lawyers and law firms who need portfolio-level monitoring.

**Value Proposition:** Transforms raw API data into calculated health metrics (staleness, active/inactive, update queue) that no other tool provides.

---

### What Makes This Special

1. **Data Health Metrics:** Calculates staleness (% processes with outdated verification), active/inactive status classification, and update queue tracking
2. **Portfolio-Level View:** Aggregates metrics across entire OAB portfolio, not just individual cases
3. **Actionable Insights:** Identifies "hot" vs "cold" cases, distribution by court/topic, trend analysis beyond raw data
4. **Update Management:** Async update requests with status tracking

---

## Success Criteria

### User Success
- User selects OAB and sees portfolio health metrics within 3 seconds
- User can identify stale cases (outdated verification) at a glance
- User can distinguish active vs inactive cases
- User can drill into any case for full details

### Business Success
- 3-month: Beta launch with [X] active users
- 12-month: Product-market fit validated

### Technical Success
- Page load time < 3 seconds for health metrics
- 99.5% uptime
- LGPD compliance (data masking, consent)

### Measurable Outcomes
- [X]% of users can identify stale cases within 30 seconds
- [X] NPS score at launch

---

## Product Scope

### MVP - Minimum Viable Product
- OAB selector (state + number)
- Health Panel with KPIs (total, staleness %, active/inactive)
- Case list table with basic drill-down
- Case detail view (capa, movements, status)

### Post-MVP (Growth)
- Request update action (async)
- Insights Panel with trends and distributions
- Advanced filters
- Export capabilities

### Vision (Future)
- Multi-OAB support
- Real-time alerts
- API for integrations
- Custom dashboards

---

## Non-Functional Requirements

### Performance
- **Page Load:** Health KPIs visible within 3 seconds
- **API Calls:** Max 500 req/min (client-side rate limiting)
- **Caching:** Cache recent queries for faster reload

### Reliability
- **Uptime:** 99.5% availability
- **Error Handling:** Graceful degradation with clear error messages
- **Data Consistency:** Show "last verified" for all metrics

### Security
- **Authentication:** Secure login with centralized API tokens
- **Data Masking:** LGPD-compliant masking of personal data
- **Audit Logs:** All queries and actions logged

### Usability
- **Accessibility:** Basic WCAG compliance
- **Responsive:** Works on desktop (primary) and tablet
- **Loading States:** Clear loading indicators during API calls

---

## User Journeys

### Journey 1: Primary User - Lawyer Search by OAB

**Opening Scene:**
Maria, a lawyer at a mid-sized firm in São Paulo, needs to check her case portfolio. She's been manually checking cases in Escavador and losing track of which ones need attention.

**Rising Action:**
1. Opens dashboard → enters OAB (SP + 123456) + selects "ADVOGADO"
2. Homepage loads → Health Panel shows: "156 processes | 35% stale | 89% active"
3. Clicks "Health Panel" tab → views staleness distribution chart
4. Clicks "Most Critical Cases" table → sees 12 stale cases
5. Clicks a case → Detail drawer opens with: Case header (CNJ, subject, court), Status (INATIVO), Last check (47 days ago), Movements timeline
6. Clicks "Request Update" → confirms → sees "Update queued"

**Climax:**
Sees the 35% staleness figure and immediately knows which cases need attention - something she couldn't see before.

**Resolution:**
"I finally have visibility into my entire portfolio. I know exactly which cases are stale and need updating."

---

### Journey 2: Secondary User - Admin

**Opening Scene:**
Carlos manages the firm's Escavador API subscription and needs to control costs.

**Rising Action:**
1. Logs in as Admin
2. Views dashboard → sees credit usage today
3. Views list of users and their OAB queries
4. Sees "User X used 450 credits today" (near limit)
5. Can configure sample sizes, rate limits
6. Views audit log

**Resolution:**
"I can manage and monitor API usage across the team."

---

### Journey Requirements Summary

- OAB selector with state + number + type inputs
- Health Panel with calculated KPIs
- Case table with filtering and drill-down
- Case detail drawer (capa, movements, status)
- Request update action (async)
- Admin dashboard for usage monitoring
- User management and audit logs

---

## Domain-Specific Requirements

### Compliance & Regulatory
- **LGPD Compliance:** Data masking for personal information (CPF/CNPJ), consent management, data retention policies
- **Court Records:** CNJ formatting standards, access to public judicial data
- **Audit Trail:** All API queries and data accesses logged

### Technical Constraints
- **Authentication:** Bearer token for Escavador API
- **Rate Limiting:** Max 500 requests/minute (enforce client-side)
- **Cost Management:** Track credit usage per user/request

### Integration Requirements
- **Escavador API v2:** OAB summary, process list, case details, movements, status, update requests
- **Authentication Flow:** User provides their own Escavador token (B2B model)

### Risk Mitigations
- **Data Accuracy:** Show "based on sample" when using sampling
- **Staleness Transparency:** Display last verification date for all metrics
- **Error Handling:** Clear messages for 401/402/404/422 API errors

---

## Project Type Requirements

### Architecture
- **Type:** Multi-tenant SaaS Web Application
- **Frontend:** SPA (React/Vue) for interactive dashboard
- **Backend:** API layer for Escavador integration

### Authentication & Authorization
- **User Auth:** Login/password or OAuth
- **API Management:** Admin manages Escavador tokens centrally
- **User Access:** Users just log in, API calls use centralized tokens

### Data & Caching
- **User Data:** User profiles, preferences
- **Query Cache:** Recent API responses for performance
- **Audit Logs:** All queries and actions logged

### API Integration
- **Escavador Token:** Managed centrally by admin
- **Rate Limiting:** Client-side enforcement (500 req/min)
- **Cost Tracking:** Per-user/team usage monitoring

---

## Functional Requirements Summary

### Core Features
1. **OAB Selector** - Select state + number to identify lawyer
2. **Health Panel** - View KPIs: total processes, staleness %, active/inactive
3. **Case Table** - List all cases with filtering
4. **Case Detail** - View capa, movements, status
5. **Admin Dashboard** - Monitor API usage

### API Integration
- `GET /advogado/resumo` - OAB summary
- `GET /advogado/processos` - Process list
- `GET /processos/numero_cnj/{id}` - Case details
- `GET /processos/numero_cnj/{id}/movimentacoes` - Movements
- `GET /processos/numero_cnj/{id}/status-atualizacao` - Update status