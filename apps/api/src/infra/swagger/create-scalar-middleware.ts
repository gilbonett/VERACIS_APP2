import "dotenv/config";

import { OpenAPIObject } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { envSchema } from "../env/env";

const env = envSchema.parse(process.env);

export function createScalarMiddleware(
  document: OpenAPIObject,
  nonce?: string,
) {
  return apiReference({
    theme: "deepSpace",
    content: document,
    // cdn: "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.62.5",
    nonce,
    favicon: "/static/favicon.ico",
    metaData: {
      title: "Veracis API — Documentação",
      description: "Documentação interativa da API Veracis",
    },
    defaultHttpClient: {
      targetKey: "node",
      clientKey: "fetch",
    },
    hideDownloadButton: false,
    hideModels: false,
    servers: [{ url: env.API_URL, description: "Production" }],
  });
}
