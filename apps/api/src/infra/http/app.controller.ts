import { Controller, Get, Header } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { EnvService } from "../env/env.service";
import { SWAGGER_TAGS } from "../swagger/swagger-tags";
import { Public } from "./decorators/public.decorator";

@ApiTags(SWAGGER_TAGS.WELCOME)
@Controller()
export class AppController {
  constructor(private readonly env: EnvService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: "Retorna informações sobre a API",
    description:
      "Retorna informações sobre a API, incluindo a mensagem de boas-vindas, a versão da API e o link para a documentação.",
  })
  root() {
    const API_URL = this.env.get("API_URL");

    return {
      message: "VERACIS API is running!",
      version: "1.0.0",
      docs: `${API_URL}/docs`,
    };
  }

  @Public()
  @Get("robots.txt")
  @Header("Content-Type", "text/plain")
  robots(): string {
    return "User-agent: *\nDisallow: /";
  }
}
