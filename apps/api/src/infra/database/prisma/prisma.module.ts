import { AlertAttachmentsRepository } from "@/domain/alerts/repositories/alert-attachments-repository";
import { AlertCommentRepository } from "@/domain/alerts/repositories/alert-comment-repository";
import { AlertDetailsRepository } from "@/domain/alerts/repositories/alert-details-repository";
import { AlertEventsRepository } from "@/domain/alerts/repositories/alert-events-repository";
import { AlertMetricsRepository } from "@/domain/alerts/repositories/alert-metrics-repository";
import { AlertReactionRepository } from "@/domain/alerts/repositories/alert-reaction-repository";
import { AlertRepository } from "@/domain/alerts/repositories/alert-repository";
import { AlertRiskRepository } from "@/domain/alerts/repositories/alert-risk-repository";
import { AttachmentRepository } from "@/domain/attachments/repositories/attachment-repository";
import { OtpChallengeRepository } from "@/domain/auth/repositories/otp-challenge-repository";
import { PasswordResetRepository } from "@/domain/auth/repositories/password-reset-repository";
import { SessionRepository } from "@/domain/auth/repositories/session-repository";
import { CategoryRepository } from "@/domain/categories/repositories/category-repository";
import { BiomeRepository } from "@/domain/common/repositories/biome-repository";
import { CommunityRepository } from "@/domain/communities/repositories/community-repository";
import { EventRepository } from "@/domain/communities/repositories/event-repository";
import { AccountRepository } from "@/domain/identity/repositories/account-repository";
import { NotificationRepository } from "@/domain/notifications/repositories/notification-repository";
import { RiskRepository } from "@/domain/risks/repositories/risk-repository";
import { MembershipRepository } from "@/domain/users/repositories/membership-repository";
import { UserRepository } from "@/domain/users/repositories/user-repository";
import { UserTermsRepository } from "@/domain/users/repositories/user-terms-repository";
import { CacheModule } from "@/infra/cache/cache.module";
import { Module } from "@nestjs/common";
import { PrismaAlertAttachmentsRepository } from "./alerts/repositories/prisma-alert-attachments-repository";
import { PrismaAlertCommentRepository } from "./alerts/repositories/prisma-alert-comment-repository";
import PrismaAlertDetailsRepository from "./alerts/repositories/prisma-alert-details-repository";
import { PrismaAlertEventsRepository } from "./alerts/repositories/prisma-alert-events-repository";
import { PrismaAlertMetricsRepository } from "./alerts/repositories/prisma-alert-metrics-repository";
import { PrismaAlertReactionRepository } from "./alerts/repositories/prisma-alert-reaction-repository";
import { PrismaAlertRepository } from "./alerts/repositories/prisma-alert-repository";
import { PrismaAlertRiskRepository } from "./alerts/repositories/prisma-alert-risk-repository";
import { PrismaAttachmentRepository } from "./attachments/repositories/prisma-attachment-repository";
import { PrismaOtpChallengeRepository } from "./auth/repositories/prisma-otp-challenge-repository";
import { PrismaPasswordResetsRepository } from "./auth/repositories/prisma-password-reset-repository";
import { PrismaSessionRepository } from "./auth/repositories/prisma-session-repository";
import { PrismaCategoryRepository } from "./categories/repositories/prisma-category-repository";
import { PrismaBiomeRepository } from "./common/repositories/prisma-biome-repository";
import { PrismaCommunityRepository } from "./communities/repositories/prisma-community-repository";
import { PrismaEventRepository } from "./communities/repositories/prisma-event-repository";
import { PrismaAccountRepository } from "./identities/repositories/prisma-account-repository";
import { PrismaNotificationRepository } from "./notifications/repositories/prisma-notification-repository";
import { OutboxRepository } from "./outbox/outbox-repository";
import { PrismaOutboxRepository } from "./outbox/prisma-outbox-repository";
import { PrismaService } from "./prisma.service";
import { PrismaRiskRepository } from "./risks/repositories/prisma-risk-repository";
import { PrismaMembershipRepository } from "./users/repositories/prisma-membership-repository";
import { PrismaUserRepository } from "./users/repositories/prisma-user-repository";
import { PrismaUserTermsRepository } from "./users/repositories/prisma-user-terms-repository";

@Module({
  imports: [CacheModule],
  providers: [
    PrismaService,

    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: UserTermsRepository,
      useClass: PrismaUserTermsRepository,
    },
    {
      provide: SessionRepository,
      useClass: PrismaSessionRepository,
    },
    {
      provide: PasswordResetRepository,
      useClass: PrismaPasswordResetsRepository,
    },
    {
      provide: OtpChallengeRepository,
      useClass: PrismaOtpChallengeRepository,
    },
    {
      provide: MembershipRepository,
      useClass: PrismaMembershipRepository,
    },
    {
      provide: BiomeRepository,
      useClass: PrismaBiomeRepository,
    },
    {
      provide: CommunityRepository,
      useClass: PrismaCommunityRepository,
    },
    {
      provide: AttachmentRepository,
      useClass: PrismaAttachmentRepository,
    },
    {
      provide: EventRepository,
      useClass: PrismaEventRepository,
    },
    {
      provide: AccountRepository,
      useClass: PrismaAccountRepository,
    },
    {
      provide: CategoryRepository,
      useClass: PrismaCategoryRepository,
    },
    {
      provide: AlertRepository,
      useClass: PrismaAlertRepository,
    },
    {
      provide: AlertEventsRepository,
      useClass: PrismaAlertEventsRepository,
    },
    {
      provide: AlertAttachmentsRepository,
      useClass: PrismaAlertAttachmentsRepository,
    },
    {
      provide: AlertDetailsRepository,
      useClass: PrismaAlertDetailsRepository,
    },
    {
      provide: AlertCommentRepository,
      useClass: PrismaAlertCommentRepository,
    },
    {
      provide: AlertReactionRepository,
      useClass: PrismaAlertReactionRepository,
    },
    {
      provide: RiskRepository,
      useClass: PrismaRiskRepository,
    },
    {
      provide: NotificationRepository,
      useClass: PrismaNotificationRepository,
    },
    {
      provide: AlertMetricsRepository,
      useClass: PrismaAlertMetricsRepository,
    },
    {
      provide: AlertRiskRepository,
      useClass: PrismaAlertRiskRepository,
    },
    {
      provide: OutboxRepository,
      useClass: PrismaOutboxRepository,
    },
  ],
  exports: [
    PrismaService,
    UserRepository,
    UserTermsRepository,
    SessionRepository,
    PasswordResetRepository,
    OtpChallengeRepository,
    MembershipRepository,
    BiomeRepository,
    CommunityRepository,
    AttachmentRepository,
    EventRepository,
    AccountRepository,
    CategoryRepository,
    AlertRepository,
    AlertEventsRepository,
    AlertAttachmentsRepository,
    AlertDetailsRepository,
    AlertCommentRepository,
    AlertReactionRepository,
    RiskRepository,
    NotificationRepository,
    AlertMetricsRepository,
    AlertRiskRepository,
    OutboxRepository,
  ],
})
export class PrismaModule {}
