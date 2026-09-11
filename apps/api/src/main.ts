import { sdk } from "./instrumentation";

import { EnvService } from "@/infra/env/env.service";
import helmet from "helmet";

import { StandardSchemaValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import type { Request, Response } from "express";
import { Logger } from "nestjs-pino";
import { join } from "node:path";

import { AppModule } from "./infra/app.module";
import { buildSwaggerDocument } from "./infra/swagger/build-swagger-document";
import { createScalarMiddleware } from "./infra/swagger/create-scalar-middleware";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    snapshot: true,
  });

  app.useGlobalPipes(new StandardSchemaValidationPipe());

  // Nonce por request: libera só o script do Scalar (CDN pinada + bootstrap
  // inline) em /docs, sem 'unsafe-inline' e sem afetar CSP das demais rotas.
  // app.use((_req: Request, res: Response, next: NextFunction) => {
  //   res.locals.cspNonce = randomBytes(16).toString("base64");
  //   next();
  // });

  // app.use(helmet());
  // Route 53 → ALB → ECS: one trusted hop (the ALB).
  // trust proxy = true would accept any X-Forwarded-For unconditionally,
  // enabling IP spoofing for rate-limit bypass.
  app.set("trust proxy", 1);

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.getHttpAdapter().getInstance().set("json spaces", 2);
  app.use(cookieParser());

  const env = app.get(EnvService);

  const ORIGIN_DOMAIN = env.get("ORIGIN_DOMAIN");

  app.enableCors({
    origin: ORIGIN_DOMAIN,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Device-Name",
    ],
  });

  const document = buildSwaggerDocument(app);

  app.useStaticAssets(join(__dirname, "..", "..", "templates"), {
    prefix: "/static",
  });

  SwaggerModule.setup("docs/json", app, document);
  app.use("/docs", (req: Request, res: Response) =>
    createScalarMiddleware(document, res.locals.cspNonce)(req, res),
  );

  app.use(helmet());

  const port = env.get("PORT");
  await app.listen(port);

  logger.log(`🔥 HTTP server is running on http://localhost:${port}`);
  logger.log(`📙 Docs available at http://localhost:${port}/docs`);

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, shutting down gracefully...`);

    try {
      await app.close();
      logger.log("NestJS application closed");

      await sdk.shutdown();
      logger.log("OpenTelemetry SDK shutdown complete");
    } catch (err) {
      logger.error("Error during shutdown", err);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
bootstrap();
