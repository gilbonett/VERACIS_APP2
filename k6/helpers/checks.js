import { check } from 'k6';

/**
 * Funções de check reutilizáveis para os testes K6
 *
 * Padroniza as asserções e facilita a leitura dos relatórios no Grafana.
 */

/**
 * Verifica se a resposta indica sucesso (2xx)
 */
export function checkOk(res, name = '') {
  const label = name ? `[${name}] ` : '';
  return check(res, {
    [`${label}status é 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
}

/**
 * Verifica status HTTP exato
 */
export function checkStatus(res, expectedStatus, name = '') {
  const label = name ? `[${name}] ` : '';
  return check(res, {
    [`${label}status é ${expectedStatus}`]: (r) => r.status === expectedStatus,
  });
}

/**
 * Verifica se o body contém o campo JSON esperado
 */
export function checkJsonField(res, field, name = '') {
  const label = name ? `[${name}] ` : '';
  return check(res, {
    [`${label}body tem campo '${field}'`]: (r) => {
      try {
        const body = typeof r.body === 'string' ? JSON.parse(r.body) : r.body;
        return body && field in body;
      } catch {
        return false;
      }
    },
  });
}

/**
 * Verifica resposta de autenticação bem-sucedida (POST /auth/login)
 * Espera { mfaRequired: false } com cookies definidos
 */
export function checkLoginSuccess(res) {
  return check(res, {
    '[login] status 200': (r) => r.status === 200,
    '[login] mfaRequired false': (r) => {
      try {
        return JSON.parse(r.body).mfaRequired === false;
      } catch {
        return false;
      }
    },
    '[login] tempo de resposta < 2s': (r) => r.timings.duration < 2000,
  });
}

/**
 * Verifica resposta de perfil do usuário (GET /user/profile)
 */
export function checkUserProfile(res) {
  return check(res, {
    '[profile] status 200': (r) => r.status === 200,
    '[profile] tem campo success': (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch {
        return false;
      }
    },
    '[profile] tem campo data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.id !== undefined;
      } catch {
        return false;
      }
    },
    '[profile] tempo de resposta < 1s': (r) => r.timings.duration < 1000,
  });
}

/**
 * Verifica resposta de listagem de alertas (GET /alerts)
 */
export function checkAlertsList(res) {
  return check(res, {
    '[alerts] status 200': (r) => r.status === 200,
    '[alerts] body é array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
    '[alerts] tempo de resposta < 1.5s': (r) => r.timings.duration < 1500,
  });
}

/**
 * Verifica resposta de criação de alerta (POST /alerts)
 */
export function checkAlertCreated(res) {
  return check(res, {
    '[create-alert] status 201': (r) => r.status === 201,
    '[create-alert] tempo de resposta < 2s': (r) => r.timings.duration < 2000,
  });
}

/**
 * Verifica resposta de listagem de comunidades (GET /communities)
 */
export function checkCommunitiesList(res) {
  return check(res, {
    '[communities] status 200': (r) => r.status === 200,
    '[communities] tem campo data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
    '[communities] tempo de resposta < 1s': (r) => r.timings.duration < 1000,
  });
}

/**
 * Verifica resposta de listagem de categorias (GET /categories)
 */
export function checkCategoriesList(res) {
  return check(res, {
    '[categories] status 200': (r) => r.status === 200,
    '[categories] body é array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
  });
}

/**
 * Verifica resposta de listagem de eventos (GET /events)
 */
export function checkEventsList(res) {
  return check(res, {
    '[events] status 200': (r) => r.status === 200,
    '[events] body é array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
  });
}

/**
 * Verifica resposta de listagem de biomas (GET /biomes)
 */
export function checkBiomesList(res) {
  return check(res, {
    '[biomes] status 200': (r) => r.status === 200,
    '[biomes] tem campo data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });
}

/**
 * Verifica que o rate limit está sendo respeitado (429)
 */
export function checkRateLimit(res) {
  return check(res, {
    '[rate-limit] status 429': (r) => r.status === 429,
  });
}

/**
 * Verifica o health check da API
 */
export function checkHealthEndpoint(res) {
  return check(res, {
    '[health] status 200': (r) => r.status === 200,
    '[health] campo status ok': (r) => {
      try {
        return JSON.parse(r.body).status === 'ok';
      } catch {
        return false;
      }
    },
    '[health] tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });
}

/**
 * Verifica resposta root da API
 */
export function checkRootEndpoint(res) {
  return check(res, {
    '[root] status 200': (r) => r.status === 200,
    '[root] mensagem VERACIS': (r) => {
      try {
        return JSON.parse(r.body).message.includes('VERACIS');
      } catch {
        return false;
      }
    },
  });
}

/**
 * Verifica refresh token bem-sucedido
 */
export function checkRefreshToken(res) {
  return check(res, {
    '[refresh] status 200': (r) => r.status === 200,
    '[refresh] success true': (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch {
        return false;
      }
    },
  });
}

/**
 * Verifica registro de usuário
 */
export function checkUserRegistered(res) {
  return check(res, {
    '[register] status 201': (r) => r.status === 201,
    '[register] tem data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data && body.data.id;
      } catch {
        return false;
      }
    },
    '[register] tempo de resposta < 3s': (r) => r.timings.duration < 3000,
  });
}

/**
 * Extrai o primeiro ID de uma lista de alertas da resposta
 */
export function extractFirstAlertId(res) {
  try {
    const alerts = JSON.parse(res.body);
    if (Array.isArray(alerts) && alerts.length > 0) {
      return alerts[0].id;
    }
  } catch (_) {}
  return null;
}

/**
 * Extrai IDs de eventos da lista (GET /events)
 */
export function extractEventIds(res, count = 2) {
  try {
    const events = JSON.parse(res.body);
    if (Array.isArray(events)) {
      return events.slice(0, count).map((e) => e.id);
    }
  } catch (_) {}
  return [];
}
