import { Transaction } from "@/core/repositories/transaction";
import { AlertAttachment } from "../entities/alert-attachment";

export abstract class AlertAttachmentsRepository {
  abstract createMany(
    attachments: AlertAttachment[],
    tx?: Transaction,
  ): Promise<void>;
  abstract deleteMany(
    attachments: AlertAttachment[],
    tx?: Transaction,
  ): Promise<void>;
}
