// src/config/env.ts

const rawMocksPlural = process.env.NEXT_PUBLIC_USE_MOCKS
const rawMocksSingular = process.env.NEXT_PUBLIC_USE_MOCK

export const USE_MOCKS = 
  rawMocksPlural === 'true' || 
  rawMocksSingular === 'true' ||
  (rawMocksPlural === undefined && rawMocksSingular === undefined) ||
  rawMocksPlural === '' || 
  rawMocksSingular === ''

// Log para debug no console do navegador
if (typeof window !== 'undefined') {
  console.log('[ENV] NEXT_PUBLIC_USE_MOCK:', rawMocksSingular)
  console.log('[ENV] USE_MOCKS final:', USE_MOCKS)
  console.log('[ENV] API_URL:', process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
