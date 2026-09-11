import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { SWAGGER_TAGS } from "./swagger-tags";

export function buildSwaggerDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Veracis API")
    .setDescription(
      "API da plataforma Veracis — sistema de monitoramento e alertas comunitários. " +
        "Permite a gestão de comunidades, alertas ambientais, autenticação de usuários " +
        "e notificações em tempo real.",
    )
    .setVersion("1.0.0")
    .setContact(
      "Veracis Team",
      "https://veracis.com.br",
      "contato@veracis.com.br",
    )
    .setLicense("Proprietary", "https://veracis.com.br/terms")
    .addTag(SWAGGER_TAGS.WELCOME, "Informações gerais e health check da API")
    .addTag(SWAGGER_TAGS.AUTH, "Login, logout e verificação MFA")
    .addTag(SWAGGER_TAGS.USERS, "Cadastro, perfil e gestão de usuários")
    .addTag(SWAGGER_TAGS.COMMUNITIES, "Listagem e gestão de comunidades")
    .addTag(SWAGGER_TAGS.ALERTS, "Criação e gestão de alertas ambientais")
    .addTag(SWAGGER_TAGS.EVENTS, "Tipos de eventos por categoria")
    .addTag(SWAGGER_TAGS.CATEGORIES, "Categorias de eventos")
    .addTag(SWAGGER_TAGS.FILES, "Upload e download de arquivos")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  return cleanupOpenApiDoc(document);
}
