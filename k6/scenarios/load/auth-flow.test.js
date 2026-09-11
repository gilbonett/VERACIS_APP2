import http from 'k6/http';
import { sleep } from 'k6';
import { loadThresholds } from '../../config/thresholds.js';
import { BASE_URL } from '../../config/environments.js';
import { login, logout, SEED_USERS, getRandomSeedUser } from '../../helpers/auth.js';
import { apiGet, apiPost } from '../../helpers/http.js';
import { SEED_IDS, generateAlert, generateAlertComment, generateAlertReaction } from '../../helpers/data-generator.js';
import {
  checkLoginSuccess,
  checkUserProfile,
  checkAlertsList,
  checkAlertCreated,
  checkCommunitiesList,
  extractEventIds,
  extractFirstAlertId,
} from '../../helpers/checks.js';
import { check } from 'k6';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LOAD TEST — Fluxo de Autenticação e Interação
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Simula o fluxo completo de um usuário real:
 *   Login → Ver perfil → Listar alertas → Criar alerta →
 *   Comentar → Reagir → Logout
 *
 * Parâmetros:
 *   VUs: 50 usuários simultâneos
 *   Ramp-up: 0→50 em 2min | steady: 5min | ramp-down: 2min
 *   Thresholds: p95 < 800ms, erros < 1%
 *
 * Execução:
 *   k6 run k6/scenarios/load/auth-flow.test.js
 *
 * Com Grafana:
 *   k6 run k6/scenarios/load/auth-flow.test.js \
 *     --out influxdb=http://localhost:8086/k6
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Aquecimento suave
    { duration: '1m', target: 30 },   // Ramp-up intermediário
    { duration: '1m', target: 50 },   // Ramp-up até pico
    { duration: '5m', target: 50 },   // Carga estável (steady state)
    { duration: '1m', target: 20 },   // Ramp-down suave
    { duration: '1m', target: 0 },    // Encerramento
  ],
  thresholds: {
    ...loadThresholds,
    // Thresholds específicos por endpoint
    'http_req_duration{endpoint:auth_login}': ['p(95)<1500'],
    'http_req_duration{endpoint:user_profile}': ['p(95)<600'],
    'http_req_duration{endpoint:alerts}': ['p(95)<800'],
  },
  tags: { test_type: 'load', scenario: 'auth-flow', project: 'veracis' },
};

export default function () {
  const jar = http.cookieJar();

  // ── Fase 1: Login ─────────────────────────────────────────────────────────
  const user = getRandomSeedUser();
  const loginResult = login(user, jar);
  checkLoginSuccess(loginResult.res);

  if (!loginResult.success) {
    // Se login falhar (ex: rate limit 429), espera e continua
    sleep(Math.random() * 3 + 2);
    return;
  }

  sleep(Math.random() * 1 + 0.5); // Think time: 0.5–1.5s

  // ── Fase 2: Ver perfil ────────────────────────────────────────────────────
  const profileRes = apiGet('/user/profile', jar);
  checkUserProfile(profileRes);

  sleep(Math.random() * 1 + 0.5);

  // ── Fase 3: Consultar dados do sistema ────────────────────────────────────
  const eventsRes = apiGet('/events', jar);
  const eventIds = extractEventIds(eventsRes, 2);

  const catRes = apiGet('/categories', jar);
  check(catRes, { '[categories] status 200': (r) => r.status === 200 });

  sleep(Math.random() * 1.5 + 0.5);

  // ── Fase 4: Listar alertas ────────────────────────────────────────────────
  const alertsRes = apiGet('/alerts', jar);
  checkAlertsList(alertsRes);
  const firstAlertId = extractFirstAlertId(alertsRes);

  sleep(Math.random() * 2 + 1); // Think time maior: usuário "lê" os alertas

  // ── Fase 5: Ver detalhe de alerta (se existir) ────────────────────────────
  if (firstAlertId) {
    const alertDetailRes = apiGet(`/alerts/${firstAlertId}`, jar);
    check(alertDetailRes, {
      '[alert-detail] status 200': (r) => r.status === 200,
    });
    sleep(Math.random() * 1 + 0.5);
  }

  // ── Fase 6: Criar alerta (30% dos usuários) ───────────────────────────────
  if (Math.random() < 0.30) {
    const alertPayload = generateAlert(user.id, eventIds.slice(0, 1));
    const createRes = apiPost('/alerts', alertPayload, jar);
    checkAlertCreated(createRes);
    sleep(Math.random() * 1 + 0.5);
  }

  // ── Fase 7: Comentar em alerta (40% dos usuários) ─────────────────────────
  if (firstAlertId && Math.random() < 0.40) {
    const commentPayload = generateAlertComment(firstAlertId);
    const commentRes = apiPost('/alerts/comments', commentPayload, jar);
    check(commentRes, {
      '[comment] status 200 ou 201': (r) => r.status === 200 || r.status === 201,
    });
    sleep(Math.random() * 0.5 + 0.3);
  }

  // ── Fase 8: Reagir a alerta (50% dos usuários) ────────────────────────────
  if (firstAlertId && Math.random() < 0.50) {
    const reactionPayload = generateAlertReaction(firstAlertId);
    const reactionRes = apiPost('/alerts/reactions', reactionPayload, jar);
    check(reactionRes, {
      '[reaction] status 2xx': (r) => r.status >= 200 && r.status < 300,
    });
    sleep(Math.random() * 0.3 + 0.2);
  }

  // ── Fase 9: Logout ────────────────────────────────────────────────────────
  logout(jar);

  // Think time final antes da próxima iteração
  sleep(Math.random() * 3 + 2);
}
