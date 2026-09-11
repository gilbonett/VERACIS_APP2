import { PrismaClient } from "@generated/client";

export const TERMS = {
  V1: {
    id: "895994ec-28d5-4e95-b136-bc6278ca3b70",
    version: new Date(),
    title: "Terms of Service",
    content: "Test of Service",
    publishedAt: new Date(),
  },
};

export async function seedTerms(prisma: PrismaClient) {
  const termsToSeed = Object.values(TERMS);

  await Promise.all(
    termsToSeed.map((term) =>
      prisma.terms.upsert({
        where: { id: term.id },
        update: {},
        create: {
          id: term.id,
          version: term.version,
          title: term.title,
          content: term.content,
          status: "PUBLISHED",
          publishedAt: term.publishedAt,
        },
      }),
    ),
  );
}
