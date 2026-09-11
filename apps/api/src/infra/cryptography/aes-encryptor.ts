import { Encryptor } from "@/domain/cryptography/encryptor";
import { Injectable } from "@nestjs/common";
import {
  CipherGCM,
  createCipheriv,
  createDecipheriv,
  DecipherGCM,
  randomBytes,
} from "node:crypto";
import { EnvService } from "../env/env.service";

@Injectable()
export class AesEncryptor implements Encryptor {
  private readonly algorithm = "aes-256-gcm";
  private readonly key: Buffer;

  constructor(env: EnvService) {
    const key = env.get("ENCRYPTION_KEY");

    this.key = Buffer.from(key);
  }

  async encrypt(value: string): Promise<string> {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv) as CipherGCM;

    const encrypted = Buffer.concat([
      cipher.update(value, "utf-8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  }

  async decrypt(value: string): Promise<string> {
    const buffer = Buffer.from(value, "base64");

    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);

    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      iv,
    ) as DecipherGCM;

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }
}
