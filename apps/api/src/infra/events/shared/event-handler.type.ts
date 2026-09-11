export type EventHandler = (
  event: { payload: unknown },
  outboxId: string,
) => unknown;
