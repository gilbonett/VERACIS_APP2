/** Membro coringa cujo único "Sim" (LIKE) confirma o alerta imediatamente. */
export const SINGLE_CLICK_LIKE_CONFIRMS_ALERT_USER_IDS = new Set([
  "a1b2c3d4-0006-4000-8000-000000000006", 
]);

export function memberSingleClickLikeConfirmsAlert(userId: string): boolean {
  return SINGLE_CLICK_LIKE_CONFIRMS_ALERT_USER_IDS.has(userId);
}
