import { createZodDto } from "nestjs-zod";
import z from "zod";

const statusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED", "CLOSED"]);
const typeEnum = z.enum(["LIKE", "DISLIKE"]);

const eventSchema = z.object({
  eventId: z.uuid(),
  eventName: z.string(),
  eventIcon: z.string().nullish(),
  categoryId: z.uuid(),
  categoryName: z.string(),
  categoryIcon: z.string().nullish(),
});

const attachmentSchema = z.object({
  url: z.string().nullish(),
});

const commentSchema = z.object({
  commentId: z.uuid(),
  content: z.string(),
  createdAt: z.iso.datetime(),
  authorId: z.uuid(),
  authorName: z.string(),
});

export class QueryAlertDto extends createZodDto(
  z.object({
    status: z.array(statusEnum).default(["PENDING", "ACCEPTED"]),
    communityId: z.uuid().optional(),
  }),
) {}

export class AlertDetailsDto extends createZodDto(
  z.object({
    id: z.uuid(),
    status: statusEnum,
    description: z.string().nullish(),
    lat: z.number(),
    lng: z.number(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),

    authorId: z.uuid(),
    authorName: z.string(),

    communityId: z.uuid(),
    communityName: z.string(),

    reactions: z.record(typeEnum, z.number()),

    currentUserReaction: typeEnum.nullish(),
    commentsCount: z.number(),
    comments: z.array(commentSchema),

    events: z.array(eventSchema),
    attachments: z.array(attachmentSchema),
  }),
) {}
