## 1. Project Setup

- [ ] 1.1 Initialize frontend project (React/Next.js if not existing)
- [ ] 1.2 Set up project structure (components, hooks, services, types)
- [ ] 1.3 Install dependencies (axios, react-query, chart library)
- [ ] 1.4 Configure ESLint and TypeScript
- [ ] 1.5 Set up environment variables (.env for API token)

## 2. OAB Selector Component

- [ ] 2.1 Create OAB input component with UF + número + tipo fields
- [ ] 2.2 Implement client-side validation (UF required, number format)
- [ ] 2.3 Add OAB history persistence (localStorage)
- [ ] 2.4 Create OAB autocomplete dropdown from history
- [ ] 2.5 Add "Clear history" functionality

## 3. API Integration Layer

- [ ] 3.1 Create Escavador API client service
- [ ] 3.2 Implement authentication (Bearer token header)
- [ ] 3.3 Add rate limiting (token bucket, 500 req/min)
- [ ] 3.4 Implement credit tracking from response headers
- [ ] 3.5 Add error handling (401, 402, 422, 404)

## 4. Data Health Panel

- [ ] 4.1 Implement /advogado/resumo endpoint integration
- [ ] 4.2 Create KPI card component (process count)
- [ ] 4.3 Implement staleness calculation from data_ultima_verificacao
- [ ] 4.4 Create staleness distribution chart (7d/8-30d/>30d)
- [ ] 4.5 Implement active/inactive ratio from status_predito
- [ ] 4.6 Add warning banner for >30% stale processes
- [ ] 4.7 Create update queue status display
- [ ] 4.8 Build critical processes table

## 5. Insights Panel

- [ ] 5.1 Implement /advogado/processos paginated fetch
- [ ] 5.2 Create time series chart for movements
- [ ] 5.3 Build tribunal distribution visualization
- [ ] 5.4 Build grau distribution (1º/2º Grau)
- [ ] 5.5 Implement top themes from process subjects
- [ ] 5.6 Build "hot vs cold" portfolio rhythm calculation
- [ ] 5.7 Implement top counterparties with masking

## 6. Process Detail View

- [ ] 6.1 Create process detail route/page
- [ ] 6.2 Implement /processos/numero_cnj/{cnj} fetch
- [ ] 6.3 Display capa information (CNJ, classe, subject, vara, forum)
- [ ] 6.4 Build movimentações timeline component
- [ ] 6.5 Display involved parties with roles
- [ ] 6.6 List public documents
- [ ] 6.7 Add CNJ copy to clipboard

## 7. Async Update Flow

- [ ] 7.1 Implement /solicitar-atualizacao POST endpoint
- [ ] 7.2 Create job status polling with exponential backoff
- [ ] 7.3 Add timeout handling (5 min max)
- [ ] 7.4 Implement callback webhook endpoint (optional v2)
- [ ] 7.5 Add retry functionality for failed updates
- [ ] 7.6 Implement cache invalidation after success
- [ ] 7.7 Add "include documents" toggle

## 8. Filtering & Sampling

- [ ] 8.1 Add tribunal filter (multi-select)
- [ ] 8.2 Add status filter (ATIVO/INATIVO)
- [ ] 8.3 Add date range filter (data_minima, data_maxima)
- [ ] 8.4 Implement sampling toggle (Quick View / Full Analysis)
- [ ] 8.5 Add "Based on sample N" indicator
- [ ] 8.6 Implement full pagination for Full Analysis mode

## 9. LGPD & Permissions

- [ ] 9.1 Create role-based access control (Viewer/Analyst/Admin)
- [ ] 9.2 Implement name masking for Viewer role
- [ ] 9.3 Add reveal-on-demand with audit logging
- [ ] 9.4 Mask CPF/CNPJ in all views
- [ ] 9.5 Add consent/explainability for IA classification

## 10. UI Polish

- [ ] 10.1 Add loading states (skeleton/spinner)
- [ ] 10.2 Add empty states (no processes, no OAB entered)
- [ ] 10.3 Add error states (API errors, network failures)
- [ ] 10.4 Implement responsive layout
- [ ] 10.5 Add tooltip explanations for metrics
- [ ] 10.6 Polish visual design (colors, typography, spacing)

## 11. Testing & Validation

- [ ] 11.1 Write unit tests for OAB validation
- [ ] 11.2 Write unit tests for staleness calculation
- [ ] 11.3 Test API error handling scenarios
- [ ] 11.4 Test pagination boundary conditions
- [ ] 11.5 Test async update flow (success, error, timeout)
- [ ] 11.6 Test LGPD masking behavior

## 12. Documentation & Deployment

- [ ] 12.1 Document API usage and rate limits
- [ ] 12.2 Add README with setup instructions
- [ ] 12.3 Configure CI/CD pipeline
- [ ] 12.4 Set up staging environment
- [ ] 12.5 Deploy to production
