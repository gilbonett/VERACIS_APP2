import { AUTH_STORE_PREFIXES } from "@/application/stores/auth-store";
import { makeFederatedProviderConfig } from "../../../../test/factories/make-federated-provider-config";
import { FakeFederatedAuthorizationUrl } from "../../../../test/gateways/fake-federated-authorization-url";
import { InMemoryFederatedProviderConfigRepository } from "../../../../test/repositories/in-memory-federated-provider-config-repository";
import { FakeAuthStore } from "../../../../test/stores/fake-auth-store";
import { StartFederatedLoginUseCase } from "./start-federated-login.use-case";

let sut: StartFederatedLoginUseCase;
let inMemoryFederatedProviderConfigRepository: InMemoryFederatedProviderConfigRepository;
let fakeFederatedAuthorizationUrl: FakeFederatedAuthorizationUrl;
let fakeAuthStore: FakeAuthStore;

describe("Start Federated Login Use Case", () => {
  beforeEach(() => {
    inMemoryFederatedProviderConfigRepository =
      new InMemoryFederatedProviderConfigRepository();
    fakeFederatedAuthorizationUrl = new FakeFederatedAuthorizationUrl();
    fakeAuthStore = new FakeAuthStore();

    sut = new StartFederatedLoginUseCase(
      inMemoryFederatedProviderConfigRepository,
      fakeFederatedAuthorizationUrl,
      fakeAuthStore,
    );
  });

  it("should return an error when the provider does not exist", async () => {
    const result = await sut.execute({ slug: "missing-provider" });

    expect(result.isLeft()).toBe(true);
  });

  it("should return an error when the provider is disabled", async () => {
    const provider = makeFederatedProviderConfig({ enabled: false });
    inMemoryFederatedProviderConfigRepository.items.push(provider);

    const result = await sut.execute({ slug: provider.slug.value });

    expect(result.isLeft()).toBe(true);
  });

  describe("when the provider exists and is enabled", () => {
    let provider: ReturnType<typeof makeFederatedProviderConfig>;
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      provider = makeFederatedProviderConfig({ enabled: true });
      inMemoryFederatedProviderConfigRepository.items.push(provider);

      result = await sut.execute({ slug: provider.slug.value });
    });

    it("should return the authorization url and attempt id built by the gateway", () => {
      expect(result.isRight()).toBe(true);
      if (result.isLeft()) throw new Error("expected right");

      expect(result.value.authorizationUrl).toBe(
        fakeFederatedAuthorizationUrl.authorizationRequest.authorizationUrl,
      );
      expect(result.value.federatedAttemptId).toBe(
        fakeFederatedAuthorizationUrl.authorizationRequest.state,
      );
    });

    it("should persist the attempt scoped to the provider", async () => {
      const savedAttempt = await fakeAuthStore.consume(
        AUTH_STORE_PREFIXES.FEDERATED_ATTEMPT,
        fakeFederatedAuthorizationUrl.authorizationRequest.state,
      );
      expect(savedAttempt).toEqual({
        nonce: fakeFederatedAuthorizationUrl.authorizationRequest.nonce,
        codeVerifier:
          fakeFederatedAuthorizationUrl.authorizationRequest.codeVerifier,
        providerId: provider.id.toString(),
      });
    });
  });
});
