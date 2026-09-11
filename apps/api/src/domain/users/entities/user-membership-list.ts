import { WatchedList } from "@/core/entities/watched-list";
import { Membership } from "./membership";

export class UserMembershipList extends WatchedList<Membership> {
  compareItems(a: Membership, b: Membership): boolean {
    return a.communityId.equals(b.communityId);
  }
}
