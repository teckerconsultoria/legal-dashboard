## ADDED Requirements

### Requirement: Insights panel displays time series of movements
The system SHALL show a chart of new movements over time (daily/weekly) for the OAB portfolio.

#### Scenario: Movement timeline chart
- **WHEN** user views Insights panel
- **THEN** system displays a line chart showing movimentações por dia/semana

### Requirement: Insights panel displays distribution by tribunal
The system SHALL show the distribution of processes across different tribunais.

#### Scenario: Tribunal distribution
- **WHEN** user views Insights panel
- **THEN** system shows bar chart or pie chart of processes per tribunal (TJSP, TJMG, etc.)

### Requirement: Insights panel displays distribution by grau
The system SHALL show the distribution of processes across judicial degrees (1º Grau, 2º Grau).

#### Scenario: Grau distribution
- **WHEN** user views Insights panel
- **THEN** system displays percentage breakdown by grau

### Requirement: Insights panel displays top themes
The system SHALL show the most common subjects/classes/varas in the portfolio.

#### Scenario: Top themes list
- **WHEN** user views Insights panel
- **THEN** system shows top 5 topics with process counts

### Requirement: Insights panel displays portfolio rhythm
The system SHALL categorize processes as "hot" (many movements in 30 days) vs "cold" (no movements).

#### Scenario: Hot vs cold distribution
- **WHEN** user views Insights panel
- **THEN** system displays "Processos ativos (quentes): X" and "Processos inativos (frios): Y"

### Requirement: Insights panel displays top counterparties
The system SHALL show most frequently appearing parties (with LGPD masking).

#### Scenario: Top counterparties
- **WHEN** user views Insights panel
- **THEN** system shows top 5 counterparties as masked (J*** S****) with frequency
