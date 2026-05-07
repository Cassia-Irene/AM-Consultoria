export function displayDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR')
}

export function toAPIDate(display: string): string | null {
  if (!display) return null
  const parts = display.split('/')
  if (parts.length === 3) {
    const [dia, mes, ano] = parts
    return new Date(`${ano}-${mes}-${dia}T00:00:00Z`).toISOString()
  }
  const date = new Date(display)
  if (!isNaN(date.getTime())) return date.toISOString()
  return null
}

export function parseDate(value: string): Date {
  const parts = value.split('/')
  if (parts.length === 3) {
    const [dia, mes, ano] = parts.map(Number)
    return new Date(ano, mes - 1, dia)
  }
  return new Date(value)
}

/**
 * Converte dd/mm/yyyy → YYYY-MM-DD sem aplicar conversão de timezone.
 * Usado para converter prazo de pendências do formato pt-BR para ISO.
 */
export function ptBRToISO(date: string): string {
  const parts = date.split('/')
  if (parts.length !== 3) return date
  const [day, month, year] = parts
  if (!day || !month || !year) return date
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * Extrai parte DATE de um valor datetime-local (YYYY-MM-DDTHH:mm) → YYYY-MM-DD.
 * Garante que campos DATE do banco não recebam componente de hora.
 */
export function datetimeLocalToDate(value: string): string {
  return value.split('T')[0]
}

export function getDiffDias(prazo: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const p = parseDate(prazo)
  p.setHours(0, 0, 0, 0)
  return Math.ceil((p.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export function isToday(dateStr: string): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const hoje = new Date()
  return (
    date.getDate() === hoje.getDate() &&
    date.getMonth() === hoje.getMonth() &&
    date.getFullYear() === hoje.getFullYear()
  )
}

export function isPast(dateStr: string): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date.getTime() < hoje.getTime()
}
