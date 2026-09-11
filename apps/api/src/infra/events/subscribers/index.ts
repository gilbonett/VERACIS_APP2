import { Provider } from "@nestjs/common";
import { OnAlertAcceptedNotifyMembers } from "./on-alert-accepted-notify-members";
import { OnAlertCreatedScheduleAcceptedExpiration } from "./on-alert-created-schedule-accepted-expiration";
import { OnAlertCreatedSchedulePendingExpiration } from "./on-alert-created-schedule-pending-expiration";
import { OnAttachmentRemoved } from "./on-attachment-removed";
import { OnNotificationCreated } from "./on-notification-created";
import { OnNotificationsCreated } from "./on-notifications-created";
import { OnOtpCodeRequested } from "./on-otp-code-requested";
import { OnPasswordChangedRequested } from "./on-password-changed";
import { OnPasswordResetRequested } from "./on-password-reset-requested";
import { OnUserCreated } from "./on-user-created";
import { OnUserRegistered } from "./on-user-registered";
import { OnUserTermsAccepted } from "./on-user-terms-accepted";

export const SUBSCRIBERS: Provider[] = [
  OnAlertCreatedScheduleAcceptedExpiration,
  OnAlertCreatedSchedulePendingExpiration,
  OnAlertAcceptedNotifyMembers,
  OnAttachmentRemoved,
  OnNotificationCreated,
  OnNotificationsCreated,
  OnOtpCodeRequested,
  OnPasswordChangedRequested,
  OnPasswordResetRequested,
  OnUserRegistered,
  OnUserTermsAccepted,
  OnUserCreated,
];
