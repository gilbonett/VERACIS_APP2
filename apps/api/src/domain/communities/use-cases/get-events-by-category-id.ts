import { Either, right } from "@/core/either";
import { Injectable } from "@nestjs/common";
import { Event } from "../entities/event";
import { EventRepository } from "../repositories/event-repository";

type GetEventsByCategoryIdUseCaseRequest = {
  categoryId: string;
};

type GetEventsByCategoryIdUseCaseResponse = Either<never, { events: Event[] }>;

@Injectable()
export class GetEventsByCategoryIdUseCase {
  constructor(private eventRepository: EventRepository) {}

  async execute({
    categoryId,
  }: GetEventsByCategoryIdUseCaseRequest): Promise<GetEventsByCategoryIdUseCaseResponse> {
    const events = await this.eventRepository.findManyByCategoryId(categoryId);

    return right({
      events,
    });
  }
}
