import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { ValueObject } from "@/core/entities/value-object";
import { AlertStatus } from "../entities/alert";

type ReactionType = "LIKE" | "DISLIKE";

type AlertAttachment = {
  url?: string | null;
};

type AlertComment = {
  commentId: UniqueEntityID;
  content: string;
  createdAt: Date;
  authorId: UniqueEntityID;
  authorName: string;
};

type AlertEvent = {
  eventId: UniqueEntityID;
  eventName: string;
  eventIcon?: string | null;
  categoryId: UniqueEntityID;
  categoryName: string;
  categoryIcon?: string | null;
};

type AlertDetailsProps = {
  alertId: UniqueEntityID;
  status: AlertStatus;
  description?: string | null;
  lat: number;
  lng: number;
  createdAt: Date;
  updatedAt: Date;

  authorId: UniqueEntityID;
  authorName: string;

  communityId: UniqueEntityID;
  communityName: string;

  reactions: Record<ReactionType, number>;
  currentUserReaction?: ReactionType | null;
  commentsCount: number;
  comments: AlertComment[];

  events: AlertEvent[];
  attachments: AlertAttachment[];
};

export class AlertDetails extends ValueObject<AlertDetailsProps> {
  get alertId() {
    return this.props.alertId;
  }
  get status() {
    return this.props.status;
  }
  get description() {
    return this.props.description;
  }
  get lat() {
    return this.props.lat;
  }
  get lng() {
    return this.props.lng;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get authorId() {
    return this.props.authorId;
  }
  get authorName() {
    return this.props.authorName;
  }

  get communityId() {
    return this.props.communityId;
  }
  get communityName() {
    return this.props.communityName;
  }

  get reactions() {
    return this.props.reactions;
  }
  get currentUserReaction() {
    return this.props.currentUserReaction;
  }
  get commentsCount() {
    return this.props.commentsCount;
  }
  get comments() {
    return this.props.comments;
  }

  get events() {
    return this.props.events;
  }
  get attachments() {
    return this.props.attachments;
  }

  static create(props: AlertDetailsProps): AlertDetails {
    return new AlertDetails(props);
  }
}
