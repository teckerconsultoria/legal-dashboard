## Why

Law firms and solo practitioners need a unified view of their legal portfolio to understand both data quality (how current and accurate their case information is) and strategic insights (trends, distribution, workload patterns). Currently, there's no unified tool that provides both health metrics and analytical insights for legal cases tied to an OAB (Brazilian lawyer registration).

## What Changes

- **New homepage** with OAB selector as the primary entry point
- **Two-panel layout**: Data Health (quality metrics) and Strategic Insights (analytics)
- **Process detail view** with capa, movimentações, envolvidos, documentos públicos
- **Async update workflow** - request updates, track status (PENDENTE/SUCESSO/ERRO/NAO_ENCONTRADO), re-consult
- **Filtering** by tribunal, status (ATIVO/INATIVO), date range
- **Sampling mode** for quick prototyping vs. full data analysis
- **LGPD-aware display** with role-based masking

## Capabilities

### New Capabilities
- `oab-selector`: OAB (UF + número + tipo) input component with validation
- `data-health-panel`: Metrics dashboard showing staleness, completeness, active/inactive ratio, update queue status
- `insights-panel`: Analytics showing time series, distribution by tribunal/grau, top themes, portfolio rhythm
- `process-detail`: Drill-down view with capa, movimentações, envolvidos, documentos, update action
- `async-update-flow`: Job-based update system with status tracking and callbacks

### Modified Capabilities
None - this is a net new feature.

## Impact

- **New frontend routes**: `/` (homepage with OAB selector), `/processos/:cnj` (detail)
- **Backend integration**: Escavador API v2 (advogado/resumo, advogado/processos, processos/numero_cnj/*)
- **State management**: Process cache, job queue status, user session/OAB history
- **Dependencies**: Escavador API token, rate limiting (500 req/min), credit tracking
