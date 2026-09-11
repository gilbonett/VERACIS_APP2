-- CreateFunction
CREATE OR REPLACE FUNCTION notify_outbox() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    NEW.event_name,
    (NEW.payload::jsonb || jsonb_build_object('outboxId', NEW.id))::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
CREATE TRIGGER outbox_notify
AFTER INSERT ON "outbox"
FOR EACH ROW EXECUTE FUNCTION notify_outbox();
