import http from 'k6/http';
import { check, sleep } from 'k6';
import { smokeThresholds } from '../../config/thresholds.js';
import { BASE_URL } from '../../config/environments.js';
import { login, SEED_USERS } from '../../helpers/auth.js';
import { apiGet, apiPublicGet, apiPost } from '../../helpers/http.js';
import { SEED_IDS, generateAlert } from '../../helpers/data-generator.js';
import {
  checkLoginSuccess,
  checkUserProfile,
  checkAlertsList,
  checkAlertCreated,
  checkCommunitiesList,
  checkCategoriesList,
  checkEventsList,
  checkBiomesList,
  checkHealthEndpoint,
  checkRootEndpoint,
  checkRefreshToken,
  extractEventIds,
  extractFirstAlertId,
} from '../../helpers/checks.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SMOKE TEST — VERACIS_APP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Objetivo: Validar que TODOS os endpoints da API respondem corretamente
 *           com carga mínima (1 VU, 1 iteração).
 *
 * Execução:
 *   k6 run k6/scenarios/smoke/smoke.test.js
 *
 * Com output para Grafana:
 *   k6 run k6/scenarios/smoke/smoke.test.js \
 *     --out influxdb=http://localhost:8086/k6
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: smokeThresholds,
  tags: { test_type: 'smoke', project: 'veracis' },
};

export default function () {
  const jar = http.cookieJar();

  // ── 1. Endpoints Públicos ─────────────────────────────────────────────────

  console.log('▶ [1/13] GET / — Root endpoint');
  const rootRes = apiPublicGet('/');
  checkRootEndpoint(rootRes);
  sleep(0.5);

  console.log('▶ [2/13] GET /health — Health check');
  const healthRes = apiPublicGet('/health');
  checkHealthEndpoint(healthRes);
  sleep(0.5);

  console.log('▶ [3/13] GET /communities — Listar comunidades');
  const commRes = apiPublicGet('/communities');
  checkCommunitiesList(commRes);
  sleep(0.5);

  console.log('▶ [4/13] GET /communities?biomeId=... — Filtrar por bioma');
  const commFilteredRes = http.get(
    `${BASE_URL}/communities?biomeId=${SEED_IDS.BIOME_AMAZONIA}`,
    { tags: { endpoint: 'communities_by_biome' } },
  );
  checkCommunitiesList(commFilteredRes);
  sleep(0.5);

  // ── 2. Autenticação ───────────────────────────────────────────────────────

  console.log('▶ [5/13] POST /auth/login — Login com usuário seed');
  const loginResult = login(SEED_USERS.manager, jar);
  checkLoginSuccess(loginResult.res);

  if (!loginResult.success) {
    console.error('❌ Login falhou — abortando smoke test');
    return;
  }
  sleep(0.5);

  // ── 3. Endpoints Autenticados ─────────────────────────────────────────────

  console.log('▶ [6/13] GET /user/profile — Perfil do usuário');
  const profileRes = apiGet('/user/profile', jar);
  checkUserProfile(profileRes);
  sleep(0.5);

  console.log('▶ [7/13] GET /biomes — Listar biomas');
  const biomesRes = apiGet('/biomes', jar);
  checkBiomesList(biomesRes);
  sleep(0.5);

  console.log('▶ [8/13] GET /categories — Listar categorias');
  const categoriesRes = apiGet('/categories', jar);
  checkCategoriesList(categoriesRes);
  sleep(0.5);

  console.log('▶ [9/13] GET /events — Listar eventos');
  const eventsRes = apiGet('/events', jar);
  checkEventsList(eventsRes);
  const eventIds = extractEventIds(eventsRes, 2);
  sleep(0.5);

  if (eventIds.length > 0) {
    const catId = SEED_IDS.CAT_CLIMATICO;
    console.log(`▶ [10/13] GET /events/category/:categoryId — Eventos por categoria`);
    const eventsByCatRes = apiGet(`/events/category/${catId}`, jar);
    checkEventsList(eventsByCatRes);
    sleep(0.5);
  }

  console.log('▶ [11/13] GET /alerts — Listar alertas');
  const alertsRes = apiGet('/alerts', jar);
  checkAlertsList(alertsRes);
  const firstAlertId = extractFirstAlertId(alertsRes);
  sleep(0.5);

  if (firstAlertId) {
    console.log(`▶ [12/13] GET /alerts/:alertId — Detalhe do alerta`);
    const alertDetailRes = apiGet(`/alerts/${firstAlertId}`, jar);
    check(alertDetailRes, {
      '[alert-detail] status 200': (r) => r.status === 200,
      '[alert-detail] tem campo id': (r) => {
        try { return JSON.parse(r.body).id !== undefined; } catch { return false; }
      },
    });
    sleep(0.5);
  }

  console.log('▶ [13/13] POST /alerts — Criar alerta');
  const alertPayload = generateAlert(SEED_USERS.manager.id, eventIds);
  const createAlertRes = apiPost('/alerts', alertPayload, jar);
  checkAlertCreated(createAlertRes);
  sleep(0.5);

  // ── 4. Refresh Token ──────────────────────────────────────────────────────
  console.log('▶ POST /auth/refresh — Renovar token');
  const refreshRes = http.post(`${BASE_URL}/auth/refresh`, null, {
    cookieJar: jar,
    tags: { endpoint: 'auth_refresh' },
  });
  checkRefreshToken(refreshRes);

  console.log('✅ Smoke test concluído!');
}
