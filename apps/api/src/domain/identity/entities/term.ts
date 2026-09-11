import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type TermsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface TermProps {
  version: Date;
  title: string;
  content: string;
  status: TermsStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Term extends Entity<TermProps> {
  get version() {
    return this.props.version;
  }

  get title() {
    return this.props.title;
  }

  get content() {
    return this.props.content;
  }

  get status() {
    return this.props.status;
  }

  get publishedAt() {
    return this.props.publishedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  publish() {
    this.props.status = "PUBLISHED";
    this.props.publishedAt = new Date();
    this.touch();
  }

  archive(): void {
    this.props.status = "ARCHIVED";
    this.touch();
  }

  updateContent(title: string, content: string) {
    if (this.props.status === "PUBLISHED") {
      throw new Error("Cannot edit published terms");
    }

    this.props.title = title;
    this.props.content = content;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    {
      version,
      title,
      content,
    }: Pick<TermProps, "version" | "title" | "content">,
    id?: UniqueEntityID,
  ): Term {
    const now = new Date();

    return new Term(
      {
        version,
        title,
        content,
        status: "DRAFT",
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  static reconstitute(props: TermProps, id: UniqueEntityID): Term {
    return new Term(props, id);
  }
}
