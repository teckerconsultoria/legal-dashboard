## ADDED Requirements

### Requirement: Update job can be requested
The system SHALL initiate an async job to update process data from the tribunal source.

#### Scenario: Request update job
- **WHEN** user triggers "Solicitar atualização"
- **THEN** system creates job with status PENDENTE and returns job ID

#### Scenario: Request includes callback flag
- **WHEN** user has enabled callback notifications
- **THEN** system sends enviar_callback=1 in request body

### Requirement: Job status is tracked
The system SHALL poll for job status until completion or timeout.

#### Scenario: Job pending
- **WHEN** job status is PENDENTE
- **THEN** system shows progress indicator

#### Scenario: Job success
- **WHEN** job status becomes SUCESSO
- **THEN** system shows success message and re-fetches process data

#### Scenario: Job error
- **WHEN** job status becomes ERRO
- **THEN** system shows error message with reason and enables retry

#### Scenario: Job not found
- **WHEN** job status is NAO_ENCONTRADO
- **THEN** system shows "Processo não encontrado no tribunal" (may be archived/secret)

### Requirement: Job polling uses exponential backoff
The system SHALL poll at increasing intervals to avoid overwhelming the API.

#### Scenario: Polling schedule
- **WHEN** job is PENDENTE
- **THEN** system polls at 2s (attempts 1-3), 5s (attempts 4-6), 10s (attempts 7+)

#### Scenario: Job timeout
- **WHEN** job remains PENDENTE for more than 5 minutes
- **THEN** system shows "Timeout - tente novamente" and enables manual retry

### Requirement: Update results are cached
The system SHALL cache updated process data to avoid redundant API calls.

#### Scenario: Cache after success
- **WHEN** job completes with SUCESSO
- **THEN** system stores fresh data with timestamp in cache

#### Scenario: Cache expiry
- **WHEN** cached data is older than 1 hour
- **THEN** system indicates "Dados podem estar desatualizados"

### Requirement: Credit usage is tracked
The system SHALL monitor and display API credit consumption.

#### Scenario: Display credit usage
- **WHEN** user makes API requests
- **THEN** system tracks Creditos-Utilizados header and displays running total

#### Scenario: Low credit warning
- **WHEN** credits remaining fall below threshold
- **THEN** system shows warning "Créditos baixos - X restantes"
