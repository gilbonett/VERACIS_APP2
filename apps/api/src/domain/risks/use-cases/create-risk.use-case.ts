import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Slug } from "@/core/value-objects/slug";
import { Injectable } from "@nestjs/common";
import { Risk } from "../entities/risk";
import { RiskAlreadyExistsError } from "../errors/risk-already-exists-error";
import { RiskRepository } from "../repositories/risk-repository";

interface CreateRiskUseCaseRequest {
  name: string;
  description?: string | null;
}

type CreateRiskUseCaseResponse = Either<
  RiskAlreadyExistsError,
  {
    risk: Risk;
  }
>;

@Injectable()
export class CreateRiskUseCase implements UseCase<
  CreateRiskUseCaseRequest,
  CreateRiskUseCaseResponse
> {
  constructor(private riskRepository: RiskRepository) {}

  async execute({
    name,
    description,
  }: CreateRiskUseCaseRequest): Promise<CreateRiskUseCaseResponse> {
    const riskBySlug = await this.riskRepository.findBySlug(
      Slug.createFromText(name).value,
    );

    if (riskBySlug) {
      return left(new RiskAlreadyExistsError());
    }

    const risk = Risk.create({
      name,
      description,
    });

    await this.riskRepository.create(risk);

    return right({ risk });
  }
}
