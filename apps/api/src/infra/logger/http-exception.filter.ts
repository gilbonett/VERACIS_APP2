import { HTTP_ATTRS } from "@/shared/constants/telemetry.constants";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { trace } from "@opentelemetry/api";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import type { Request, Response } from "express";
import { ZodSerializationException } from "nestjs-zod";
import { ZodError } from "zod";

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const requestId = request.id ?? request.headers["x-request-id"];
    const userId = (request as any).session?.userId ?? undefined;

    const span = trace.getActiveSpan();
    span?.setAttribute(HTTP_ATTRS.REQUEST_ID, requestId as string);

    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();
      if (zodError instanceof ZodError) {
        this.logger.error("ZodSerializationException", {
          requestId,
          ...(userId ? { userId } : {}),
          method: request.method,
          url: request.url,
          type: "ZodSerializationException",
          errors: zodError.issues,
        });
      }
      return this.sendError(response, {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Response serialization failed.",
        error: "Internal Server Error",
        timestamp: new Date().toISOString(),
        path: request.path,
        requestId: requestId as string,
      });
    }

    if (exception instanceof PrismaClientKnownRequestError) {
      this.logger.warn("PrismaClientKnownRequestError", {
        requestId,
        ...(userId ? { userId } : {}),
        method: request.method,
        url: request.url,
        code: exception.code,
        meta: exception.meta,
        message: exception.message,
      });

      if (exception.code === "P2002") {
        return this.sendError(response, {
          statusCode: HttpStatus.CONFLICT,
          message: "Conflict: duplicate record or uniqueness violation.",
          error: "Conflict",
          timestamp: new Date().toISOString(),
          path: request.path,
          requestId: requestId as string,
        });
      }

      if (exception.code === "P2003") {
        return this.sendError(response, {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            "Request validation failed: one or more referenced entities do not exist.",
          error: "Bad Request",
          timestamp: new Date().toISOString(),
          path: request.path,
          requestId: requestId as string,
        });
      }

      if (exception.code === "P2025") {
        return this.sendError(response, {
          statusCode: HttpStatus.NOT_FOUND,
          message: "Resource not found.",
          error: "Not Found",
          timestamp: new Date().toISOString(),
          path: request.path,
          requestId: requestId as string,
        });
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message =
        typeof exceptionResponse === "object" && "message" in exceptionResponse
          ? (exceptionResponse as Record<string, unknown>).message
          : exception.message;

      const errorName =
        typeof exceptionResponse === "object" && "error" in exceptionResponse
          ? String((exceptionResponse as Record<string, unknown>).error)
          : (HttpStatus[status] ?? "Error");

      this.logByStatus(status, request, requestId, userId, exception);

      return this.sendError(response, {
        statusCode: status,
        message: message as string | string[],
        error: errorName,
        timestamp: new Date().toISOString(),
        path: request.path,
        requestId: requestId as string,
      });
    }

    this.logger.error("UnhandledException", {
      requestId,
      ...(userId ? { userId } : {}),
      method: request.method,
      url: request.url,
      type: "UnhandledException",
      message:
        exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    return this.sendError(response, {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error.",
      error: "Internal Server Error",
      timestamp: new Date().toISOString(),
      path: request.path,
      requestId: requestId as string,
    });
  }

  private logByStatus(
    status: number,
    request: Request,
    requestId: unknown,
    userId: string | undefined,
    exception: HttpException,
  ): void {
    const isUnmatchedRouteNotFound =
      status === HttpStatus.NOT_FOUND &&
      /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /.test(
        exception.message,
      );

    if (isUnmatchedRouteNotFound) {
      return;
    }

    const payload = {
      requestId,
      ...(userId ? { userId } : {}),
      method: request.method,
      url: request.url,
      statusCode: status,
      message: exception.message,
    };

    if (status >= 500) {
      this.logger.error("Unexpected Error", {
        ...payload,
        stack: exception.stack,
      });
    } else {
      this.logger.warn("Unexpected Warning", payload);
    }
  }

  private sendError(response: Response, body: ErrorResponseBody) {
    return response.status(body.statusCode).json(body);
  }
}
