/** "2026-06-07 14:30" style timestamp used on the print sheets. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Street + house number, e.g. "Main Street 12". */
export function formatStreet(street: string | null, houseNumber: string | null): string {
  return street ? `${street} ${houseNumber ?? ''}`.trim() : ''
}

/**
 * Best-effort display label for a referenced entity (foreign-key target):
 * joins its text fields, skipping the id and timestamp columns. Generic stand-in
 * for a dedicated display field — e.g. a PostalCode renders as "AT 1010 Vienna".
 */
export function entityLabel(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return ''
  return Object.entries(obj as Record<string, unknown>)
    .filter(([key, value]) => key !== 'id' && !key.endsWith('At') && typeof value === 'string' && value)
    .map(([, value]) => value as string)
    .join(' ')
}
