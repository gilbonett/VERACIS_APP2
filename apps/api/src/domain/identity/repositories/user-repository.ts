import { Repository } from "@/core/repositories/repository";
import { User } from "../entities/user";

export abstract class UserRepository extends Repository<User> {
  abstract findUniqueByCpf(cpf: string): Promise<User | null>;
  abstract findUniqueByEmail(email: string): Promise<User | null>;
  abstract findByCpfOrEmailOrPhone(
    cpf: string,
    email: string,
    phone: string,
  ): Promise<User | null>;
}
