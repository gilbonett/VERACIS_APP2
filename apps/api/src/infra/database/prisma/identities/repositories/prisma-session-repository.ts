import { Session } from '@/domain/identity/entities/session'
import { SessionRepository } from '@/domain/identity/repositories/session-repository'
import { CacheRepository } from '@/infra/cache/cache-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'
import { PrismaSessionMapper } from '../mappers/prisma-session-mapper'

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheRepository,
  ) {}

  private cacheKey(sessionId: string) {
    return `session:${sessionId}`
  }

  async create(session: Session): Promise<void> {
    const data = PrismaSessionMapper.toPrisma(session)
    await this.prisma.session.create({ data })

    await this.cache.set(
      this.cacheKey(session.id.toString()),
      JSON.stringify(data),
    )
  }

  async findById(id: string): Promise<Session | null> {
    const hit = await this.cache.get(`session:${id}`)

    if (hit) return PrismaSessionMapper.toDomain(JSON.parse(hit))

    const session = await this.prisma.session.findUnique({ where: { id } })

    if (!session) return null

    const sessionMiss = PrismaSessionMapper.toDomain(session)

    await this.cache.set(this.cacheKey(id), JSON.stringify(sessionMiss))

    return sessionMiss
  }

  async findManyActiveByUserId(userId: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gte: new Date(),
        },
      },
    })

    return sessions.map((session) => PrismaSessionMapper.toDomain(session))
  }

  async save(session: Session): Promise<void> {
    const data = PrismaSessionMapper.toPrisma(session)
    await this.prisma.session.update({
      where: { id: session.id.toString() },
      data,
    })

    const sessionId = session.id.toString()

    await this.cache.delete(this.cacheKey(sessionId))
    await this.cache.set(this.cacheKey(sessionId), JSON.stringify(data))
  }

  async revoke(session: Session): Promise<void> {
    const data = PrismaSessionMapper.toPrisma(session)
    await this.prisma.session.update({
      where: { id: session.id.toString() },
      data,
    })

    await this.cache.delete(this.cacheKey(session.id.toString()))
  }

  async revokeAllByUserId(userId: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
    })

    await this.prisma.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    })

    for (const session of sessions) {
      await this.cache.delete(this.cacheKey(session.id.toString()))
    }

    return sessions.map((session) => PrismaSessionMapper.toDomain(session))
  }
}
