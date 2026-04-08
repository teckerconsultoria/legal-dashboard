## ADDED Requirements

### Requirement: OAB input accepts valid format
The OAB selector SHALL accept input in the format UF/numero (e.g., SP/123456) with optional tipo suffix.

#### Scenario: Valid OAB input
- **WHEN** user enters "SP/123456" in the OAB selector
- **THEN** system validates the format and enables the "Consultar" button

#### Scenario: Invalid OAB format
- **WHEN** user enters "123456" without UF
- **THEN** system displays error "UF é obrigatória" and disables "Consultar"

#### Scenario: OAB lookup success
- **WHEN** user submits valid OAB and API responds successfully
- **THEN** system loads the Data Health panel and displays process count

#### Scenario: OAB not found
- **WHEN** user submits OAB that doesn't exist in Escavador
- **THEN** system displays "OAB não encontrada" message

### Requirement: OAB history is persisted
The system SHALL persist recent OAB searches for quick re-access.

#### Scenario: Previous OAB appears in dropdown
- **WHEN** user has searched for OABs previously
- **THEN** system shows recent OABs in a dropdown/autocomplete

#### Scenario: Clear OAB history
- **WHEN** user clicks "Clear history"
- **THEN** system removes all saved OABs from local storage
