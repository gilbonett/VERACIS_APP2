import { Transaction } from "@/core/repositories/transaction";
import { UnitOfWork } from "@/core/repositories/unit-of-work";

export class InMemoryUnitOfWorkRepository implements UnitOfWork {
  run<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    return callback({} as Transaction);
  }
}
