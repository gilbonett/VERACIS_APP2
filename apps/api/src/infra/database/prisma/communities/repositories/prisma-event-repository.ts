import { Event } from "@/domain/communities/entities/event";
import { EventRepository } from "@/domain/communities/repositories/event-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaEventMapper } from "../mappers/prisma-event-mapper";

@Injectable()
export class PrismaEventRepository implements EventRepository {
  constructor(private prisma: PrismaService) {}

  async findManyByCategoryId(categoryId: string): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: {
        categoryId: {
          equals: categoryId,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return events.map(PrismaEventMapper.toDomain);
  }

  async create(event: Event): Promise<void> {
    const data = PrismaEventMapper.toPrisma(event);
    await this.prisma.event.create({ data });
  }

  async findById(id: string): Promise<Event | null> {
    const result = await this.prisma.event.findUnique({ where: { id } });

    if (!result) return null;

    return PrismaEventMapper.toDomain(result);
  }

  async findAll(): Promise<Event[]> {
    const results = await this.prisma.event.findMany();

    return results.map(PrismaEventMapper.toDomain);
  }
  async save(event: Event): Promise<void> {
    const data = PrismaEventMapper.toPrisma(event);

    await this.prisma.event.update({ where: { id: data.id }, data });
  }

  async delete(event: Event): Promise<void> {
    await this.prisma.event.delete({ where: { id: event.id.toString() } });
  }
}
