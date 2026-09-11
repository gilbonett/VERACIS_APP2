import { UserTerms } from "@/domain/users/entities/user-terms";
import { UserTermsRepository } from "@/domain/users/repositories/user-terms-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaUserTermsMapper } from "../mappers/prisma-user-terms-mapper";

@Injectable()
export class PrismaUserTermsRepository implements UserTermsRepository {
  constructor(private prisma: PrismaService) {}

  async create(terms: UserTerms): Promise<void> {
    const data = PrismaUserTermsMapper.toPrisma(terms);
    await this.prisma.userTerms.create({ data });
  }
}
