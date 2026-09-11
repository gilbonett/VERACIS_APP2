import http from 'k6/http';
import { sleep, group } from 'k6';
import { soakThresholds } from '../../config/thresholds.js';
import { BASE_URL } from '../../config/environments.js';
import { getRandomSeedUser } from '../../helpers/auth.js';
import { apiGet, apiPost } from '../../helpers/http.js';
import {
  generateAlert,
  generateAlertComment,
} from '../../helpers/data-generator.js';
import { extractEventIds } from '../../helpers/checks.js';
import { check } from 'k6';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SOAK TEST — VERACIS_APP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Objetivo: Manter carga moderada por um longo período para detectar:
 *   - Memory leaks (heap crescendo progressivamente)
 *   - Connection pool exhaustion (PostgreSQL / Redis)
 *   - Degradação gradual de performance (tempo de resposta aumentando)
 *   - Erros acumulativos (ex: race conditions, timeouts esporádicos)
 *   - Behavior de GC do Node.js sob carga contínua
 *
 * Configuração padrão: 30 VUs por 30 minutos
 * Para teste mais longo: defina SOAK_DURATION via variável de ambiente
 *
 * Execução (padrão — 30 min):
 *   k6 run k6/scenarios/soak/soak.test.js
 *
 * Execução extendida (1 hora):
 *   k6 run k6/scenarios/soak/soak.test.js -e SOAK_DURATION=60m
 *
 * Com Grafana (MUITO recomendado para soak):
 *   k6 run k6/scenarios/soak/soak.test.js \
 *     --out influxdb=http://localhost:8086/k6
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SOAK_DURATION = __ENV.SOAK_DURATION || '30m';
const SOAK_VUS = parseInt(__ENV.SOAK_VUS || '30', 10);

export const options = {
  stages: [
    { duration: '2m', target: Math.floor(SOAK_VUS * 0.3) },  // Aquecimento suave
    { duration: '3m', target: SOAK_VUS },                      // Ramp-up até VUs alvo
    { duration: SOAK_DURATION, target: SOAK_VUS },             // ← Soak principal
    { duration: '3m', target: 0 },                             // Ramp-down
  ],
  thresholds: {
    ...soakThresholds,
    // Thresholds específicos para detectar degradação temporal
    // Se p95 ficar consistentemente acima de 800ms, há degradação
    'http_req_duration': [
      'p(95)<1000',
      'p(99)<2000',
    ],
    // Taxa de erro deve ser próxima de 0 durante toda a duração
    'http_req_failed': ['rate<0.005'],
  },
  tags: { test_type: 'soak', project: 'veracis', duration: SOAK_DURATION },
};

export default function () {
  const jar = http.cookieJar();
  const user = getRandomSeedUser();

  // ── Login ─────────────────────────────────────────────────────────────────
  group('soak_auth', () => {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ cpf: user.cpf, password: user.password }),
      {
        headers: { 'Content-Type': 'application/json' },
        cookieJar: jar,
        tags: { endpoint: 'auth_login', group: 'soak_auth' },
      },
    );

    check(loginRes, {
      '[soak] login status 200': (r) => r.status === 200,
      '[soak] login < 2s': (r) => r.timings.duration < 2000,
    });

    if (loginRes.status !== 200) {
      sleep(2);
      return;
    }
  });

  sleep(Math.random() * 0.5 + 0.3);

  // ── Ciclo de uso típico ───────────────────────────────────────────────────

  group('soak_reads', () => {
    // Health check periódico — detecta degradação de infraestrutura
    const healthRes = http.get(`${BASE_URL}/health`, {
      cookieJar: jar,
      tags: { endpoint: 'health', group: 'soak_reads' },
    });
    check(healthRes, {
      '[soak] health 200': (r) => r.status === 200,
      '[soak] health < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.2);

    // Perfil — testa JWT decode e Redis session (se aplicável)
    const profileRes = apiGet('/user/profile', jar);
    check(profileRes, {
      '[soak] profile 200': (r) => r.status === 200,
      '[soak] profile < 800ms': (r) => r.timings.duration < 800,
    });

    sleep(Math.random() * 1 + 0.5);

    // Alertas — query pesada no PostgreSQL
    const alertsRes = apiGet('/alerts', jar);
    check(alertsRes, {
      '[soak] alerts 200': (r) => r.status === 200,
      '[soak] alerts < 1.5s': (r) => r.timings.duration < 1500,
    });

    sleep(Math.random() * 1.5 + 0.5);

    // Categorias — deve ser cacheado pelo Redis
    const catRes = apiGet('/categories', jar);
    check(catRes, {
      '[soak] categories 200': (r) => r.status === 200,
      '[soak] categories < 300ms': (r) => r.timings.duration < 300,
    });

    sleep(Math.random() * 0.5 + 0.2);
  });

  // ── Escritas periódicas (40% das iterações) ───────────────────────────────
  if (Math.random() < 0.40) {
    group('soak_writes', () => {
      const eventsRes = apiGet('/events', jar);
      const eventIds = extractEventIds(eventsRes, 1);

      // Criar alerta — testa escrita no PostgreSQL
      const alertPayload = generateAlert(user.id, eventIds);
      const createRes = apiPost('/alerts', alertPayload, jar);
      check(createRes, {
        '[soak] create-alert 201': (r) => r.status === 201,
        '[soak] create-alert < 2s': (r) => r.timings.duration < 2000,
      });

      sleep(0.5);

      // Comentar — testa cascata de escritas
      const alertsForComment = apiGet('/alerts', jar);
      let commentAlertId = null;
      try {
        const alerts = JSON.parse(alertsForComment.body);
        if (Array.isArray(alerts) && alerts.length > 0) {
          commentAlertId = alerts[Math.floor(Math.random() * alerts.length)].id;
        }
      } catch (_) {}

      if (commentAlertId) {
        const commentPayload = generateAlertComment(commentAlertId);
        const commentRes = apiPost('/alerts/comments', commentPayload, jar);
        check(commentRes, {
          '[soak] comment 2xx': (r) => r.status >= 200 && r.status < 300,
          '[soak] comment < 1s': (r) => r.timings.duration < 1000,
        });
      }
    });
  }

  // ── Refresh token (20% das iterações — simula sessões longas) ─────────────
  if (Math.random() < 0.20) {
    const refreshRes = http.post(`${BASE_URL}/auth/refresh`, null, {
      cookieJar: jar,
      tags: { endpoint: 'auth_refresh' },
    });
    check(refreshRes, {
      '[soak] refresh 200': (r) => r.status === 200,
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  http.post(`${BASE_URL}/auth/logout`, null, {
    cookieJar: jar,
    tags: { endpoint: 'auth_logout' },
  });

  // Think time realista — sessão de 5–15 segundos por iteração
  sleep(Math.random() * 10 + 5);
}
