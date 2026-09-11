import { AlertDetails } from "@/domain/alerts/read-models/alert-details";
import { AlertDetailsDto } from "../../dtos/alerts/alert-details.dto";

export class AlertDetailsPresenter {
  static toHTTP(raw: AlertDetails): AlertDetailsDto {
    return {
      id: raw.alertId.toString(),
      status: raw.status,
      description: raw.description,
      lat: raw.lat,
      lng: raw.lng,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
      authorId: raw.authorId.toString(),
      authorName: raw.authorName,
      communityId: raw.communityId.toString(),
      communityName: raw.communityName,
      reactions: raw.reactions,
      currentUserReaction: raw.currentUserReaction,
      commentsCount: raw.commentsCount,
      comments: raw.comments.map((comment) => ({
        ...comment,
        commentId: comment.commentId.toString(),
        authorId: comment.authorId.toString(),
        createdAt: comment.createdAt.toISOString(),
      })),
      attachments: raw.attachments,
      events: raw.events.map((event) => ({
        ...event,
        eventId: event.eventId.toString(),
        categoryId: event.categoryId.toString(),
      })),
    };
  }
}
