import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

enum IntegrationCategoryEnum {
  STORAGE = "STORAGE",
  NOTIFICATION = "NOTIFICATION",
}

type IntegrationConfigProps = {
  category: IntegrationCategoryEnum;
  kind: string;
  providerKey: string;
  displayName: string;
  credentialsRef: string;
  config: Record<string, unknown> | null;
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date | null;
};

export class IntegrationConfig extends Entity<IntegrationConfigProps> {
  get category() {
    return this.props.category;
  }

  get kind() {
    return this.props.kind;
  }

  get providerKey() {
    return this.props.providerKey;
  }

  get displayName() {
    return this.props.displayName;
  }

  get credentialsRef() {
    return this.props.credentialsRef;
  }

  get config() {
    return this.props.config;
  }

  get enabled() {
    return this.props.enabled;
  }

  get priority() {
    return this.props.priority;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  public enable() {
    this.props.enabled = true;
    this.touch();
  }

  public disable() {
    this.props.enabled = false;
    this.touch();
  }

  public updatePriority(priority: number) {
    this.props.priority = priority;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static build(props: IntegrationConfigProps, id?: UniqueEntityID) {
    return new IntegrationConfig(props, id);
  }
}
