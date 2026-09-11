import { DomainError } from '@/core/errors/domain-error'

export class CoordinateInvalidError extends Error implements DomainError {
  constructor(lat: number, lng: number) {
    super(`Coordenada inválida: lat=${lat}, lng=${lng}.`)
    this.name = 'CoordinateInvalid'
  }
}
