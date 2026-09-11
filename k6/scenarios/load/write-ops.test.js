import http from 'k6/http';
import { sleep } from 'k6';
import { loadThresholds } from '../../config/thresholds.js';
import { BASE_URL } from '../../config/environments.js';
import { login, SEED_USERS, getRandomSeedUser } from '../../helpers/auth.js';
import { apiGet, apiPost, apiPut } from '../../helpers/http.js';
import {
  SEED_IDS,
  generateAlert,
  generateAlertComment,
  generateAlertReaction,
} from '../../helpers/data-generator.js';
import {
  checkAlertCreated,
  checkUserProfile,
  extractEventIds,
} from '../../helpers/checks.js';
import { check } from 'k6';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LOAD TEST — Operações de Escrita (Write Operations)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Foco em operações que escrevem no banco: criação de alertas, comentários,
 * reações e atualização de perfil. Mede o impacto em PostgreSQL e Redis.
 *
 * VUs: 30 usuários fazendo operações de escrita contínuas
 * Duração: ~8 minutos
 *
 * Execução:
 *   k6 run k6/scenarios/load/write-ops.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Aquecimento leve
    { duration: '1m', target: 15 },   // Ramp-up
    { duration: '1m', target: 30 },   // Pico de escrita
    { duration: '3m', target: 30 },   // Steady state
    { duration: '1m', target: 10 },   // Ramp-down
    { duration: '1m', target: 0 },    // Encerramento
  ],
  thresholds: {
    ...loadThresholds,
    'http_req_duration{endpoint:alerts}': ['p(95)<2000'],
    'http_req_duration{endpoint:alerts_comments}': ['p(95)<1000'],
    'http_req_duration{endpoint:alerts_reactions}': ['p(95)<1000'],
    'http_req_failed': ['rate<0.02'],  // Tolerância um pouco maior (409 em reações duplicadas)
  },
  tags: { test_type: 'load', scenario: 'write-ops', project: 'veracis' },
};

export default function () {
  const jar = http.cookieJar();
  const user = getRandomSeedUser();

  // ── Login ─────────────────────────────────────────────────────────────────
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ cpf: user.cpf, password: user.password }),
    {
      headers: { 'Content-Type': 'application/json' },
      cookieJar: jar,
      tags: { endpoint: 'auth_login' },
    },
  );

  if (loginRes.status !== 200) {
    sleep(3);
    return;
  }

  sleep(Math.random() * 0.5 + 0.3);

  // ── Buscar eventos para associar ao alerta ────────────────────────────────
  const eventsRes = apiGet('/events', jar);
  const eventIds = extractEventIds(eventsRes, 2);

  // ── Buscar alertas existentes para comentar/reagir ────────────────────────
  const alertsRes = apiGet('/alerts', jar);
  let existingAlertId = null;
  try {
    const alerts = JSON.parse(alertsRes.body);
    if (Array.isArray(alerts) && alerts.length > 0) {
      const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
      existingAlertId = randomAlert.id;
    }
  } catch (_) {}

  sleep(Math.random() * 0.5 + 0.2);

  // ── Operação 1: Criar alerta (sempre) ────────────────────────────────────
  const alertPayload = generateAlert(user.id, eventIds.slice(0, 1));
  const createAlertRes = apiPost('/alerts', alertPayload, jar);
  checkAlertCreated(createAlertRes);
  sleep(Math.random() * 1 + 0.5);

  // ── Operação 2: Comentar em alerta existente (70%) ───────────────────────
  if (existingAlertId && Math.random() < 0.70) {
    const commentPayload = generateAlertComment(existingAlertId);
    const commentRes = apiPost('/alerts/comments', commentPayload, jar);
    check(commentRes, {
      '[write] comentário criado (2xx)': (r) => r.status >= 200 && r.status < 300,
      '[write] comentário tempo < 1s': (r) => r.timings.duration < 1000,
    });
    sleep(Math.random() * 0.5 + 0.3);
  }

  // ── Operação 3: Reagir a alerta (60%) ────────────────────────────────────
  // Pode retornar 409 se já reagiu (único por usuário+alerta) — isso é esperado
  if (existingAlertId && Math.random() < 0.60) {
    const reactionPayload = generateAlertReaction(existingAlertId);
    const reactionRes = apiPost('/alerts/reactions', reactionPayload, jar);
    check(reactionRes, {
      '[write] reação aceita (2xx ou 409-duplicado)': (r) =>
        (r.status >= 200 && r.status < 300) || r.status === 409 || r.status === 400,
    });
    sleep(Math.random() * 0.3 + 0.2);
  }

  // ── Operação 4: Atualizar perfil (20%) ───────────────────────────────────
  if (Math.random() < 0.20) {
    const updateRes = apiPut(
      '/user',
      { name: user.name, phone: user.cpf.slice(0, 11) },
      jar,
    );
    check(updateRes, {
      '[write] perfil atualizado (200)': (r) => r.status === 200,
    });
    sleep(Math.random() * 0.5 + 0.2);
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  http.post(`${BASE_URL}/auth/logout`, null, {
    cookieJar: jar,
    tags: { endpoint: 'auth_logout' },
  });

  sleep(Math.random() * 2 + 1);
}
