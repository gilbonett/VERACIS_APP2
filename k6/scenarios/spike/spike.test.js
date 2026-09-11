import http from 'k6/http';
import { sleep } from 'k6';
import { spikeThresholds } from '../../config/thresholds.js';
import { BASE_URL } from '../../config/environments.js';
import { getRandomSeedUser } from '../../helpers/auth.js';
import { apiGet } from '../../helpers/http.js';
import { generateAlert } from '../../helpers/data-generator.js';
import { extractEventIds } from '../../helpers/checks.js';
import { check } from 'k6';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SPIKE TEST — VERACIS_APP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Objetivo: Simular um pico repentino e massivo de tráfego — como quando
 *           um alerta ambiental grave viraliza nas redes sociais e centenas
 *           de usuários acessam o sistema simultaneamente.
 *
 * Perfil:
 *   - Baseline:  10 VUs (tráfego normal)
 *   - Pico:      500 VUs em 30 segundos (explosão de tráfego)
 *   - Retorno:   10 VUs em 2 minutos (normalização)
 *   - Repetição: 2 picos para avaliar recuperação consistente
 *
 * Pergunta-chave: A API se recupera completamente entre picos?
 *   - Health check deve voltar a 200ms após pico
 *   - Taxa de erros deve cair a < 1% na fase de normalização
 *
 * Execução:
 *   k6 run k6/scenarios/spike/spike.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const options = {
  stages: [
    // ── Baseline inicial ─────────────────────────────────────────────────────
    { duration: '1m', target: 10 },    // Tráfego normal — linha de base

    // ── Pico 1 ───────────────────────────────────────────────────────────────
    { duration: '30s', target: 500 },  // EXPLOSÃO: 10 → 500 VUs em 30s
    { duration: '1m', target: 500 },   // Manter pico por 1 minuto
    { duration: '2m', target: 10 },    // Retorno ao baseline

    // ── Período de estabilização ─────────────────────────────────────────────
    { duration: '2m', target: 10 },    // Observar recuperação

    // ── Pico 2 (avaliar resiliência após primeiro pico) ───────────────────────
    { duration: '30s', target: 500 },  // EXPLOSÃO novamente
    { duration: '1m', target: 500 },   // Manter pico
    { duration: '2m', target: 10 },    // Retorno

    // ── Encerramento ─────────────────────────────────────────────────────────
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    ...spikeThresholds,
    // Durante o pico, aceitamos degradação — mas a API deve sobreviver
    'http_req_failed': ['rate<0.20'],      // Até 20% de erros durante spike
    'http_req_duration': ['p(99)<10000'],  // p99 < 10s
    // Na fase de recovery, a API DEVE estar estável
    'http_req_duration{phase:recovery}': ['p(95)<1000'],
    'http_req_failed{phase:recovery}': ['rate<0.01'],
  },
  tags: { test_type: 'spike', project: 'veracis' },
};

export default function () {
  const jar = http.cookieJar();
  const user = getRandomSeedUser();

  // Determina a fase atual para tagging diferenciada
  const currentVUs = __VU;
  const phase = currentVUs > 50 ? 'spike' : 'recovery';

  // ── Login ─────────────────────────────────────────────────────────────────
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ cpf: user.cpf, password: user.password }),
    {
      headers: { 'Content-Type': 'application/json' },
      cookieJar: jar,
      tags: { endpoint: 'auth_login', phase },
    },
  );

  const loginOk = loginRes.status === 200;

  check(loginRes, {
    [`[spike-${phase}] login respondeu`]: (r) =>
      r.status === 200 || r.status === 429 || r.status === 503,
  });

  if (!loginOk) {
    sleep(0.5);
    return;
  }

  // ── Health check — indicador primário de saúde ────────────────────────────
  const healthRes = http.get(`${BASE_URL}/health`, {
    cookieJar: jar,
    tags: { endpoint: 'health', phase },
  });
  check(healthRes, {
    [`[spike-${phase}] health respondeu`]: (r) => r.status < 500,
    [`[spike-${phase}] health tempo < 3s`]: (r) => r.timings.duration < 3000,
  });

  sleep(0.1);

  // ── Operações primárias (acesso mais provável durante evento viral) ────────
  // A maioria dos usuários vai apenas ler alertas durante um pico
  const alertsRes = apiGet('/alerts', jar);
  check(alertsRes, {
    [`[spike-${phase}] alerts respondeu`]: (r) => r.status < 500,
  });

  sleep(0.1);

  // Apenas 10% dos VUs tentam escrever durante pico (cenário realista)
  if (Math.random() < 0.10) {
    const eventsRes = apiGet('/events', jar);
    const eventIds = extractEventIds(eventsRes, 1);
    const alertPayload = generateAlert(user.id, eventIds);

    const createRes = http.post(
      `${BASE_URL}/alerts`,
      JSON.stringify(alertPayload),
      {
        headers: { 'Content-Type': 'application/json' },
        cookieJar: jar,
        tags: { endpoint: 'create_alert', phase },
      },
    );
    check(createRes, {
      [`[spike-${phase}] criar alerta não crashou servidor`]: (r) => r.status < 500,
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  http.post(`${BASE_URL}/auth/logout`, null, {
    cookieJar: jar,
    tags: { endpoint: 'auth_logout', phase },
  });

  // Think time reduzido — usuários impacientes durante evento
  sleep(Math.random() * 0.5 + 0.1);
}
