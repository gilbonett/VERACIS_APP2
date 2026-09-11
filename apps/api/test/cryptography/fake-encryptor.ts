import { Encryptor } from '@/domain/cryptography/encryptor'

export class FakeEncryptor implements Encryptor {
  async encrypt(value: string): Promise<string> {
    return `encrypted:${value}`
  }

  async decrypt(value: string): Promise<string> {
    return value.replace(/^encrypted:/, '')
  }
}
