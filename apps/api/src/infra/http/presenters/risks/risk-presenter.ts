import { Risk } from "@/domain/risks/entities/risk";

export class RiskPresenter {
  static toHTTP(props: Risk) {
    return {
      id: props.id.toString(),
      name: props.name,
      slug: props.slug,
      description: props.description,
      url: props.url,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
