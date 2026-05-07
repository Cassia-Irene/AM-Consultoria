// src/services/api.ts

import { AppError } from '@/utils/errors'
import { USE_MOCKS, API_URL } from '@/config/env'

export async function fetchApi<T>(endpoint: string, options?: RequestInit, mockFallback?: T): Promise<T> {
  if (USE_MOCKS && mockFallback !== undefined) {
    console.info(`[DATA SOURCE][MOCK] ${endpoint}`)
    return mockFallback
  }
  const url = `${API_URL}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text')
      console.error(`[ERROR][API] ${response.status} na rota ${url}: ${errorText}`)
      throw new AppError(`Erro no servidor (${response.status})`, 'API_ERROR', { status: response.status, text: errorText })
    }

    console.info(`[DATA SOURCE][API] ${endpoint}`)

    // Se não houver corpo (ex: 204 No Content), retorna null
    if (response.status === 204) {
      return null as unknown as T
    }

    return await response.json()
  } catch (err) {
    if (mockFallback !== undefined) {
      console.warn(`[HYBRID MODE] API falhou na rota ${endpoint}, usando mock. Erro:`, err)
      console.warn('[FALLBACK ACTIVATED]')
      return mockFallback
    }
    throw err
  }
}
