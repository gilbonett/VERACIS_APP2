import { Repository } from "@/core/repositories/repository";
import { Event } from "../entities/event";

export abstract class EventRepository extends Repository<Event> {
  abstract findManyByCategoryId(categoryId: string): Promise<Event[]>;
}
