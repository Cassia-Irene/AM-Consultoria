// src/utils/errors.ts

export type AppErrorCode = 
  | 'API_ERROR' 
  | 'VALIDATION_ERROR' 
  | 'NETWORK_ERROR' 
  | 'INTEGRATION_ERROR' // 👈 Erro semântico de contrato
  | 'UNKNOWN'

export class AppError extends Error {
  code: AppErrorCode
  details?: unknown

  constructor(message: string, code: AppErrorCode = 'UNKNOWN', details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }
}

/**
 * Erro disparado quando o dado retornado pelo backend 
 * não bate com o contrato esperado pelo mapper/adapter.
 */
export class IntegrationError extends AppError {
  constructor(domain: string, message: string, rawData?: unknown) {
    super(`[INTEGRATION][${domain}] ${message}`, 'INTEGRATION_ERROR', rawData)
    this.name = 'IntegrationError'
  }
}
