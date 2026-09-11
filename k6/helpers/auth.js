import http from 'k6/http';
import { BASE_URL } from '../config/environments.js';

/**
 * Helper de autenticação para os testes K6
 *
 * A API VERACIS usa JWT via cookies HttpOnly (access_token + refresh_token).
 * O K6 gerencia o cookie jar automaticamente via http.cookieJar().
 *
 * Usuários disponíveis no seed:
 *  - MANAGER:         CPF 46477239094  | senha: Password@123
 *  - LEADER_AMAZONIA: CPF 52998224725  | senha: Password@123
 *  - LEADER_CERRADO:  CPF 07077902071  | senha: Password@123
 *  - MEMBER_1 (Ana):  CPF 71428793860  | senha: Password@123
 */
export const SEED_USERS = {
  manager: {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    cpf: '46477239094',
    password: 'Password@123',
    email: 'admin@veracis.com',
    name: 'Admin Veracis',
    role: 'MANAGER',
  },
  leaderAmazonia: {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    cpf: '52998224725',
    password: 'Password@123',
    email: 'carlos.amazonas@veracis.com',
    name: 'Carlos Amazonas',
    role: 'COMMUNITY_LEADER',
  },
  leaderCerrado: {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    cpf: '07077902071',
    password: 'Password@123',
    email: 'beatriz.cerrado@veracis.com',
    name: 'Beatriz Cerrado',
    role: 'COMMUNITY_LEADER',
  },
  member1: {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    cpf: '71428793860',
    password: 'Password@123',
    email: 'ana.silva@veracis.com',
    name: 'Ana Silva',
    role: 'COMMUNITY_MEMBER',
  },
};

/**
 * Realiza login na API e retorna os cookies de sessão
 *
 * @param {object} user - Objeto com cpf e password
 * @param {object} jar - Cookie jar do K6 (http.cookieJar())
 * @returns {{ success: boolean, mfaRequired: boolean, cookies: object }}
 */
export function login(user, jar) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ cpf: user.cpf, password: user.password }),
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'K6-LoadTest/1.0',
      },
      cookieJar: jar,
      tags: { endpoint: 'auth_login' },
    },
  );

  if (res.status === 200) {
    const body = JSON.parse(res.body);
    return {
      success: true,
      mfaRequired: body.mfaRequired || false,
      status: res.status,
      res,
    };
  }

  return {
    success: false,
    mfaRequired: false,
    status: res.status,
    res,
  };
}

/**
 * Realiza logout na API
 *
 * @param {object} jar - Cookie jar com sessão ativa
 * @returns {object} Resposta HTTP
 */
export function logout(jar) {
  return http.post(
    `${BASE_URL}/auth/logout`,
    null,
    {
      headers: { 'Content-Type': 'application/json' },
      cookieJar: jar,
      tags: { endpoint: 'auth_logout' },
    },
  );
}

/**
 * Renova o access token usando o refresh token armazenado no cookie
 *
 * @param {object} jar - Cookie jar com refresh_token ativo
 * @returns {{ success: boolean, res: object }}
 */
export function refreshToken(jar) {
  const res = http.post(
    `${BASE_URL}/auth/refresh`,
    null,
    {
      headers: { 'Content-Type': 'application/json' },
      cookieJar: jar,
      tags: { endpoint: 'auth_refresh' },
    },
  );

  return {
    success: res.status === 200,
    status: res.status,
    res,
  };
}

/**
 * Retorna um usuário aleatório do pool de seed (para distribuir carga)
 * Apenas usuários com status ACTIVED e isVerified: true
 */
export function getRandomSeedUser() {
  const users = [
    SEED_USERS.manager,
    SEED_USERS.leaderAmazonia,
    SEED_USERS.leaderCerrado,
    SEED_USERS.member1,
  ];
  return users[Math.floor(Math.random() * users.length)];
}
