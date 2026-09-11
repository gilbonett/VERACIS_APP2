import {
  PurposeTokenSecretState,
  PurposeTokenStore,
} from "@/domain/authentication/stores/purpose-token-store";

export class InMemoryPurposeTokenStore implements PurposeTokenStore {
  public items = new Map<
    string,
    { state: PurposeTokenSecretState; ttlSeconds: number }
  >();

  async issue(
    id: string,
    state: PurposeTokenSecretState,
    ttlSeconds: number,
  ): Promise<void> {
    this.items.set(id, { state, ttlSeconds });
  }

  async read(id: string): Promise<PurposeTokenSecretState | null> {
    return this.items.get(id)?.state ?? null;
  }

  async compareAndSwap(
    id: string,
    expected: PurposeTokenSecretState,
    next: PurposeTokenSecretState,
  ): Promise<boolean> {
    const entry = this.items.get(id);

    if (
      !entry ||
      entry.state.secretHash !== expected.secretHash ||
      entry.state.attempts !== expected.attempts
    ) {
      return false;
    }

    entry.state = next;
    return true;
  }

  async revoke(id: string): Promise<void> {
    this.items.delete(id);
  }
}
