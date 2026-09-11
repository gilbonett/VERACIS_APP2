import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class S3ExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(S3ExceptionFilter.name);

  catch(exception: Record<string, string>, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.name === "NoSuchKey" || exception.Code === "NoSuchKey") {
      this.logger.warn(`File not found: ${exception.message}`);
      return response.status(404).json({
        statusCode: 404,
        message: "File not found",
      });
    }

    if (
      exception.name === "AccessDenied" ||
      exception.Code === "AccessDenied"
    ) {
      this.logger.error(`Access denied: ${exception.message}`);
      return response.status(403).json({
        statusCode: 403,
        message: "Access denied",
      });
    }

    this.logger.error("Unexpected error serving file", exception);

    return response.status(500).json({
      statusCode: 500,
      message: "Internal server error",
    });
  }
}
