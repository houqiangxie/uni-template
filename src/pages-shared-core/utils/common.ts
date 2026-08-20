export type RemoteRequestPayload = Record<string, unknown>

export function shallowEqualObjects(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined,
): boolean {
  if (a === b)
    return true
  if (!a || !b)
    return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length)
    return false

  return keysA.every(key => a[key] === b[key])
}

/** Build a stable signature for remote request deduplication. */
export function buildRemoteRequestSignature(payload: RemoteRequestPayload): string {
  return JSON.stringify(payload)
}

/**
 * Coordinates overlapping remote requests:
 * - stale response detection via sequence id
 * - merge rapid triggers into one follow-up run
 */
export function createRemoteRequestCoordinator() {
  let seq = 0
  let pending = false

  return {
    next() {
      return ++seq
    },
    isStale(id: number) {
      return id !== seq
    },
    markPending() {
      pending = true
      seq++
    },
    consumePending() {
      const value = pending
      pending = false
      return value
    },
  }
}
