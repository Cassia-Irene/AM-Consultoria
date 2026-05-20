export interface AuditEntry {
  timestamp: string
  user: string
  changes: Record<string, { de: string, para: string }>
  audit_type: string
}
