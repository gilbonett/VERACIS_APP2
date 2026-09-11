import { COMMUNITIES } from "./communities";
import { USERS } from "./users";

export const MEMBERSHIPS = [
  { userId: USERS.ROOT.id, communityId: COMMUNITIES.AMAZINICO_MANOA.id },
  { userId: USERS.ROOT.id, communityId: COMMUNITIES.AMAZONICO_CRISTAL.id },
  {
    userId: USERS.LEADER_AMAZONIA.id,
    communityId: COMMUNITIES.AMAZINICO_MANOA.id,
  },
  {
    userId: USERS.MEMBER_2.id,
    communityId: COMMUNITIES.AMAZINICO_MANOA.id,
  },
  {
    userId: USERS.MEMBER_3.id,
    communityId: COMMUNITIES.AMAZINICO_MANOA.id,
  },
  {
    userId: USERS.LEADER_CERRADO.id,
    communityId: COMMUNITIES.AMAZONICO_CRISTAL.id,
  },
  { userId: USERS.MEMBER_1.id, communityId: COMMUNITIES.AMAZONICO_CRISTAL.id },
];
