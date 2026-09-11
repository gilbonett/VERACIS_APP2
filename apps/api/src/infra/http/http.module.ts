import { CompleteFederatedLoginUseCase } from '@/application/use-cases/identity/complete-federated-login-use-case'
import { CompleteFederatedRegistrationUseCase } from '@/application/use-cases/identity/complete-federated-registration-use-case'
import { ConfirmTwoFactorChallengeUseCase } from '@/application/use-cases/identity/confirm-two-factor-method-use-case'
import { IssueAuthenticatedSessionUseCase } from '@/application/use-cases/identity/issue-authenticated-session-use-case'
import { RefreshSessionUseCase } from '@/application/use-cases/identity/refresh-session-use-case'
import { StartFederatedLoginUseCase } from '@/application/use-cases/identity/start-federated-login.use-case'
import { SelectTwoFactorMethodUseCase } from '@/application/use-cases/identity/select-two-factor-method-use-case'
import { SignInUseCase } from '@/application/use-cases/identity/sign-in-use-case'
import { CreateAlertUseCase } from '@/domain/alerts/use-cases/create-alert'
import { CreateAlertAttachmentUseCase } from '@/domain/alerts/use-cases/create-alert-attachment.use-case'
import { CreateAlertCommentUseCase } from '@/domain/alerts/use-cases/create-alert-comment'
import { CreateAlertReactionUseCase } from '@/domain/alerts/use-cases/create-alert-reaction'
import { GetAlertByIdUseCase } from '@/domain/alerts/use-cases/get-alert-by-id'
import { GetAlertMetricsByCommunityIdUseCase } from '@/domain/alerts/use-cases/get-alert-metrics-by-community-id'
import { GetAlertsUseCase } from '@/domain/alerts/use-cases/get-alerts'
import { GetAlertsByGeometryUseCase } from '@/domain/alerts/use-cases/get-alerts-by-geometry'
import { GetAttachmentUseCase } from '@/domain/attachments/use-cases/get-attachment.use-case'
import { RemoveAttachmentUseCase } from '@/domain/attachments/use-cases/remove-attachment.use-case'
import { UploadAndCreateAttachmentUseCase } from '@/domain/attachments/use-cases/upload-and-create-attachment.use-case'
import { ConfirmPasswordResetUseCase } from '@/domain/auth/use-cases/confirm-password-reset.use-case'
import { RequestPasswordResetUseCase } from '@/domain/auth/use-cases/request-password-reset.use-case'
import { SignOutUseCase } from '@/domain/auth/use-cases/sign-out.use-case'
import { ValidateResetTokenUseCase } from '@/domain/auth/use-cases/validate-reset-token.use-case'
import { VerifyOtpUseCase } from '@/domain/auth/use-cases/verify-otp.use-case'
import { GetCategoriesUseCase } from '@/domain/categories/use-cases/get-categories.use-case'
import { CreateBiomeUseCase } from '@/domain/common/use-cases/create-biome'
import { GetBiomesUseCase } from '@/domain/common/use-cases/get-biomes-use-case'
import { GetCommunitiesUseCase } from '@/domain/communities/use-cases/get-communities-use-case'
import { GetEventsUseCase } from '@/domain/communities/use-cases/get-events'
import { GetEventsByCategoryIdUseCase } from '@/domain/communities/use-cases/get-events-by-category-id'
import { GetNotificationsUseCase } from '@/domain/notifications/use-cases/get-notifications.use-case'
import { ReadNotificationUseCase } from '@/domain/notifications/use-cases/read-notification.use-case'
import { StreamNotificationUseCase } from '@/domain/notifications/use-cases/stream-notification.use-case'
import { CreateRiskUseCase } from '@/domain/risks/use-cases/create-risk.use-case'
import { GetRisksUseCase } from '@/domain/risks/use-cases/get-risks.use-case'
import { CompleteMapTutorialUseCase } from '@/domain/users/use-cases/complete-map-tutorial.use-case'
import { GetProfileUseCase } from '@/domain/users/use-cases/get-profile.use-case'
import { RegisterUserUseCase } from '@/domain/users/use-cases/register-user.use-case'
import { UpdateProfileUseCase } from '@/domain/users/use-cases/update-profile.use-case'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod'
import { AuthModule } from '../auth/auth.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { DatabaseModule } from '../database/database.module'
import { HttpExceptionFilter } from '../logger/http-exception.filter'
import { RealtimeModule } from '../realtime/realtime.module'
import { StorageModule } from '../storage/storage.module'
import { AppController } from './app.controller'
import { CreateAlertAttachmentController } from './controllers/alerts/create-alert-attachment.controller'
import { CreateAlertCommentController } from './controllers/alerts/create-alert-comment.controller'
import { CreateAlertReactionController } from './controllers/alerts/create-alert-reaction.controller'
import { CreateAlertController } from './controllers/alerts/create-alert.controller'
import { GetAlertByIdController } from './controllers/alerts/get-alert-by-id.controller'
import { GetAlertMetrcisController } from './controllers/alerts/get-alert-metrics.controller'
import { GetAlertsByGeometryController } from './controllers/alerts/get-alerts-by-geometry.controller'
import { GetAlertsController } from './controllers/alerts/get-alerts.controller'
import { GetFilesController } from './controllers/attachments/get-files.controller'
import { RemoveAttachmentController } from './controllers/attachments/remove-attachment.controller'
import { UploadAndCreateAttachmentController } from './controllers/attachments/upload-and-create-attachment.controller'
import { ConfirmPasswordResetController } from './controllers/auth/confirm-password-reset.controller'
import { RequestPasswordResetController } from './controllers/auth/request-password-reset.controller'
import { SignOutController } from './controllers/auth/sign-out.controller'
import { ValidateResetTokenController } from './controllers/auth/validate-reset-token.controller'
import { VerifyOtpController } from './controllers/auth/verify-otp.controller'
import { GetCategoriesController } from './controllers/categories/get-categories.controller'
import { CreateBiomeController } from './controllers/common/create-biome.controller'
import { GetBiomesController } from './controllers/common/get-biomes.controller'
import { GetCommuntiesController } from './controllers/communities/get-communities.controller'
import { GetEventsByCategoryIdController } from './controllers/communities/get-events-by-category-id.controller'
import { GetEventsController } from './controllers/communities/get-events.controller'
import { GetNotificationsController } from './controllers/notifications/get-notifications.controller'
import { ReadNotificationController } from './controllers/notifications/read-notification.controller'
import { SteamNotificationsController } from './controllers/notifications/steam-notifications.controller'
import { CreateRiskController } from './controllers/risks/create-risk.controller'
import { GetRisksController } from './controllers/risks/get-risks.controller'
import { CompleteFederatedLoginController } from './controllers/sessions/complete-federated-login.controller'
import { CompleteFederatedRegistrationController } from './controllers/sessions/complete-federated-registration.controller'
import { ConfirmTwoFactorMethodController } from './controllers/sessions/confirm-two-factor-method.controller'
import { RefreshSessionController } from './controllers/sessions/refresh-session.controller'
import { SelectTwoFactorMethodController } from './controllers/sessions/select-two-factor-method.controller'
import { SignInController } from './controllers/sessions/sign-in.controller'
import { StartFederatedLoginController } from './controllers/sessions/start-federated-login.controller'
import { CompleteMapTutorialController } from './controllers/users/complete-map-tutorial.controller'
import { GetProfileController } from './controllers/users/get-profile.controller'
import { RegisterUserController } from './controllers/users/register-user.controller'
import { UpdateProfileController } from './controllers/users/update-profile.controller'
import { ConnectionTrackingInterceptor } from './interceptors/connection-tracking.interceptor'
import { TimeoutInterceptor } from './interceptors/timeout.interceptor'

@Module({
  imports: [
    DatabaseModule,
    CryptographyModule,
    StorageModule,
    RealtimeModule,
    AuthModule,
  ],
  controllers: [
    AppController,

    // Sessions
    RefreshSessionController,
    SignInController,
    SelectTwoFactorMethodController,
    ConfirmTwoFactorMethodController,
    StartFederatedLoginController,
    CompleteFederatedLoginController,
    CompleteFederatedRegistrationController,

    // Alerts
    CreateAlertController,
    CreateAlertCommentController,
    CreateAlertReactionController,
    GetAlertMetrcisController,
    GetAlertByIdController,
    GetAlertsController,
    CreateAlertAttachmentController,
    GetAlertsByGeometryController,

    //Attachments
    GetFilesController,
    RemoveAttachmentController,
    UploadAndCreateAttachmentController,

    //Auth
    SignOutController,
    ConfirmPasswordResetController,
    RequestPasswordResetController,
    ValidateResetTokenController,
    VerifyOtpController,

    // Users
    RegisterUserController,
    GetProfileController,
    CompleteMapTutorialController,
    UpdateProfileController,

    // Common
    GetBiomesController,
    CreateBiomeController,

    // Communities
    GetCommuntiesController,
    GetEventsController,

    GetEventsByCategoryIdController,

    // Risks
    CreateRiskController,
    GetRisksController,

    // Categories
    GetCategoriesController,

    // Notifications
    ReadNotificationController,
    GetNotificationsController,
    SteamNotificationsController,
  ],
  providers: [
    // Sessions
    RefreshSessionUseCase,
    SignInUseCase,
    IssueAuthenticatedSessionUseCase,
    SelectTwoFactorMethodUseCase,
    ConfirmTwoFactorChallengeUseCase,
    StartFederatedLoginUseCase,
    CompleteFederatedLoginUseCase,
    CompleteFederatedRegistrationUseCase,

    // Alerts
    CreateAlertUseCase,
    CreateAlertCommentUseCase,
    CreateAlertReactionUseCase,
    GetAlertByIdUseCase,
    GetAlertsUseCase,
    CreateAlertAttachmentUseCase,
    GetAlertMetricsByCommunityIdUseCase,
    GetAlertsByGeometryUseCase,

    // Attachments
    GetAttachmentUseCase,
    RemoveAttachmentUseCase,
    UploadAndCreateAttachmentUseCase,

    //Auth
    SignOutUseCase,
    ConfirmPasswordResetUseCase,
    RequestPasswordResetUseCase,
    ValidateResetTokenUseCase,
    VerifyOtpUseCase,

    // Users
    RegisterUserUseCase,
    GetProfileUseCase,
    CompleteMapTutorialUseCase,
    UpdateProfileUseCase,

    // Common
    GetBiomesUseCase,
    CreateBiomeUseCase,

    // Communities
    GetCommunitiesUseCase,
    GetEventsUseCase,
    GetEventsByCategoryIdUseCase,

    // categories
    GetCategoriesUseCase,

    // Risks
    CreateRiskUseCase,
    GetRisksUseCase,

    // Notifications
    ReadNotificationUseCase,
    GetNotificationsUseCase,
    StreamNotificationUseCase,

    // Factories
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ConnectionTrackingInterceptor,
    },
  ],
})
export class HttpModule {}
