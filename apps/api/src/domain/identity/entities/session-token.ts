import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export type SessionTokenProps = {
  version: number
  tokenHash: string
  sessionId: UniqueEntityID
  consumedAt: Date | null
  replacedByVersion: number | null
  createdAt: Date
}

export class SessionToken extends Entity<SessionTokenProps> {
  get sessionId() {
    return this.props.sessionId
  }

  get version() {
    return this.props.version
  }

  get tokenHash() {
    return this.props.tokenHash
  }

  get consumedAt() {
    return this.props.consumedAt
  }

  get replacedByVersion() {
    return this.props.replacedByVersion
  }

  get createdAt() {
    return this.props.createdAt
  }

  get isConsumed() {
    return this.props.consumedAt !== null
  }

  public consume(replacedByVersion: number, at: Date = new Date()) {
    if (this.isConsumed) {
      return
    }

    this.props.consumedAt = at
    this.props.replacedByVersion = replacedByVersion
  }

  public revoke(at: Date = new Date()) {
    if (this.isConsumed) {
      return
    }

    this.props.consumedAt = at
  }

  static create(props: SessionTokenProps, id?: UniqueEntityID) {
    return new SessionToken(props, id)
  }
}
