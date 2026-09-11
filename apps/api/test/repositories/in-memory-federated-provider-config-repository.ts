import { FederatedProviderConfig } from '@/domain/identity/entities/federated-provider-config'
import { FederatedProviderConfigRepository } from '@/domain/identity/repositories/federated-provider-config-repository'

export class InMemoryFederatedProviderConfigRepository extends FederatedProviderConfigRepository {
  public items: FederatedProviderConfig[] = []

  async findById(id: string): Promise<FederatedProviderConfig | null> {
    const config = this.items.find((item) => item.id.toString() === id)
    return config ?? null
  }

  async findBySlug(slug: string): Promise<FederatedProviderConfig | null> {
    const config = this.items.find((item) => item.slug.value === slug)
    return config ?? null
  }

  async findAll(): Promise<FederatedProviderConfig[]> {
    return this.items
  }

  async create(config: FederatedProviderConfig): Promise<void> {
    this.items.push(config)
  }

  async save(config: FederatedProviderConfig): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === config.id.toString(),
    )
    if (index !== -1) {
      this.items[index] = config
    } else {
      this.items.push(config)
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === id)
    if (index !== -1) {
      this.items.splice(index, 1)
    }
  }
}
