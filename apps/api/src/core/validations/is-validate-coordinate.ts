export class IsValidateCoordinate {
  static validate(lat: number, lng: number): boolean {
    if (lat < -90 || lat > 90) {
      return false
    }

    if (lng < -180 || lng > 180) {
      return false
    }

    return true
  }
}
