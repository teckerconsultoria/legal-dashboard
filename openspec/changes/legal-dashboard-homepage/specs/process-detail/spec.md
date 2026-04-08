## ADDED Requirements

### Requirement: Process detail shows capa information
The system SHALL display comprehensive case header information when user drills down to a process.

#### Scenario: Display capa
- **WHEN** user clicks on a process in the list
- **THEN** system opens detail drawer/page with CNJ, classe, subject, vara,forum, parties

#### Scenario: Copy CNJ
- **WHEN** user clicks "Copy" button next to CNJ
- **THEN** system copies CNJ to clipboard and shows "Copiado!"

### Requirement: Process detail shows movimentações timeline
The system SHALL display a chronological list of all case movements.

#### Scenario: Movement timeline
- **WHEN** user views process detail
- **THEN** system shows timeline with date, tipo, conteudo, and fonte for each movement

#### Scenario: Load more movements
- **WHEN** user scrolls to bottom of movement list
- **THEN** system loads next page of movements (up to 500)

### Requirement: Process detail shows involved parties
The system SHALL display all parties (partes) associated with the process.

#### Scenario: Involved parties list
- **WHEN** user views process detail
- **THEN** system shows list of "Autor" (plaintiff) and "Réu" (defendant) with roles

#### Scenario: Party masking
- **WHEN** user has Viewer role and views party names
- **THEN** system displays masked names (J*** S****)

### Requirement: Process detail shows public documents
The system SHALL list available public documents for the process.

#### Scenario: Document list
- **WHEN** user views process detail
- **THEN** system shows list of public documents with date and description

### Requirement: Process detail shows current update status
The system SHALL display the last verification timestamp and current job status.

#### Scenario: Display status
- **WHEN** user views process detail
- **THEN** system shows "Última verificação: há X dias" and current job status

#### Scenario: Status states
- **WHEN** update job status is PENDENTE
- **THEN** system shows spinning indicator
- **WHEN** update job status is SUCESSO
- **THEN** system shows green checkmark
- **WHEN** update job status is ERRO
- **THEN** system shows red X with error message
- **WHEN** update job status is NAO_ENCONTRADO
- **THEN** system shows warning about process not found at source

### Requirement: User can request process update
The system SHALL allow user to trigger an async update of process data from the tribunal.

#### Scenario: Request update
- **WHEN** user clicks "Solicitar atualização" button
- **THEN** system sends POST to /processos/numero_cnj/{cnj}/solicitar-atualizacao and shows "Atualização iniciada"

#### Scenario: Update with documents
- **WHEN** user enables "Incluir documentos públicos" toggle before requesting update
- **THEN** system includes documents_publicos=1 in request body

#### Scenario: Update failed
- **WHEN** update request returns ERRO
- **THEN** system displays "Falha na atualização" with retry button
