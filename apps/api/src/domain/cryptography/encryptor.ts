export abstract class Encryptor {
  abstract encrypt(value: string): Promise<string>;
  abstract decrypt(value: string): Promise<string>;
}
