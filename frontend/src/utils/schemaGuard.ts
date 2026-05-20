// src/utils/schemaGuard.ts

/**
 * Valida a presença das chaves obrigatórias em um objeto raw vindo da API ou Mock.
 * Apenas emite um warning no console se houver chaves faltando, sem quebrar a aplicação.
 */
export function validateShape<T>(
  name: string,
  data: unknown,
  requiredKeys: (keyof T)[]
) {
  if (!data || typeof data !== 'object') {
    console.warn(`[SCHEMA MISMATCH][${name}] Dados não são um objeto:`, data)
    return
  }

  const missing = requiredKeys.filter(
    key => !(key in (data as Record<string, unknown>))
  )

  if (missing.length > 0) {
    console.warn(`[SCHEMA MISMATCH][${name}] Missing fields:`, missing)
  }
}

/**
 * Emite um alerta estruturado no console sobre divergências de schema.
 * Usado para identificar quando o backend diverge do esperado sem quebrar a UI.
 */
export function warnInvalidShape(
  entity: string,
  raw: unknown,
  details?: string
) {
  console.warn(
    `[WARN][MAPPER][${entity}] Shape inválido`,
    {
      details,
      timestamp: new Date().toISOString(),
      raw,
    }
  );
}
