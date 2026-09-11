import { UserRole } from "@/domain/users/entities/user";
import { AlertStatus } from "../entities/alert";
import { AlertDetails } from "../read-models/alert-details";

export interface IAlertDetailsQuery {
  communityId?: string;
  currentUserId: string;
  currentUserRole: UserRole;
  status: AlertStatus[];
}

export abstract class AlertDetailsRepository {
  abstract findById(
    id: string,
    currentUserId?: string,
  ): Promise<AlertDetails | null>;
  abstract findMany(query: IAlertDetailsQuery): Promise<AlertDetails[]>;
  abstract findManyByGeometry(
    lat: number,
    lng: number,
  ): Promise<AlertDetails[]>;
}
