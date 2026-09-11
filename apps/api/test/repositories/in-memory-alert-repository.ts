import { Alert, AlertStatus } from "@/domain/alerts/entities/alert";
import { AlertRepository } from "@/domain/alerts/repositories/alert-repository";

export class InMemoryAlertRepository implements AlertRepository {
  public items: Alert[] = [];

  async updateStatus(alertId: string, status: AlertStatus): Promise<void> {
    const alert = this.items.find((item) => item.id.toString() === alertId);

    if (alert && status === "ACCEPTED") {
      alert.doAccept();
    } else if (alert && status === "REJECTED") {
      alert.doReject();
    } else if (alert && status === "CLOSED") {
      alert.doClose();
    }
  }

  async create(alert: Alert): Promise<void> {
    this.items.push(alert);
  }

  async findById(id: string): Promise<Alert | null> {
    const alert = this.items.find((item) => item.id.toString() === id);

    if (!alert) return null;

    return alert;
  }

  async findAll(): Promise<Alert[]> {
    return this.items;
  }

  async save(entity: Alert): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === entity.id.toString(),
    );

    if (index !== -1) {
      this.items[index] = entity;
    } else {
      this.items.push(entity);
    }
  }

  async delete(entity: Alert): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === entity.id.toString(),
    );

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
