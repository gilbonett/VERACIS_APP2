import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { makeTwoFactor } from "../../../../test/factories/make-two-factor";
import { InMemoryTwoFactorRepository } from "../../../../test/repositories/in-memory-two-factor-repository";
import { RevokeTwoFactorOnContactChangeUseCase } from "./revoke-two-factor-on-contact-change-use-case";

let sut: RevokeTwoFactorOnContactChangeUseCase;
let inMemoryTwoFactorRepository: InMemoryTwoFactorRepository;

describe("Revoke Two Factor On Contact Change Use Case", () => {
  beforeEach(() => {
    inMemoryTwoFactorRepository = new InMemoryTwoFactorRepository();
    sut = new RevokeTwoFactorOnContactChangeUseCase(inMemoryTwoFactorRepository);
  });

  it("should do nothing when the user has no two factor of the given type", async () => {
    const saveSpy = vi.spyOn(inMemoryTwoFactorRepository, "save");
    const userId = new UniqueEntityID();

    await sut.execute({ userId: userId.toString(), type: "EMAIL" });

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it("should revoke an ENABLED two factor", async () => {
    const userId = new UniqueEntityID();
    const twoFactor = makeTwoFactor({ userId, type: "EMAIL", status: "ENABLED" });
    inMemoryTwoFactorRepository.items.push(twoFactor);

    await sut.execute({ userId: userId.toString(), type: "EMAIL" });

    expect(inMemoryTwoFactorRepository.items[0].status).toBe("REVOKED");
  });

  it("should revoke a PENDING two factor whose enrollment was never confirmed", async () => {
    const userId = new UniqueEntityID();
    const twoFactor = makeTwoFactor({ userId, type: "SMS", status: "PENDING" });
    inMemoryTwoFactorRepository.items.push(twoFactor);

    await sut.execute({ userId: userId.toString(), type: "SMS" });

    expect(inMemoryTwoFactorRepository.items[0].status).toBe("REVOKED");
  });

  it("should do nothing when the two factor is already DISABLED", async () => {
    const userId = new UniqueEntityID();
    const twoFactor = makeTwoFactor({ userId, type: "EMAIL", status: "DISABLED" });
    inMemoryTwoFactorRepository.items.push(twoFactor);
    const saveSpy = vi.spyOn(inMemoryTwoFactorRepository, "save");

    await sut.execute({ userId: userId.toString(), type: "EMAIL" });

    expect(saveSpy).not.toHaveBeenCalled();
    expect(inMemoryTwoFactorRepository.items[0].status).toBe("DISABLED");
  });

  it("should do nothing when the two factor is already REVOKED", async () => {
    const userId = new UniqueEntityID();
    const twoFactor = makeTwoFactor({ userId, type: "EMAIL", status: "REVOKED" });
    inMemoryTwoFactorRepository.items.push(twoFactor);
    const saveSpy = vi.spyOn(inMemoryTwoFactorRepository, "save");

    await sut.execute({ userId: userId.toString(), type: "EMAIL" });

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
