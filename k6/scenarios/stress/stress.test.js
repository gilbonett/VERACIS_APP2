import http from 'k6/http';
import { sleep, group } from 'k6';
import { stressThresholds } from '../../config/thresholds.js';
import { BASE_URL } from '../../config/environments.js';
import { SEED_USERS, getRandomSeedUser } from '../../helpers/auth.js';
import { apiGet, apiPost } from '../../helpers/http.js';
import { generateAlert } from '../../helpers/data-generator.js';
import { extractEventIds } from '../../helpers/checks.js';
import { check } from 'k6';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * STRESS TEST — VERACIS_APP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Objetivo: Aumentar a carga progressivamente até encontrar o ponto de
 *           degradação / quebra da API.
 *
 * Estratégia de escalonamento:
 *   Nível 1 — 10 VUs   (3min) → Linha de base saudável
 *   Nível 2 — 50 VUs   (3min) → Carga normal de produção
 *   Nível 3 — 100 VUs  (3min) → Carga pesada
 *   Nível 4 — 200 VUs  (3min) → Stress elevado
 *   Nível 5 — 300 VUs  (3min) → Stress extremo
 *   Nível 6 — 400 VUs  (3min) → Limite / ponto de quebra
 *   Recovery — 50 VUs  (3min) → Recuperação da API
 *
 * Total: ~24 minutos
 *
 * Pontos de observação:
 *   - Onde o p95 começa a exceder 2s?
 *   - Onde a taxa de erros sobe acima de 5%?
 *   - Onde o throughput (req/s) para de crescer (saturação)?
 *
 * Execução:
 *   k6 run k6/scenarios/stress/stress.test.js
 *
 * Com Grafana (recomendado para análise visual):
 *   k6 run k6/scenarios/stress/stress.test.js \
 *     --out influxdb=http://localhost:8086/k6
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const options = {
  stages: [
    // ── Linha de base ────────────────────────────────────────────────────────
    { duration: '1m', target: 10 },   // Aquecimento
    { duration: '3m', target: 10 },   // Nível 1: Baseline saudável

    // ── Escalada progressiva ─────────────────────────────────────────────────
    { duration: '1m', target: 50 },   // Ramp-up → Nível 2
    { duration: '3m', target: 50 },   // Nível 2: Carga normal

    { duration: '1m', target: 100 },  // Ramp-up → Nível 3
    { duration: '3m', target: 100 },  // Nível 3: Carga pesada

    { duration: '1m', target: 200 },  // Ramp-up → Nível 4
    { duration: '3m', target: 200 },  // Nível 4: Stress elevado

    { duration: '1m', target: 300 },  // Ramp-up → Nível 5
    { duration: '3m', target: 300 },  // Nível 5: Stress extremo

    { duration: '1m', target: 400 },  // Ramp-up → Nível 6
    { duration: '3m', target: 400 },  // Nível 6: Ponto de quebra

    // ── Recuperação ──────────────────────────────────────────────────────────
    { duration: '2m', target: 50 },   // Ramp-down
    { duration: '3m', target: 50 },   // Observar recuperação
    { duration: '2m', target: 0 },    // Encerramento
  ],
  thresholds: stressThresholds,
  tags: { test_type: 'stress', project: 'veracis' },
};

export default function () {
  const jar = http.cookieJar();
  const user = getRandomSeedUser();

  // ── Login ─────────────────────────────────────────────────────────────────
  group('auth', () => {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ cpf: user.cpf, password: user.password }),
      {
        headers: { 'Content-Type': 'application/json' },
        cookieJar: jar,
        tags: { endpoint: 'auth_login', group: 'auth' },
      },
    );

    check(loginRes, {
      '[stress] login status 2xx ou 429': (r) =>
        (r.status >= 200 && r.status < 300) || r.status === 429,
    });

    if (loginRes.status !== 200) {
      sleep(1);
      return;
    }
  });

  sleep(0.2);

  // ── Leituras básicas ─────────────────────────────────────────────────────
  group('reads', () => {
    // Health check — indicador de saúde geral
    const healthRes = http.get(`${BASE_URL}/health`, {
      cookieJar: jar,
      tags: { endpoint: 'health', group: 'reads' },
    });
    check(healthRes, {
      '[stress] health status 200': (r) => r.status === 200,
      '[stress] health < 1s': (r) => r.timings.duration < 1000,
    });

    sleep(0.1);

    // Alertas — endpoint mais pesado (DB query + joins)
    const alertsRes = apiGet('/alerts', jar);
    check(alertsRes, {
      '[stress] alerts status 2xx': (r) => r.status >= 200 && r.status < 300,
    });

    sleep(0.1);

    // Comunidades
    const commRes = http.get(`${BASE_URL}/communities`, {
      tags: { endpoint: 'communities', group: 'reads' },
    });
    check(commRes, {
      '[stress] communities status 2xx': (r) => r.status >= 200 && r.status < 300,
    });
  });

  sleep(0.2);

  // ── Escritas (50% dos VUs) ────────────────────────────────────────────────
  if (Math.random() < 0.50) {
    group('writes', () => {
      const eventsRes = apiGet('/events', jar);
      const eventIds = extractEventIds(eventsRes, 1);

      const alertPayload = generateAlert(user.id, eventIds);
      const createRes = apiPost('/alerts', alertPayload, jar);
      check(createRes, {
        '[stress] create-alert aceito (201 ou 4xx)': (r) =>
          r.status === 201 || (r.status >= 400 && r.status < 500),
      });
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  http.post(`${BASE_URL}/auth/logout`, null, {
    cookieJar: jar,
    tags: { endpoint: 'auth_logout' },
  });

  // Think time mínimo — stress test é intencionalmente agressivo
  sleep(Math.random() * 0.5 + 0.2);
}
