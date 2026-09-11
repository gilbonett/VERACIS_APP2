import { Transaction } from "@/core/repositories/transaction";
import {
  Account,
  CREDENTIAL_PROVIDER_ID,
} from "@/domain/identity/entities/account";
import { AccountRepository } from "@/domain/identity/repositories/account-repository";
import { TransactionClient } from "@generated/internal/prismaNamespace";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaAccountMapper } from "../mappers/prisma-account-mapper";

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(account: Account, tx?: Transaction): Promise<void> {
    const client = (tx as TransactionClient) ?? this.prisma;
    await client.account.create({ data: PrismaAccountMapper.toPrisma(account) });
  }

  async save(account: Account, tx?: Transaction): Promise<void> {
    const client = (tx as TransactionClient) ?? this.prisma;
    await client.account.update({
      where: { id: account.id.toString() },
      data: PrismaAccountMapper.toPrisma(account),
    });
  }

  async findByProviderAndAccountId(
    providerId: string,
    accountId: string,
  ): Promise<Account | null> {
    const account = await this.prisma.account.findUnique({
      where: { providerId_accountId: { providerId, accountId } },
    });
    return account ? PrismaAccountMapper.toDomain(account) : null;
  }

  async findCredentialByUserId(userId: string): Promise<Account | null> {
    const account = await this.prisma.account.findUnique({
      where: { userId_providerId: { userId, providerId: CREDENTIAL_PROVIDER_ID } },
    });
    return account ? PrismaAccountMapper.toDomain(account) : null;
  }

  async listByUserId(userId: string): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({ where: { userId } });
    return accounts.map(PrismaAccountMapper.toDomain);
  }

  async existsByProvider(providerId: string): Promise<boolean> {
    const count = await this.prisma.account.count({ where: { providerId } });
    return count > 0;
  }
}
