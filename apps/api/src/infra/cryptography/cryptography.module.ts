import { CodeGenerator } from '@/domain/cryptography/code-generator'
import { Encryptor } from '@/domain/cryptography/encryptor'
import { HashComparer } from '@/domain/cryptography/hash-comparer'
import { HashGenerator } from '@/domain/cryptography/hash-generator'
import { TokenOpaque } from '@/domain/cryptography/token-opaque'
import { TokenSigner } from '@/domain/cryptography/token-signer'
import { Module } from '@nestjs/common'
import { AesEncryptor } from './aes-encryptor'
import { BcryptHashService } from './bcrypt-hash.service'
import { HmacTokenOpaque } from './hmac-token-opaque'
import { JwtTokenSigner } from './jwt-token-signer'
import { RandomCodeGenerator } from './random-code-generator'

@Module({
  providers: [
    { provide: TokenOpaque, useClass: HmacTokenOpaque },
    { provide: HashGenerator, useClass: BcryptHashService },
    { provide: HashComparer, useClass: BcryptHashService },
    { provide: TokenSigner, useClass: JwtTokenSigner },
    { provide: Encryptor, useClass: AesEncryptor },
    { provide: CodeGenerator, useClass: RandomCodeGenerator },
  ],
  exports: [
    HashComparer,
    HashGenerator,
    TokenOpaque,
    TokenSigner,
    Encryptor,
    CodeGenerator,
  ],
})
export class CryptographyModule {}
