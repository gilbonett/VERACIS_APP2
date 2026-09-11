import { Membership } from "@/domain/users/entities/membership";
import { User } from "@/domain/users/entities/user";

export class MembershipPresenter {
  static toHTTP(membership: Membership) {
    return {
      communityId: membership.communityId.toString(),
      communityName: membership.communityName,
      biomeName: membership.biomeName,
    };
  }
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

export class UserPresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      lastedLat: user.lastedLat,
      lastedLng: user.lastedLng,
      birthDate: user.birthDate,
      avatarUrl: user.avatarUrl,
      mapTutorialCompletedAt: toIsoString(user.mapTutorialCompletedAt),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      communities: user.communities.getItems().map(MembershipPresenter.toHTTP),
    };
  }
}
