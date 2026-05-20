// src/utils/safe.ts

/**
 * Garante que o valor retornado seja sempre um array iterável.
 * Útil para mapeamento de dados instáveis de API.
 */
export function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}

/**
 * Garante um valor padrão caso o valor seja nulo ou indefinido.
 * Ao contrário do ||, aceita valores como 0 ou false (usando ??).
 */
export function safeValue<T>(value: T | undefined | null, fallback: T): T {
  return value ?? fallback
}
