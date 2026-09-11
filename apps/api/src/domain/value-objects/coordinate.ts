import { Either, left, right } from "@/core/either";

import { CoordinateInvalidError } from "./errors/coordinate-invalid-error";

export class Coordinate {
  protected constructor(
    private readonly lat: number,
    private readonly lng: number,
  ) {}

  getLat(): number {
    return this.lat;
  }

  getLng(): number {
    return this.lng;
  }

  static validate(lat: number, lng: number): boolean {
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  static create(
    lat: number,
    lng: number,
  ): Either<CoordinateInvalidError, Coordinate> {
    if (!Coordinate.validate(lat, lng)) {
      return left(new CoordinateInvalidError(lat, lng));
    }

    return right(new Coordinate(lat, lng));
  }
}
