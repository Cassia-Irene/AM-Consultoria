// src/utils/errors.ts

export type AppErrorCode = 'API_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN'

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
