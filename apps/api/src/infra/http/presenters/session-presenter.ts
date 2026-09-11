import { Session } from "@/domain/auth/entities/session";

export class SessionPresenter {
  static toHTTP(session: Session) {
    return {
      id: session.id.toValue(),
      userId: session.userId.toValue(),
      ipAddress: session.ipAddress,
      // isActive: session.isActive,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    };
  }
}
