export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function parseId(value: string, label = "id"): number {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new ApiError(400, `Invalid ${label}`)
  }
  return parsed
}

export function parseBooleanFlag(value: string | undefined): boolean | undefined {
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

export function getDateStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "")
}

export function buildNextDocumentNumber(
  prefix: string,
  lastDocumentNumber?: string | null
): string {
  const lastSequence = lastDocumentNumber
    ? Number.parseInt(lastDocumentNumber.slice(prefix.length), 10)
    : 0
  const nextSequence = Number.isFinite(lastSequence) ? lastSequence + 1 : 1
  return `${prefix}${String(nextSequence).padStart(3, "0")}`
}
