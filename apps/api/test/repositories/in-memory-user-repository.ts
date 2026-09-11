import { Transaction } from "@/core/repositories/transaction";
import { User } from "@/domain/identity/entities/user";
import { UserRepository } from "@/domain/identity/repositories/user-repository";

export class InMemoryUserRepository extends UserRepository {
  public items: User[] = [];

  async findUniqueByCpf(cpf: string): Promise<User | null> {
    const user = this.items.find((user) => user.cpf.toValue() === cpf);
    return user ?? null;
  }

  async findUniqueByEmail(email: string): Promise<User | null> {
    const user = this.items.find((user) => user.email.toValue() === email);
    return user ?? null;
  }

  async findByCpfOrEmailOrPhone(
    cpf: string,
    email: string,
    phone: string,
  ): Promise<User | null> {
    const user = this.items.find(
      (user) =>
        user.cpf.toValue() === cpf ||
        user.email.toValue() === email ||
        user.phone.toValue() === phone,
    );

    return user ?? null;
  }

  async create(entity: User, tx?: Transaction): Promise<void> {
    this.items.push(entity);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.items.find((user) => user.id.toValue() === id);

    return user ?? null;
  }

  async findAll(): Promise<User[]> {
    return this.items;
  }

  async save(entity: User): Promise<void> {
    const index = this.items.findIndex(
      (user) => user.id.toValue() === entity.id.toValue(),
    );
    if (index !== -1) {
      this.items[index] = entity;
    } else {
      this.items.push(entity);
    }
  }

  async delete(entity: User): Promise<void> {
    const index = this.items.findIndex(
      (user) => user.id.toValue() === entity.id.toValue(),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
