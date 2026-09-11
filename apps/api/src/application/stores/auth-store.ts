export const AUTH_STORE_PREFIXES = {
  LOGIN_ATTEMPT: "login-attempt",
  FEDERATED_ATTEMPT: "federated-attempt",
  FEDERATED_ONBOARDING: "federated-onboarding",
} as const;

export type AuthStoreCasResult =
  | { success: true }
  | { success: false; reason: "STATE_MISMATCH" | "NOT_FOUND" };

export abstract class AuthStore {
  abstract issue<T>(
    prefix: string,
    id: string,
    state: T,
    ttlSeconds: number,
  ): Promise<void>;

  abstract read<T>(prefix: string, id: string): Promise<T | null>;

  abstract compareAndSwap<T>(
    prefix: string,
    id: string,
    expected: T,
    next: T,
    ttlSeconds: number,
  ): Promise<AuthStoreCasResult>;

  abstract revoke(prefix: string, id: string): Promise<void>;

  abstract consume<T>(prefix: string, id: string): Promise<T | null>;
}
