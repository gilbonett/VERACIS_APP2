import { RefreshLockStore } from '@/application/stores/refresh-lock-store'
import { randomUUID } from 'node:crypto'

export class FakeRefreshLockStore implements RefreshLockStore {
  public locked = new Set<string>()
  public deniedSessionIds = new Set<string>()

  async acquire(sessionId: string): Promise<string | null> {
    if (this.deniedSessionIds.has(sessionId) || this.locked.has(sessionId)) {
      return null
    }

    const lockToken = randomUUID()
    this.locked.add(sessionId)
    return lockToken
  }

  async release(sessionId: string): Promise<void> {
    this.locked.delete(sessionId)
  }
}
