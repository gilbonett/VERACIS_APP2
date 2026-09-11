import { UnitOfWork } from "@/core/repositories/unit-of-work";
import { TransactionClient } from "@generated/internal/prismaNamespace";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(callback: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction((tx) => callback(tx));
  }
}
