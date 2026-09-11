import { Account, CREDENTIAL_PROVIDER_ID } from "@/domain/identity/entities/account";
import { AccountRepository } from "@/domain/identity/repositories/account-repository";

export class InMemoryAccountRepository implements AccountRepository {
  public items: Account[] = [];

  async create(account: Account): Promise<void> {
    this.items.push(account);
  }

  async save(account: Account): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === account.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = account;
    } else {
      this.items.push(account);
    }
  }

  async findByProviderAndAccountId(
    providerId: string,
    accountId: string,
  ): Promise<Account | null> {
    const account = this.items.find(
      (item) => item.providerId === providerId && item.accountId === accountId,
    );
    return account ?? null;
  }

  async findCredentialByUserId(userId: string): Promise<Account | null> {
    const account = this.items.find(
      (item) =>
        item.providerId === CREDENTIAL_PROVIDER_ID &&
        item.userId.toString() === userId,
    );
    return account ?? null;
  }

  async listByUserId(userId: string): Promise<Account[]> {
    return this.items.filter((item) => item.userId.toString() === userId);
  }

  async existsByProvider(providerId: string): Promise<boolean> {
    return this.items.some((item) => item.providerId === providerId);
  }
}
