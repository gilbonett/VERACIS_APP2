export abstract class RefreshLockStore {
  abstract acquire(sessionId: string, ttlMs: number): Promise<string | null>
  abstract release(sessionId: string, lockToken: string): Promise<void>
}
