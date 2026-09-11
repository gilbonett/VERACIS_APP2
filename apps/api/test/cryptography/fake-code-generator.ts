import { CodeGenerator } from "@/domain/cryptography/code-generator";

export class FakeCodeGenerator implements CodeGenerator {
  private queue: string[] = [];

  enqueue(code: string): void {
    this.queue.push(code);
  }

  generate(): string {
    return this.queue.shift() ?? "123456";
  }
}
