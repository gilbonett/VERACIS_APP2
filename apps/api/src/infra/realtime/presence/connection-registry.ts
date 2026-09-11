export abstract class ConnectionRegistry {
  abstract register(channel: string, userId: string): Promise<void>;
  abstract unregister(channel: string, userId: string): Promise<void>;
  abstract isConnected(channel: string, userId: string): Promise<boolean>;
}
