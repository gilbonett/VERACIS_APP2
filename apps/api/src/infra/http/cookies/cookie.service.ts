import { Request, Response } from "express";
import { CookieOptions, DEFAULT_COOKIE_OPTIONS } from "./cookie-options";

export class CookiesService {
  /**
   * Define um cookie na resposta HTTP.
   * Sempre aplica as opções padrão de segurança (httpOnly, secure, sameSite)
   * antes de mesclar com as opções personalizadas.
   */
  static set(
    response: Response,
    name: string,
    value: string,
    options?: CookieOptions,
  ): void {
    const mergedOptions: CookieOptions = {
      ...DEFAULT_COOKIE_OPTIONS,
      ...options,
    };

    response.cookie(name, value, mergedOptions);
  }

  /**
   * Busca o valor de um cookie da requisição.
   */
  static get(request: Request, name: string): string | undefined {
    return request.cookies?.[name];
  }

  /**
   * Remove um cookie da resposta HTTP.
   *
   * IMPORTANTE: As opções de segurança (httpOnly, secure, sameSite, path)
   * devem ser IDÊNTICAS às usadas no momento do `set`. Caso contrário,
   * navegadores modernos ignoram o clearCookie e o cookie permanece ativo.
   */
  static delete(
    response: Response,
    name: string,
    options?: Pick<CookieOptions, "path" | "domain">,
  ): void {
    response.clearCookie(name, {
      httpOnly: DEFAULT_COOKIE_OPTIONS.httpOnly,
      secure: DEFAULT_COOKIE_OPTIONS.secure,
      sameSite: DEFAULT_COOKIE_OPTIONS.sameSite,
      path: options?.path ?? DEFAULT_COOKIE_OPTIONS.path ?? "/",
      domain: options?.domain,
    });
  }

  /**
   * Define múltiplos cookies de uma vez.
   */
  static setMultiple(
    response: Response,
    cookies: Array<{ name: string; value: string; options?: CookieOptions }>,
  ): void {
    for (const { name, value, options } of cookies) {
      CookiesService.set(response, name, value, options);
    }
  }

  /**
   * Remove múltiplos cookies de uma vez.
   * Todos os cookies são removidos com as mesmas opções de path/domain.
   */
  static deleteMultiple(
    response: Response,
    names: string[],
    options?: Pick<CookieOptions, "path" | "domain">,
  ): void {
    for (const name of names) {
      CookiesService.delete(response, name, options);
    }
  }
}
