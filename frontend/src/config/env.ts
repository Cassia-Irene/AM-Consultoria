// src/config/env.ts

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || process.env.NEXT_PUBLIC_USE_MOCKS === undefined
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api'
