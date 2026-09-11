import { AuthStore, AuthStoreCasResult } from '@/application/stores/auth-store'

export class FakeAuthStore implements AuthStore {
  public items = new Map<string, unknown>()
  public revoked: string[] = []

  private key(prefix: string, id: string): string {
    return `${prefix}:${id}`
  }

  async issue<T>(
    prefix: string,
    id: string,
    state: T,
    _ttlSeconds: number,
  ): Promise<void> {
    this.items.set(this.key(prefix, id), state)
  }

  async read<T>(prefix: string, id: string): Promise<T | null> {
    return (this.items.get(this.key(prefix, id)) as T | undefined) ?? null
  }

  async compareAndSwap<T>(
    prefix: string,
    id: string,
    expected: T,
    next: T,
    _ttlSeconds: number,
  ): Promise<AuthStoreCasResult> {
    const key = this.key(prefix, id)
    const current = this.items.get(key)

    if (current === undefined) {
      return { success: false, reason: 'NOT_FOUND' }
    }

    if (JSON.stringify(current) !== JSON.stringify(expected)) {
      return { success: false, reason: 'STATE_MISMATCH' }
    }

    this.items.set(key, next)
    return { success: true }
  }

  async revoke(prefix: string, id: string): Promise<void> {
    const key = this.key(prefix, id)
    this.revoked.push(key)
    this.items.delete(key)
  }

  async consume<T>(prefix: string, id: string): Promise<T | null> {
    const key = this.key(prefix, id)
    const value = (this.items.get(key) as T | undefined) ?? null
    this.items.delete(key)
    return value
  }
}
