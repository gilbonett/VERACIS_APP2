import { Repository } from "@/core/repositories/repository";
import { AlertComment } from "../entities/alert-comment";

export abstract class AlertCommentRepository extends Repository<AlertComment> {}
