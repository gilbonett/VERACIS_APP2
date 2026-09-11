import { Either, left, right } from "@/core/either";
import { Coordinate } from "@/domain/value-objects/coordinate";
import { CoordinateInvalidError } from "@/domain/value-objects/errors/coordinate-invalid-error";
import { Injectable } from "@nestjs/common";
import { AlertDetails } from "../read-models/alert-details";
import { AlertDetailsRepository } from "../repositories/alert-details-repository";

type GetAlertsByGeometryUseCaseRequest = {
  lat: number;
  lng: number;
};

type GetAlertsByGeometryUseCaseResponse = Either<
  CoordinateInvalidError,
  { alerts: AlertDetails[] }
>;

@Injectable()
export class GetAlertsByGeometryUseCase {
  constructor(private alertDetailsRepository: AlertDetailsRepository) {}

  async execute({
    lat,
    lng,
  }: GetAlertsByGeometryUseCaseRequest): Promise<GetAlertsByGeometryUseCaseResponse> {
    const coordinate = Coordinate.create(lat, lng);

    if (coordinate.isLeft()) {
      return left(coordinate.value);
    }

    const alerts = await this.alertDetailsRepository.findManyByGeometry(
      coordinate.value.getLat(),
      coordinate.value.getLng(),
    );

    return right({ alerts });
  }
}
