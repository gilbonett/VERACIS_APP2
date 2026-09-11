import { Repository } from "@/core/repositories/repository";
import { Attachment } from "../entities/attachment";

export abstract class AttachmentRepository extends Repository<Attachment> {}
