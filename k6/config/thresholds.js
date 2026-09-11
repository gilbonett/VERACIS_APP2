/**
 * Thresholds globais reutilizáveis por tipo de teste
 *
 * Documentação K6: https://k6.io/docs/using-k6/thresholds/
 */

/**
 * Thresholds para Smoke Test
 * Critérios mínimos — apenas valida que a API responde
 */
export const smokeThresholds = {
  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }], // < 1% de erros
  http_req_duration: ['p(95)<2000'],                                 // 95% < 2s
  checks: [{ threshold: 'rate>0.99', abortOnFail: true }],          // > 99% checks passam
};

/**
 * Thresholds para Load Test
 * Carga normal de produção
 */
export const loadThresholds = {
  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: false }], // < 1% de erros
  http_req_duration: [
    'p(50)<300',   // mediana < 300ms
    'p(90)<500',   // p90 < 500ms
    'p(95)<800',   // p95 < 800ms
    'p(99)<1500',  // p99 < 1.5s
  ],
  checks: ['rate>0.98'],                                              // > 98% checks passam
  http_reqs: ['rate>10'],                                             // throughput mínimo: 10 req/s
};

/**
 * Thresholds para Stress Test
 * Limites mais relaxados — objetivo é encontrar o ponto de quebra
 */
export const stressThresholds = {
  http_req_failed: ['rate<0.10'],    // aceita até 10% de erros
  http_req_duration: [
    'p(95)<3000',  // p95 < 3s
    'p(99)<5000',  // p99 < 5s
  ],
  checks: ['rate>0.85'],             // > 85% checks passam
};

/**
 * Thresholds para Spike Test
 * Tolerância a degradação momentânea
 */
export const spikeThresholds = {
  http_req_failed: ['rate<0.15'],    // aceita até 15% de erros durante spike
  http_req_duration: [
    'p(95)<5000',  // p95 < 5s durante pico
  ],
  checks: ['rate>0.80'],             // > 80% checks passam
};

/**
 * Thresholds para Soak Test
 * Foco em estabilidade ao longo do tempo
 */
export const soakThresholds = {
  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: false }], // < 1% de erros
  http_req_duration: [
    'p(95)<1000',  // p95 < 1s
    'p(99)<2000',  // p99 < 2s
  ],
  checks: ['rate>0.98'],             // > 98% checks passam ao longo do tempo
};
