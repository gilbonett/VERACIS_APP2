import { Repository } from "@/core/repositories/repository";
import { Session } from "../entities/session";

export abstract class SessionRepository extends Repository<Session> {
  abstract deleteAllByUserId(userId: string): Promise<void>;
}
