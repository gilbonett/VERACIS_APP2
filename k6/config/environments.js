/**
 * Configuração de ambientes para os testes K6
 *
 * Selecione o ambiente via variável de ambiente:
 *   k6 run -e ENV=staging script.js
 */

const ENVIRONMENTS = {
  local: {
    BASE_URL: 'http://localhost:3333',
    LABEL: 'Local Development',
  },
  staging: {
    BASE_URL: __ENV.STAGING_URL || 'https://test-api.veracis.com',
    LABEL: 'Staging',
  },
  production: {
    BASE_URL: __ENV.PROD_URL || 'https://api.veracis-app.com',
    LABEL: 'Production',
  },
};

const ENV = __ENV.ENV || 'local';

export const config = {
  ...ENVIRONMENTS[ENV],
  ENV,
};

export const BASE_URL = config.BASE_URL;
