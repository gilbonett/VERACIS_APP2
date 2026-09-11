import { UserTerms } from "@/domain/users/entities/user-terms";
import { Prisma } from "@generated/client";

export class PrismaUserTermsMapper {
  static toPrisma(raw: UserTerms): Prisma.UserTermsUncheckedCreateInput {
    return {
      id: raw.id.toString(),
      termsId: raw.termsId.toString(),
      userId: raw.userId.toString(),
      ipAddress: raw.ipAddress,
      userAgent: raw.userAgent,
      createdAt: raw.createdAt,
    };
  }
}
