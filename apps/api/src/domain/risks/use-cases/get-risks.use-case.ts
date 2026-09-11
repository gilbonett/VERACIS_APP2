import { Either, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { Risk } from "../entities/risk";
import { RiskRepository } from "../repositories/risk-repository";

type GetRisksUseCaseRequest = Either<
  never,
  {
    risks: Risk[];
  }
>;

@Injectable()
export class GetRisksUseCase implements UseCase<never, GetRisksUseCaseRequest> {
  constructor(private riskRepository: RiskRepository) {}

  async execute(): Promise<GetRisksUseCaseRequest> {
    const risks = await this.riskRepository.findMany();

    return right({ risks });
  }
}
