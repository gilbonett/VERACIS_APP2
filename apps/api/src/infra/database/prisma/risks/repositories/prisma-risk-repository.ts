import { Risk } from "@/domain/risks/entities/risk";
import { RiskRepository } from "@/domain/risks/repositories/risk-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaRiskMapper } from "../mappers/prisma-risk-mapper";

@Injectable()
export class PrismaRiskRepository implements RiskRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(): Promise<Risk[]> {
    const risks = await this.prisma.risk.findMany();

    return risks.map(PrismaRiskMapper.toDomain);
  }

  async findBySlug(slug: string): Promise<Risk | null> {
    const risk = await this.prisma.risk.findUnique({
      where: { slug },
    });

    if (!risk) return null;

    return PrismaRiskMapper.toDomain(risk);
  }

  async create(props: Risk): Promise<void> {
    const data = PrismaRiskMapper.toPrisma(props);

    await this.prisma.risk.create({ data });
  }
}
