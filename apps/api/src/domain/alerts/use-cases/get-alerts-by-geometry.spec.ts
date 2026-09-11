import { beforeEach, describe, expect, it, vi } from "vitest";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { CoordinateInvalidError } from "@/domain/value-objects/errors/coordinate-invalid-error";
import { AlertDetails } from "../read-models/alert-details";
import { AlertDetailsRepository } from "../repositories/alert-details-repository";
import { GetAlertsByGeometryUseCase } from "./get-alerts-by-geometry";

function makeAlertDetails() {
  return AlertDetails.create({
    alertId: new UniqueEntityID(),
    status: "PENDING",
    lat: -15.7942,
    lng: -47.8822,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: new UniqueEntityID(),
    authorName: "Author",
    communityId: new UniqueEntityID(),
    communityName: "Community",
    reactions: { LIKE: 0, DISLIKE: 0 },
    commentsCount: 0,
    comments: [],
    events: [],
    attachments: [],
  });
}

class StubAlertDetailsRepository implements AlertDetailsRepository {
  findById = vi.fn<AlertDetailsRepository["findById"]>();
  findMany = vi.fn<AlertDetailsRepository["findMany"]>();
  findManyByGeometry =
    vi.fn<AlertDetailsRepository["findManyByGeometry"]>();
}

let repository: StubAlertDetailsRepository;
let sut: GetAlertsByGeometryUseCase;

beforeEach(() => {
  repository = new StubAlertDetailsRepository();
  sut = new GetAlertsByGeometryUseCase(repository);
});

describe("GetAlertsByGeometryUseCase", () => {
  it("rejects an invalid coordinate without hitting the repository", async () => {
    const result = await sut.execute({ lat: 999, lng: 0 });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(CoordinateInvalidError);
    expect(repository.findManyByGeometry).not.toHaveBeenCalled();
  });

  it("queries the repository with the validated lat/lng and returns its alerts", async () => {
    const alerts = [makeAlertDetails()];
    repository.findManyByGeometry.mockResolvedValue(alerts);

    const result = await sut.execute({ lat: -15.7942, lng: -47.8822 });

    expect(repository.findManyByGeometry).toHaveBeenCalledWith(
      -15.7942,
      -47.8822,
    );
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.alerts).toBe(alerts);
    }
  });
});
