import { Repository } from "@/core/repositories/repository";
import { User } from "../entities/user";

export abstract class UserRepository extends Repository<User> {
  abstract findByCpf(cpf: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract updatePassword(userId: string, password: string): Promise<void>;
  abstract invalidateProfileCache(userId: string): Promise<void>;
}
