import { WatchedList } from "@/core/entities/watched-list";
import { RolePermission } from "./role-permission";

export class RolePermissionList extends WatchedList<RolePermission> {
  compareItems(a: RolePermission, b: RolePermission): boolean {
    return a.permissionId.equals(b.permissionId);
  }
}
