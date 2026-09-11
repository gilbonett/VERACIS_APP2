import { EventRepository } from "@/domain/communities/repositories/event-repository";
import { Injectable } from "@nestjs/common";
import { Event } from "../entities/event";

@Injectable()
export class GetEventsUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<Event[]> {
    return this.eventRepository.findAll();
  }
}
