import { SessionToken } from '@/domain/identity/entities/session-token'
import { SessionTokenRepository } from '@/domain/identity/repositories/session-token-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma.service'
import { PrismaSessionTokenMapper } from '../mappers/prisma-session-token-mapper'

@Injectable()
export class PrismaSessionTokenRepository implements SessionTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(token: SessionToken): Promise<void> {
    await this.prisma.sessionToken.create({
      data: PrismaSessionTokenMapper.toPrisma(token),
    })
  }

  async findByTokenHash(tokenHash: string): Promise<SessionToken | null> {
    const token = await this.prisma.sessionToken.findUnique({
      where: {
        tokenHash,
      },
    })

    if (!token) return null

    return PrismaSessionTokenMapper.toDomain(token)
  }

  async rotate(
    currentToken: SessionToken,
    newToken: SessionToken,
  ): Promise<boolean> {
    const rotated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.sessionToken.updateMany({
        where: {
          id: currentToken.id.toString(),
          consumedAt: null,
        },
        data: {
          consumedAt: new Date(),
          replacedByVersion: newToken.version,
        },
      })

      if (result.count !== 1) {
        return false
      }

      await tx.sessionToken.create({
        data: PrismaSessionTokenMapper.toPrisma(newToken),
      })

      return true
    })

    return rotated
  }

  async revokeAllBySessionId(sessionId: string): Promise<void> {
    await this.prisma.sessionToken.updateMany({
      where: {
        sessionId,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    })
  }
}
