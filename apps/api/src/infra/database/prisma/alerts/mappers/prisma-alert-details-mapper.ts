import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { AlertDetails } from "@/domain/alerts/read-models/alert-details";
import { IAlertDetailsQuery } from "@/domain/alerts/repositories/alert-details-repository";
import { Prisma } from "@generated/client";

const include = {
  author: true,
  community: true,
  comments: {
    include: {
      author: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  reactions: true,
  events: {
    include: {
      event: {
        include: {
          category: true,
        },
      },
    },
  },
  attachments: true,
} satisfies Prisma.AlertInclude;

type PrismaAlertDetails = Prisma.AlertGetPayload<{
  include: typeof include;
}>;

export class PrismaAlertDetailsMapper {
  static readonly include = include;

  static toWhere(query: IAlertDetailsQuery): Prisma.AlertWhereInput {
    const where: Prisma.AlertWhereInput = {};

    where.status = { in: query.status };

    if (query.communityId) where.communityId = query.communityId;

    return where;
  }

  static toDomain(
    raw: PrismaAlertDetails,
    currentUserId?: string,
  ): AlertDetails {
    const reactions = raw.reactions.reduce(
      (acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] ?? 0) + 1;
        return acc;
      },
      { LIKE: 0, DISLIKE: 0 } as Record<"LIKE" | "DISLIKE", number>,
    );

    const currentUserReaction = currentUserId
      ? (raw.reactions.find((r) => r.authorId === currentUserId)?.type ?? null)
      : null;

    return AlertDetails.create({
      alertId: new UniqueEntityID(raw.id),
      status: raw.status,
      description: raw.description,
      lat: raw.lat,
      lng: raw.lng,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,

      authorId: new UniqueEntityID(raw.authorId),
      authorName: raw.author.name,

      communityId: new UniqueEntityID(raw.communityId),
      communityName: raw.community.name,

      reactions,
      currentUserReaction,
      commentsCount: raw.comments.length,
      comments: raw.comments.map((comment) => ({
        commentId: new UniqueEntityID(comment.id),
        content: comment.content,
        createdAt: comment.createdAt,
        authorId: new UniqueEntityID(comment.authorId),
        authorName: comment.author.name,
      })),

      events: raw.events.map(({ event }) => ({
        eventId: new UniqueEntityID(event.id),
        eventName: event.name,
        eventIcon: event.icon,
        categoryId: new UniqueEntityID(event.category.id),
        categoryName: event.category.name,
        categoryIcon: event.category.icon,
      })),

      attachments: raw.attachments.map((attachment) => ({
        url: attachment.url,
      })),
    });
  }
}
