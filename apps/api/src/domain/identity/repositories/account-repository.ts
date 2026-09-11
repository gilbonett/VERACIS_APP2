import { Transaction } from "@/core/repositories/transaction";
import { Account } from "../entities/account";

export abstract class AccountRepository {
  abstract create(account: Account, tx?: Transaction): Promise<void>;
  abstract save(account: Account, tx?: Transaction): Promise<void>;
  abstract findByProviderAndAccountId(
    providerId: string,
    accountId: string,
  ): Promise<Account | null>;
  abstract findCredentialByUserId(userId: string): Promise<Account | null>;
  abstract listByUserId(userId: string): Promise<Account[]>;
  abstract existsByProvider(providerId: string): Promise<boolean>;
}
