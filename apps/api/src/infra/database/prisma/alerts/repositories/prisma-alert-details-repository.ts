import { AlertDetails } from "@/domain/alerts/read-models/alert-details";
import {
  AlertDetailsRepository,
  IAlertDetailsQuery,
} from "@/domain/alerts/repositories/alert-details-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaAlertDetailsMapper } from "../mappers/prisma-alert-details-mapper";

@Injectable()
export default class PrismaAlertDetailsRepository implements AlertDetailsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByGeometry(lat: number, lng: number): Promise<AlertDetails[]> {
    const RADIUS_KM = 10;
    const LAT_DELTA = RADIUS_KM / 111.0;
    const LNG_DELTA = RADIUS_KM / (111.0 * Math.cos((lat * Math.PI) / 180));

    const alertIds = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT
          id
        FROM
          alerts
        WHERE
          status IN ('PENDING', 'ACCEPTED')
          AND lat BETWEEN ${lat - LAT_DELTA} AND ${lat + LAT_DELTA}
          AND lng BETWEEN ${lng - LNG_DELTA} AND ${lng + LNG_DELTA}
          AND (6371 * acos(
                cos(radians(${lat})) * cos(radians(lat)) *
                cos(radians(lng) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(lat))
              )) <= ${RADIUS_KM}
        LIMIT 100
      `;

    const ids = alertIds.map((alert) => alert.id);

    const results = await this.prisma.alert.findMany({
      where: { id: { in: ids } },
      include: PrismaAlertDetailsMapper.include,
    });

    return results.map((result) => PrismaAlertDetailsMapper.toDomain(result));
  }

  async findById(
    id: string,
    currentUserId?: string,
  ): Promise<AlertDetails | null> {
    const result = await this.prisma.alert.findUnique({
      where: { id },
      include: PrismaAlertDetailsMapper.include,
    });

    if (!result) return null;

    return PrismaAlertDetailsMapper.toDomain(result, currentUserId);
  }
  async findMany(query: IAlertDetailsQuery): Promise<AlertDetails[]> {
    const results = await this.prisma.alert.findMany({
      where: PrismaAlertDetailsMapper.toWhere(query),
      include: PrismaAlertDetailsMapper.include,
    });

    return results.map((result) =>
      PrismaAlertDetailsMapper.toDomain(result, query.currentUserId),
    );
  }
}
