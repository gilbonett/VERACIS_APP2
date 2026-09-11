import { Transaction } from "./transaction";

export abstract class UnitOfWork {
  abstract run<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
}
