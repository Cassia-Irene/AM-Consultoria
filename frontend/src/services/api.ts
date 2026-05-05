// src/services/api.ts

import { AppError } from '@/utils/errors'

// Simulated API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api'

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No response text')
    console.error(`[ERROR][API] ${response.status} na rota ${url}: ${errorText}`)
    throw new AppError(`Erro no servidor (${response.status})`, 'API_ERROR', { status: response.status, text: errorText })
  }

  // Se não houver corpo (ex: 204 No Content), retorna null
  if (response.status === 204) {
    return null as unknown as T
  }

  return response.json()
}
