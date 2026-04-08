## ADDED Requirements

### Requirement: Data Health panel displays process count
The system SHALL show the total number of processes associated with the selected OAB.

#### Scenario: Display process count
- **WHEN** user selects a valid OAB
- **THEN** system displays "Total de processos: X" as a KPI card

### Requirement: Data Health panel displays staleness metrics
The system SHALL show how recently processes were verified, calculating from data_ultima_verificacao.

#### Scenario: Display staleness distribution
- **WHEN** user views Data Health panel
- **THEN** system shows percentage of processes verified in last 7 days, 8-30 days, and >30 days

#### Scenario: Staleness warning
- **WHEN** more than 30% of processes have staleness >30 days
- **THEN** system displays a warning banner "Carteira desatualizada"

### Requirement: Data Health panel displays active/inactive ratio
The system SHALL show the ratio of ACTIVE to INACTIVE processes based on IA classification.

#### Scenario: Display status breakdown
- **WHEN** user views Data Health panel
- **THEN** system displays "Ativos: X (Y%)" and "Inativos: Z (W%)"

#### Scenario: Status from multiple sources
- **WHEN** process has conflicting statuses across tribunal sources
- **THEN** system shows "Divergente" badge and highlights for manual review

### Requirement: Data Health panel displays update queue status
The system SHALL show pending update jobs for processes in the current OAB.

#### Scenario: Display queue summary
- **WHEN** user views Data Health panel with pending updates
- **THEN** system shows "Atualizações pendentes: X" with breakdown (PENDENTE/SUCESSO/ERRO)

#### Scenario: Update in progress
- **WHEN** a process update job has status PENDENTE
- **THEN** system shows spinner/icon indicating "Atualizando..."

### Requirement: Data Health panel lists critical processes
The system SHALL display a table of processes requiring attention (high staleness or high volume of movements).

#### Scenario: Critical process list
- **WHEN** user scrolls to "Processos Críticos" section
- **THEN** system displays table with CNJ, days since last check, movement count, and "Atualizar" button
