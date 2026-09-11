import http from 'k6/http';
import { sleep } from 'k6';
import { loadThresholds } from '../../config/thresholds.js';
import { BASE_URL } from '../../config/environments.js';
import { login, SEED_USERS } from '../../helpers/auth.js';
import { apiGet } from '../../helpers/http.js';
import { SEED_IDS } from '../../helpers/data-generator.js';
import {
  checkAlertsList,
  checkCommunitiesList,
  checkCategoriesList,
  checkEventsList,
  checkBiomesList,
  checkHealthEndpoint,
  checkRootEndpoint,
  extractFirstAlertId,
} from '../../helpers/checks.js';
import { check } from 'k6';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LOAD TEST — Operações de Leitura (Read-Only)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Simula múltiplos usuários realizando APENAS operações de leitura.
 * Útil para medir desempenho do banco de dados e cache Redis.
 *
 * Distribui requests entre endpoints via múltiplos scenarios paralelos:
 *   - scenario_public: Usuários anônimos (GET público)
 *   - scenario_auth:   Usuários autenticados (GET com JWT)
 *
 * VUs Total: 80 (40 públicos + 40 autenticados)
 * Duração: ~10 minutos
 *
 * Execução:
 *   k6 run k6/scenarios/load/read-only.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const options = {
  scenarios: {
    // Usuários anônimos — endpoints públicos
    scenario_public: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '5m', target: 40 },
        { duration: '2m', target: 20 },
        { duration: '1m', target: 0 },
      ],
      exec: 'publicReadFlow',
      tags: { scenario: 'public-read' },
    },

    // Usuários autenticados — endpoints protegidos
    scenario_auth: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m30s', target: 10 }, // Delay para login primeiro
        { duration: '4m', target: 40 },
        { duration: '2m', target: 20 },
        { duration: '1m30s', target: 0 },
      ],
      exec: 'authReadFlow',
      tags: { scenario: 'auth-read' },
    },
  },
  thresholds: {
    ...loadThresholds,
    'http_req_duration{scenario:public-read}': ['p(95)<500'],
    'http_req_duration{scenario:auth-read}': ['p(95)<800'],
    'http_req_failed{scenario:public-read}': ['rate<0.005'],
    'http_req_failed{scenario:auth-read}': ['rate<0.01'],
  },
  tags: { test_type: 'load', scenario: 'read-only', project: 'veracis' },
};

/**
 * Fluxo de leitura pública (sem autenticação)
 */
export function publicReadFlow() {
  // Root
  const rootRes = http.get(`${BASE_URL}/`, { tags: { endpoint: 'root' } });
  checkRootEndpoint(rootRes);
  sleep(Math.random() * 0.5 + 0.2);

  // Health check
  const healthRes = http.get(`${BASE_URL}/health`, { tags: { endpoint: 'health' } });
  checkHealthEndpoint(healthRes);
  sleep(Math.random() * 0.5 + 0.2);

  // Comunidades públicas
  const commRes = http.get(`${BASE_URL}/communities`, { tags: { endpoint: 'communities' } });
  checkCommunitiesList(commRes);
  sleep(Math.random() * 1 + 0.5);

  // Comunidades filtradas por bioma (simula navegação)
  const biomes = [SEED_IDS.BIOME_AMAZONIA, SEED_IDS.BIOME_CERRADO, SEED_IDS.BIOME_CAATINGA];
  const biomeId = biomes[Math.floor(Math.random() * biomes.length)];
  const commFilteredRes = http.get(
    `${BASE_URL}/communities?biomeId=${biomeId}`,
    { tags: { endpoint: 'communities_filtered' } },
  );
  checkCommunitiesList(commFilteredRes);

  sleep(Math.random() * 2 + 1);
}

/**
 * Fluxo de leitura autenticada
 */
export function authReadFlow() {
  const jar = http.cookieJar();

  // Login com usuário seed (rotação)
  const users = [
    SEED_USERS.manager,
    SEED_USERS.leaderAmazonia,
    SEED_USERS.leaderCerrado,
    SEED_USERS.member1,
  ];
  const user = users[__VU % users.length];

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

  // ─── Sequência de leituras ────────────────────────────────────────────────

  // Biomas
  const biomesRes = apiGet('/biomes', jar);
  checkBiomesList(biomesRes);
  sleep(Math.random() * 0.5 + 0.2);

  // Categorias
  const catRes = apiGet('/categories', jar);
  checkCategoriesList(catRes);
  sleep(Math.random() * 0.5 + 0.2);

  // Eventos
  const eventsRes = apiGet('/events', jar);
  checkEventsList(eventsRes);
  sleep(Math.random() * 0.5 + 0.2);

  // Alertas (paginação)
  const alertsRes = apiGet('/alerts', jar);
  checkAlertsList(alertsRes);
  const firstAlertId = extractFirstAlertId(alertsRes);
  sleep(Math.random() * 1.5 + 0.5);

  // Detalhe de alerta
  if (firstAlertId) {
    const alertDetailRes = apiGet(`/alerts/${firstAlertId}`, jar);
    check(alertDetailRes, {
      '[alert-detail] status 200': (r) => r.status === 200,
      '[alert-detail] tempo < 1s': (r) => r.timings.duration < 1000,
    });
    sleep(Math.random() * 1 + 0.5);
  }

  // Eventos por categoria
  const catId = SEED_IDS.CAT_CLIMATICO;
  const eventsByCatRes = apiGet(`/events/category/${catId}`, jar);
  check(eventsByCatRes, {
    '[events-by-cat] status 200': (r) => r.status === 200,
  });
  sleep(Math.random() * 0.5 + 0.2);

  // Perfil do usuário
  const profileRes = apiGet('/user/profile', jar);
  check(profileRes, {
    '[profile] status 200': (r) => r.status === 200,
    '[profile] tempo < 800ms': (r) => r.timings.duration < 800,
  });

  // Logout e pausa antes da próxima iteração
  http.post(`${BASE_URL}/auth/logout`, null, { cookieJar: jar });
  sleep(Math.random() * 3 + 2);
}
