export const QUEUE_NAMES = {
  AUTH: "auth-mail",
  AUTH_DLQ: "auth-mail-dlq",
  ALERT: "alert",
  ALERT_DLQ: "alert-dlq",
  NOTIFICATION: "notification",
  NOTIFICATION_DLQ: "notification-dlq",
} as const;

export const JOB_NAMES = {
  SEND_WELCOME: "send-welcome",
  SEND_OTP_CODE: "send-otp-code",
  SEND_PASSWORD_RESET: "send-password-reset",
  EXPIRE_PENDING_ALERT: "expire-pending-alert",
  EXPIRE_ACCEPTED_ALERT: "expire-accepted-alert",
  NOTIFY_MEMBERS_BY_ALERT: "notify-members-by-alert",
  NOTIFY_MEMBERS_BY_USER: "notify-members-by-user",
} as const;
