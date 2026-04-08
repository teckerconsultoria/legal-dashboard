export enum ErrorCode {
  // Fulfillment
  STEP_FAILED          = 'STEP_FAILED',
  STEP_TIMEOUT         = 'STEP_TIMEOUT',
  STEP_ALREADY_DONE    = 'STEP_ALREADY_DONE',
  ORDER_NOT_FOUND      = 'ORDER_NOT_FOUND',
  SCHEMA_INVALID       = 'SCHEMA_INVALID',
  MISSING_INPUTS       = 'MISSING_INPUTS',
  // API externa
  ESCAVADOR_ERROR      = 'ESCAVADOR_ERROR',
  RATE_LIMIT           = 'RATE_LIMIT',
  // Auth
  UNAUTHORIZED         = 'UNAUTHORIZED',
  FORBIDDEN            = 'FORBIDDEN',
}

export interface ApiError {
  error: string
  code: ErrorCode
}
