import { UserRole } from "@/domain/users/entities/user";
import { AlertDetails } from "../read-models/alert-details";

export const HEALTH_ALERT_CATEGORY_ID =
  "b1b2c3d4-0004-4000-8000-000000000004";

export function isHealthAlert(alert: AlertDetails): boolean {
  return alert.events.some(
    (event) => event.categoryId.toString() === HEALTH_ALERT_CATEGORY_ID,
  );
}

type CanViewHealthAlertParams = {
  alert: AlertDetails;
  currentUserId: string;
  currentUserRole: UserRole;
};

function canViewHealthAlertByRole(
  authorId: string,
  currentUserId: string,
  currentUserRole: UserRole,
): boolean {
  if (authorId === currentUserId) {
    return true;
  }

  if (currentUserRole === "LEADER") {
    return true;
  }

  if (currentUserRole === "MANAGER" || currentUserRole === "ROOT") {
    return true;
  }

  return false;
}

export function canViewHealthAlert({
  alert,
  currentUserId,
  currentUserRole,
}: CanViewHealthAlertParams): boolean {
  if (!isHealthAlert(alert)) {
    return true;
  }

  return canViewHealthAlertByRole(
    alert.authorId.toString(),
    currentUserId,
    currentUserRole,
  );
}

export function canViewHealthAlertByCategory({
  categoryId,
  authorId,
  currentUserId,
  currentUserRole,
}: {
  categoryId: string;
  authorId: string;
  currentUserId: string;
  currentUserRole: UserRole;
}): boolean {
  if (categoryId !== HEALTH_ALERT_CATEGORY_ID) {
    return true;
  }

  return canViewHealthAlertByRole(authorId, currentUserId, currentUserRole);
}

export function filterAlertsByHealthVisibility(
  alerts: AlertDetails[],
  currentUserId: string,
  currentUserRole: UserRole,
): AlertDetails[] {
  return alerts.filter((alert) =>
    canViewHealthAlert({ alert, currentUserId, currentUserRole }),
  );
}
