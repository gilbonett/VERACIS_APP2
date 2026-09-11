import { Risk } from "../entities/risk";

export abstract class RiskRepository {
  abstract findMany(): Promise<Risk[]>;
  abstract findBySlug(slug: string): Promise<Risk | null>;
  abstract create(props: Risk): Promise<void>;
}
