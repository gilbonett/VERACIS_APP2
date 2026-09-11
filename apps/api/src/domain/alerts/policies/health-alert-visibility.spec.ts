import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserRole } from "@/domain/users/entities/user";
import { expect, test } from "vitest";
import { AlertDetails } from "../read-models/alert-details";
import {
  canViewHealthAlert,
  filterAlertsByHealthVisibility,
  HEALTH_ALERT_CATEGORY_ID,
} from "./health-alert-visibility";

function makeAlert(overrides: {
  authorId?: string;
  categoryId?: string;
}): AlertDetails {
  const categoryId =
    overrides.categoryId ?? HEALTH_ALERT_CATEGORY_ID;

  return AlertDetails.create({
    alertId: new UniqueEntityID(),
    status: "PENDING",
    lat: -3.1,
    lng: -60.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: new UniqueEntityID(overrides.authorId ?? "author-1"),
    authorName: "Autor",
    communityId: new UniqueEntityID(),
    communityName: "Comunidade",
    reactions: { LIKE: 0, DISLIKE: 0 },
    commentsCount: 0,
    comments: [],
    events: [
      {
        eventId: new UniqueEntityID(),
        eventName: "Febre",
        categoryId: new UniqueEntityID(categoryId),
        categoryName: "Saúde",
      },
    ],
    attachments: [],
  });
}

test("membro vê o próprio alerta de saúde", () => {
  const alert = makeAlert({ authorId: "user-1" });

  expect(
    canViewHealthAlert({
      alert,
      currentUserId: "user-1",
      currentUserRole: "MEMBER",
    }),
  ).toBe(true);
});

test("membro não vê alerta de saúde de outro usuário", () => {
  const alert = makeAlert({ authorId: "other-user" });

  expect(
    canViewHealthAlert({
      alert,
      currentUserId: "user-1",
      currentUserRole: "MEMBER",
    }),
  ).toBe(false);
});

test("líder vê alerta de saúde de outro usuário", () => {
  const alert = makeAlert({ authorId: "other-user" });

  expect(
    canViewHealthAlert({
      alert,
      currentUserId: "leader-1",
      currentUserRole: "LEADER",
    }),
  ).toBe(true);
});

test("alertas de outras categorias permanecem visíveis para membros", () => {
  const alert = makeAlert({
    authorId: "other-user",
    categoryId: "b1b2c3d4-0001-4000-8000-000000000001",
  });

  expect(
    canViewHealthAlert({
      alert,
      currentUserId: "user-1",
      currentUserRole: "MEMBER",
    }),
  ).toBe(true);
});

test("filterAlertsByHealthVisibility remove alertas de saúde não autorizados", () => {
  const own = makeAlert({ authorId: "user-1" });
  const other = makeAlert({ authorId: "other-user" });
  const climatic = makeAlert({
    authorId: "other-user",
    categoryId: "b1b2c3d4-0001-4000-8000-000000000001",
  });

  const filtered = filterAlertsByHealthVisibility(
    [own, other, climatic],
    "user-1",
    "MEMBER" satisfies UserRole,
  );

  expect(filtered).toHaveLength(2);
  expect(filtered.map((a) => a.authorId.toString())).toEqual([
    "user-1",
    "other-user",
  ]);
});
