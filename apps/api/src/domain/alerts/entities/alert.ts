import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { UserRole } from "@/domain/users/entities/user";
import { AlertAcceptedEvent } from "../events/alert-accepted-event";
import { AlertCreatedEvent } from "../events/alert-created-event";
import { AlertAttachment } from "./alert-attachment";
import { AlertAttachmentList } from "./alert-attachment-list";
import { AlertEvent } from "./alert-event";
import { AlertEventList } from "./alert-event-list";
import { AlertRisk } from "./alert-risk";
import { AlertRiskList } from "./alert-risk-list";

export type AlertStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CLOSED";

export type AlertProps = {
  status: AlertStatus;
  description?: string | null;
  lat: number;
  lng: number;

  createdAt: Date;
  updatedAt: Date;

  categoryId: UniqueEntityID;
  authorId: UniqueEntityID;
  communityId: UniqueEntityID;

  attachments: AlertAttachmentList;
  events: AlertEventList;
  risks: AlertRiskList;
};

export interface CreateAlertData {
  lat: number;
  lng: number;
  description?: string | null;
  authorId: string;
  communityId: string;
  categoryId: string;
  eventIds: string[];
  riskIds: string[];
  currentUserRole: UserRole;
}

export class Alert extends AggregateRoot<AlertProps> {
  get status() {
    return this.props.status;
  }

  get description() {
    return this.props.description;
  }

  get lat() {
    return this.props.lat;
  }

  get lng() {
    return this.props.lng;
  }

  get categoryId() {
    return this.props.categoryId;
  }

  get authorId() {
    return this.props.authorId;
  }

  get communityId() {
    return this.props.communityId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get attachments() {
    return this.props.attachments;
  }

  get events() {
    return this.props.events;
  }

  get risks() {
    return this.props.risks;
  }

  get isPending() {
    return this.props.status === "PENDING";
  }

  get isAccepted() {
    return this.props.status === "ACCEPTED";
  }

  get isRejected() {
    return this.props.status === "REJECTED";
  }

  get isClosed() {
    return this.props.status === "CLOSED";
  }

  get hasEvents() {
    return this.props.events.currentItems.length > 0;
  }

  get hasAttachments() {
    return this.props.attachments.currentItems.length > 0;
  }

  get hasRisks() {
    return this.props.risks.currentItems.length > 0;
  }

  public updateStatus(status: AlertStatus) {
    if (this.props.status === status) return;

    this.props.status = status;
    this.touch();
  }

  public doAccept() {
    if (this.isAccepted) return;

    this.props.status = "ACCEPTED";
    this.touch();

    this.addDomainEvent(
      new AlertAcceptedEvent({
        alertId: this.id.toString(),
        authorId: this.authorId.toString(),
        communityId: this.communityId.toString(),
        categoryId: this.categoryId.toString(),
      }),
    );
  }

  public doReject() {
    if (this.isRejected) return;

    this.props.status = "REJECTED";
    this.touch();
  }

  public doClose() {
    if (this.isClosed) return;

    this.props.status = "CLOSED";

    // this.addDomainEvent(
    //   new AlertClosedEvent({
    //     alertId: this.id.toString(),
    //     closedAt: new Date(),
    //   }),
    // );

    this.touch();
  }

  public doAssociateEvents(eventIds: string[]) {
    const alertEvents = eventIds.map((eventId) =>
      AlertEvent.create({
        eventId: new UniqueEntityID(eventId),
        alertId: this.id,
      }),
    );

    this.props.events = new AlertEventList(alertEvents);
    this.touch();
  }

  public doAssociateRisks(riskIds: string[]) {
    const alertRisks = riskIds.map((riskId) =>
      AlertRisk.create({
        riskId: new UniqueEntityID(riskId),
        alertId: this.id,
      }),
    );

    this.props.risks = new AlertRiskList(alertRisks);
    this.touch();
  }

  public doAssociateAttachments(attachmentIds: string[]) {
    const alertAttachments = attachmentIds.map((attachmentId) =>
      AlertAttachment.create({
        attachmentId: new UniqueEntityID(attachmentId),
        alertId: this.id,
      }),
    );

    this.props.attachments = new AlertAttachmentList(alertAttachments);
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(data: CreateAlertData) {
    const now = new Date();

    const alert = new Alert({
      status: "PENDING",
      description: data.description,
      authorId: new UniqueEntityID(data.authorId),
      communityId: new UniqueEntityID(data.communityId),
      lat: data.lat,
      lng: data.lng,
      createdAt: now,
      updatedAt: now,
      categoryId: new UniqueEntityID(data.categoryId),
      attachments: new AlertAttachmentList(),
      events: new AlertEventList(),
      risks: new AlertRiskList(),
    });

    alert.doAssociateEvents(data.eventIds);

    if (data.riskIds.length > 0) {
      alert.doAssociateRisks(data.riskIds);
    }

    if (data.currentUserRole !== "MEMBER") {
      alert.doAccept();
    }

    alert.addDomainEvent(
      new AlertCreatedEvent({
        alertId: alert.id.toString(),
        authorId: alert.authorId.toString(),
        communityId: alert.communityId.toString(),
        status: alert.status,
        categoryId: alert.categoryId.toString(),
      }),
    );

    return alert;
  }

  static reconstitute(
    props: Optional<AlertProps, "attachments" | "events" | "risks">,
    id: UniqueEntityID,
  ) {
    return new Alert(
      {
        ...props,
        attachments: props.attachments ?? new AlertAttachmentList(),
        events: props.events ?? new AlertEventList(),
        risks: props.risks ?? new AlertRiskList(),
      },
      id,
    );
  }
}
