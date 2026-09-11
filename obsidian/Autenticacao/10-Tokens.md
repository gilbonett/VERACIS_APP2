---
title: Tokens - Plataforma de Identidade
tags:
  - identity
  - auth
  - tokens
  - jwt
  - oauth
aliases:
  - Tokens IAM
  - JWT
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Tokens

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Avaliação das Opções

| Opção | Força | Fraqueza | Veredito |
|---|---|---|---|
| **Token opaco server-side** (atual ✅) | Revogação instantânea (delete da linha); zero superfície de parsing; sem segredo distribuído | Consulta ao store a cada validação (mitigável com cache); não é portátil para federação | ✅ **Permanece o mecanismo primário do cliente web** (BFF — ADR-001/008) |
| **JWT (JOSE)** | Autocontido, validação local via JWKS, interoperabilidade universal (GOV.BR fala JWT; OIDC exige) | Revogação antes do `exp` requer denylist; classe conhecida de erros de implementação (mitigada por RFC 8725) | ✅ **Escolhido para a camada federada** (fase 7) — access token JWT (perfil RFC 9068) |
| **Reference token + Introspection** (RFC 7662) | Revogação central; RS sem acesso a chaves | Round-trip por validação; acopla RS à disponibilidade do AS | 🟡 Alternativa por RS: oferecer introspection para RS de terceiros que não devam validar localmente |
| **PASETO** | Elimina por design os erros clássicos de JOSE (`alg` confusion) | **Sem interoperabilidade OIDC/OAuth** — GOV.BR, SCPA, qualquer RP/OP padrão falam JWT; ecossistema/tooling menores; auditores de gov conhecem JOSE | ❌ Rejeitado — para plataforma cuja razão de ser é federação por padrões abertos (ePING), abrir mão de interoperabilidade para evitar erros que o RFC 8725 já mitiga é troca ruim |
| **Macaroons** | Atenuação de escopo elegante | Sem história de federação, tooling mínimo | ❌ Rejeitado |

**Síntese (ADR-008)**: arquitetura em duas camadas — **sessão opaca para o cliente web (hoje e sempre)**; **JWT ES256 + refresh opaco rotacionado para a camada OAuth/OIDC (fase 7)**, apenas quando existir consumidor real (mobile nativo, M2M, RP federado).

## 2. Claims do Access Token (perfil RFC 9068)

| Claim | Finalidade |
|---|---|
| `iss` | AS emissor — RS valida origem (crítico com múltiplos IdPs) |
| `sub` | userId — **nunca** CPF/e-mail (minimização LGPD) |
| `aud` | RS de destino — token da API pública não vale em serviço interno |
| `exp` / `iat` | Vida curta: 5–15 min | 
| `jti` | Denylist pontual (revogação de token específico) |
| `sessionId` | Vínculo com a sessão local — revogar a sessão revoga a família inteira de tokens |
| `roles` | Papel hierárquico no momento da emissão (camada 1 de [[09-Autorizacao]]) |
| `permissions` | Só quando o catálogo (camada 3) estiver ativo e o RS precisar |
| `provider` + `acr` | Origem da autenticação e nível de garantia — política de step-up no RS |
| `tenant` | Reservado; hoje não aplicável |

## 3. Regras RFC 8725 (JWT BCP) — obrigatórias na implementação

1. Allowlist explícita de algoritmo (`ES256`; `RS256` só para interop que o exija) — **nunca** aceitar o `alg` do header cegamente; `none` rejeitado sempre.
2. Validar `iss`, `aud`, `exp`, `nbf` em todo RS — sem exceção "porque é interno".
3. `kid` sempre presente; chave resolvida **apenas** via JWKS do issuer esperado.
4. Access token nunca em URL, localStorage ou cookie legível por JS — transporte só via `Authorization: Bearer` server-side ou BFF.

## 4. Assinatura: ES256

ECDSA P-256 (ES256): assinaturas menores e verificação mais rápida que RSA-2048, curva aprovada NIST — melhor default atual para AS novo. RS256 mantido como capacidade de interop (alguns RPs legados só validam RSA). **HS256 proibido** (RNF-07): segredo simétrico compartilhado com cada RS tornaria qualquer RS capaz de **emitir** tokens válidos.

## 5. JWKS e Rotação de Chaves

- Endpoint `/.well-known/jwks.json` publica as chaves públicas correntes com `kid`.
- Rotação trimestral (ou imediata em suspeita de comprometimento): nova chave passa a assinar; a anterior permanece publicada até o último token por ela assinado expirar (janela = TTL máximo do access token) — RS nunca vê token válido de chave desconhecida.
- Chave privada em AWS Secrets Manager/KMS; nunca em env de aplicação; a aplicação assina via material carregado no boot (ou delegação KMS-sign se latência aceitar).

## 6. Refresh Token: opaco, rotacionado, com família

Refresh **não é JWT** — é opaco, hash como PK (mesmo padrão de `Session` ✅), com `familyId`:

- Cada uso invalida o token e emite sucessor na mesma família.
- Reapresentação de token já usado = replay ⇒ **revoga a família inteira e a sessão vinculada** (ADR-005); evento `REFRESH_REUSE_DETECTED` na auditoria.
- Cuidado de implementação: retries de rede podem gerar falso positivo de reuso — janela de graça de poucos segundos para o token imediatamente anterior, documentada e testada, antes de tratar como comprometimento.

## 7. Revogação e Expiração — Estratégia Completa

| Artefato | Revogação |
|---|---|
| Sessão opaca | Delete da linha + invalidação síncrona do cache — imediata ✅/🎯 |
| Refresh token | Delete/flag da família — imediata |
| Access token JWT | Vida curta é a defesa primária; denylist de `jti` em Redis (TTL = `exp` restante) para revogação de emergência; revogar a sessão corta a renovação em ≤15 min de qualquer forma |
| Endpoint RFC 7009 (`/oauth/revoke`) | Exposto na fase 7 para clientes revogarem seus próprios tokens |

## Ver também

- [[README]] — índice
- [[11-Sessoes]] — a camada primária
- [[07-Fluxos]] §3-5
- [[17-ADR]] — ADR-001, ADR-005, ADR-008
