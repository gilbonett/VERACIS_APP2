import { CodeGenerator } from "@/domain/cryptography/code-generator";
import { Injectable } from "@nestjs/common";
import { randomInt } from "node:crypto";

const CODE_LENGTH = 6;
const MIN_VALUE = 10 ** (CODE_LENGTH - 1);
const MAX_VALUE = 10 ** CODE_LENGTH;

@Injectable()
export class RandomCodeGenerator implements CodeGenerator {
  generate(): string {
    return randomInt(MIN_VALUE, MAX_VALUE).toString();
  }
}
