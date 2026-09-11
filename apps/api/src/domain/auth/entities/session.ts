import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const UPDATE_AGE_MS = 24 * 60 * 60 * 1000;

export interface SessionProps {
  userId: UniqueEntityID;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export class Session extends AggregateRoot<SessionProps> {
  get userId() {
    return this.props.userId;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get userAgent() {
    return this.props.userAgent;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get isExpired() {
    return this.props.expiresAt < new Date();
  }

  /**
   * Renews the session's expiration time.
   */
  renewExpiresAt() {
    this.props.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    this.touch();
  }

  /**
   * Renews the session's expiration time if it is close to expiring.
   * @returns `true` if the session was renewed, `false` otherwise.
   */
  renewIfNeeded(): boolean {
    const threshold = new Date(
      this.props.expiresAt.getTime() - SESSION_TTL_MS + UPDATE_AGE_MS,
    );
    if (threshold <= new Date()) {
      this.renewExpiresAt();
      return true;
    }
    return false;
  }

  /**
   * Updates the session's `updatedAt` timestamp.
   */
  private touch() {
    this.props.updatedAt = new Date();
  }

  /**
   * Creates a new session with the given properties and a new ID.
   */
  static create(
    props: Omit<SessionProps, "expiresAt" | "createdAt" | "updatedAt">,
    id: UniqueEntityID,
  ): Session {
    const now = new Date();
    return new Session(
      {
        ...props,
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  /**
   * Reconstitutes a session from its properties and ID.
   */
  static reconstitute(props: SessionProps, id: UniqueEntityID): Session {
    return new Session(props, id);
  }
}
