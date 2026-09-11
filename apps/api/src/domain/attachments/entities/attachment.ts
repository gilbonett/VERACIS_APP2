import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { AttachmentRemovedEvent } from "../events/attachment-removed-event";

export type AttachmentScope = "USER" | "ALERT";

type AttachmentProps = {
  scope: AttachmentScope;
  fileName: string;
  path: string;
  fileType: string;
  fileSize: number;
  url: string;

  createdAt: Date;
  updatedAt: Date;
};

export class Attachment extends AggregateRoot<AttachmentProps> {
  get scope() {
    return this.props.scope;
  }

  get fileName() {
    return this.props.fileName;
  }

  get path() {
    return this.props.path;
  }

  get fileType() {
    return this.props.fileType;
  }

  get fileSize() {
    return this.props.fileSize;
  }

  get url() {
    return this.props.url;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  public registerAttachmentRemovedEvent() {
    const fileKey = `${this.path}/${this.fileName}`;

    this.addDomainEvent(
      new AttachmentRemovedEvent({
        attachmentId: this.id.toString(),
        fileKey,
      }),
    );
  }

  static create(
    props: Omit<AttachmentProps, "createdAt" | "updatedAt">,
    id?: UniqueEntityID,
  ) {
    const now = new Date();
    const attachment = new Attachment(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    return attachment;
  }

  static reconstitute(props: AttachmentProps, id?: UniqueEntityID) {
    const attachment = new Attachment(props, id);
    return attachment;
  }
}
