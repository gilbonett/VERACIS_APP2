import http from 'k6/http';
import { BASE_URL } from '../config/environments.js';

/**
 * Wrapper HTTP para a API VERACIS
 *
 * Padroniza headers, cookie jar e tags para todos os requests.
 * A autenticação é feita via cookies (não Authorization header).
 */

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'K6-LoadTest/1.0',
};

/**
 * GET autenticado (via cookie jar)
 */
export function apiGet(path, jar, extraParams = {}) {
  return http.get(`${BASE_URL}${path}`, {
    headers: DEFAULT_HEADERS,
    cookieJar: jar,
    tags: { endpoint: pathToTag(path) },
    ...extraParams,
  });
}

/**
 * GET com query string
 */
export function apiGetWithQuery(path, queryParams, jar, extraParams = {}) {
  const qs = Object.entries(queryParams)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const url = qs ? `${BASE_URL}${path}?${qs}` : `${BASE_URL}${path}`;

  return http.get(url, {
    headers: DEFAULT_HEADERS,
    cookieJar: jar,
    tags: { endpoint: pathToTag(path) },
    ...extraParams,
  });
}

/**
 * POST com body JSON
 */
export function apiPost(path, body, jar, extraParams = {}) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: DEFAULT_HEADERS,
    cookieJar: jar,
    tags: { endpoint: pathToTag(path) },
    ...extraParams,
  });
}

/**
 * PUT com body JSON
 */
export function apiPut(path, body, jar, extraParams = {}) {
  return http.put(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: DEFAULT_HEADERS,
    cookieJar: jar,
    tags: { endpoint: pathToTag(path) },
    ...extraParams,
  });
}

/**
 * DELETE
 */
export function apiDelete(path, jar, extraParams = {}) {
  return http.del(`${BASE_URL}${path}`, null, {
    headers: DEFAULT_HEADERS,
    cookieJar: jar,
    tags: { endpoint: pathToTag(path) },
    ...extraParams,
  });
}

/**
 * POST público (sem cookie jar)
 */
export function apiPublicPost(path, body, extraParams = {}) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: DEFAULT_HEADERS,
    tags: { endpoint: pathToTag(path) },
    ...extraParams,
  });
}

/**
 * GET público (sem cookie jar)
 */
export function apiPublicGet(path, extraParams = {}) {
  return http.get(`${BASE_URL}${path}`, {
    headers: DEFAULT_HEADERS,
    tags: { endpoint: pathToTag(path) },
    ...extraParams,
  });
}

/**
 * Converte path em tag legível para o Grafana
 * Ex: /alerts/:alertId → alerts_alertId
 */
function pathToTag(path) {
  return path
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/:/g, '')
    .replace(/-/g, '_')
    .replace(/\?.*/, '')
    .toLowerCase()
    .slice(0, 50); // limite de tamanho de tag K6
}
