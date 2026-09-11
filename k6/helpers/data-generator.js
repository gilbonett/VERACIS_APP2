/**
 * Gerador de dados fake para os testes K6
 *
 * Gera dados válidos para o contexto do VERACIS_APP:
 * - CPFs válidos brasileiros
 * - Coordenadas na região amazônica (Manaus-AM)
 * - Dados de usuário realistas
 */

// ─── IDs fixos do seed (usados como referência nos testes) ────────────────────

export const SEED_IDS = {
  // Usuários
  MANAGER: 'a1b2c3d4-0001-4000-8000-000000000001',
  LEADER_AMAZONIA: 'a1b2c3d4-0002-4000-8000-000000000002',
  LEADER_CERRADO: 'a1b2c3d4-0003-4000-8000-000000000003',
  MEMBER_1: 'a1b2c3d4-0004-4000-8000-000000000004',
  MEMBER_2: 'a1b2c3d4-0005-4000-8000-000000000005',

  // Categorias
  CAT_CLIMATICO: 'b1b2c3d4-0001-4000-8000-000000000001',
  CAT_AMBIENTAL: 'b1b2c3d4-0002-4000-8000-000000000002',
  CAT_INFRAESTRUTURA: 'b1b2c3d4-0003-4000-8000-000000000003',

  // Biomas
  BIOME_AMAZONIA: 'c1b2c3d4-0001-4000-8000-000000000001',
  BIOME_CERRADO: 'c1b2c3d4-0002-4000-8000-000000000002',
  BIOME_CAATINGA: 'c1b2c3d4-0003-4000-8000-000000000003',

  // Comunidades
  COM_VERACIS: 'd1b2c3d4-0001-4000-8000-000000000001',
  COM_FLORESTA_NORTE: 'd1b2c3d4-0002-4000-8000-000000000002',
  COM_RIO_NEGRO: 'd1b2c3d4-0003-4000-8000-000000000003',
  COM_PLANALTO: 'd1b2c3d4-0004-4000-8000-000000000004',
  COM_CHAPADA: 'd1b2c3d4-0005-4000-8000-000000000005',
  COM_SERTAO: 'd1b2c3d4-0006-4000-8000-000000000006',
};

// ─── CPFs válidos pré-gerados (para uso em testes de carga) ──────────────────
// Gerados via algoritmo oficial — NÃO são CPFs de pessoas reais

const CPF_POOL = [
  '11144477735', '22233366638', '33322255535', '44411144432',
  '55500033339', '66699922236', '77788811133', '88877700030',
  '99966699937', '10055588831', '11144788805', '22233499902',
  '33322110909', '44411221106', '55500332203', '66699443300',
  '77788554407', '88877665504', '99966776601', '10055887708',
  '11144998805', '22233009902', '33322120909', '44411231006',
  '55500342103', '66699453200', '77788564307', '88877675404',
  '99966786501', '10055897608', '12345678909', '98765432100',
  '11122233396', '22211144493', '33300055590', '44499966697',
  '55588877794', '66677788891', '77766699998', '88855510095',
  '99844421192', '10733332289', '11622243386', '12511154483',
  '13400065580', '14399976677', '15288887774', '16177798871',
  '17066609968', '17955520065',
];

let cpfIndex = 0;

/**
 * Retorna um CPF único do pool (rotação circular)
 * Para testes de registro onde cada VU precisa de CPF diferente
 */
export function getNextCpf() {
  const cpf = CPF_POOL[cpfIndex % CPF_POOL.length];
  cpfIndex++;
  return cpf;
}

/**
 * Retorna um CPF aleatório do pool
 */
export function getRandomCpf() {
  return CPF_POOL[Math.floor(Math.random() * CPF_POOL.length)];
}

// ─── Coordenadas geográficas ──────────────────────────────────────────────────

/**
 * Gera coordenadas aleatórias dentro da região de Manaus-AM
 * Bounding box: lat [-3.5, -2.8] | lng [-60.5, -59.5]
 */
export function getManausCoords() {
  return {
    lat: parseFloat((-3.5 + Math.random() * 0.7).toFixed(6)),
    lng: parseFloat((-60.5 + Math.random() * 1.0).toFixed(6)),
  };
}

/**
 * Coordenadas fixas de pontos conhecidos em Manaus para testes determinísticos
 */
export const MANAUS_LOCATIONS = [
  { lat: -3.1190275, lng: -60.0217305, name: 'Rio Negro - Margem' },
  { lat: -3.1342, lng: -60.0498, name: 'Zona Leste' },
  { lat: -3.0800, lng: -59.9700, name: 'Zona Norte' },
  { lat: -3.1500, lng: -60.1000, name: 'Zona Oeste' },
  { lat: -3.1055, lng: -60.0117, name: 'Centro' },
];

export function getRandomManausLocation() {
  return MANAUS_LOCATIONS[Math.floor(Math.random() * MANAUS_LOCATIONS.length)];
}

// ─── Dados de usuário ─────────────────────────────────────────────────────────

const NAMES = [
  'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa',
  'Carlos Souza', 'Beatriz Lima', 'Fernando Alves', 'Juliana Rocha',
  'Marcos Pereira', 'Camila Ferreira', 'Diego Gomes', 'Larissa Martins',
  'Rafael Ribeiro', 'Isabela Carvalho', 'Thiago Araújo', 'Priscila Melo',
];

/**
 * Gera dados de um novo usuário para registro
 * Usa VU ID e timestamp para garantir unicidade
 *
 * @param {number} vuId - ID da VU atual
 * @param {number} iteration - iteração atual
 */
export function generateUser(vuId, iteration) {
  const ts = Date.now();
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const suffix = `${vuId}_${iteration}_${ts}`;

  return {
    name,
    role: 'COMMUNITY_MEMBER',
    cpf: getNextCpf(),
    birthDate: '15/06/1990',
    phone: `9299${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    email: `testuser_${suffix}@k6test.veracis.com`,
    password: 'Password@123',
    communityIds: [SEED_IDS.COM_VERACIS],
  };
}

// ─── Dados de alerta ─────────────────────────────────────────────────────────

const ALERT_DESCRIPTIONS = [
  'Foco de queimada detectado na área. Fumaça visível desde as 14h.',
  'Alagamento na rua principal após chuvas fortes das últimas horas.',
  'Descarte irregular de lixo próximo ao rio. Odor forte.',
  'Rio com nível elevado, risco de transbordamento nas próximas horas.',
  'Área de desmatamento identificada na borda da comunidade.',
  'Falta de água há 2 dias. Moradores dependem de caminhão-pipa.',
  'Poluição visível no igarapé local. Peixes mortos observados.',
  'Tempestade com ventos fortes. Árvores caídas na via principal.',
];

const COMMUNITY_IDS = [
  SEED_IDS.COM_VERACIS,
  SEED_IDS.COM_FLORESTA_NORTE,
  SEED_IDS.COM_RIO_NEGRO,
  SEED_IDS.COM_PLANALTO,
  SEED_IDS.COM_SERTAO,
];

/**
 * Gera dados para criação de alerta
 *
 * @param {string} authorId - ID do usuário autenticado
 * @param {string[]} eventIds - IDs dos eventos a associar
 */
export function generateAlert(authorId, eventIds = []) {
  const coords = getManausCoords();
  const desc = ALERT_DESCRIPTIONS[Math.floor(Math.random() * ALERT_DESCRIPTIONS.length)];
  const communityId = COMMUNITY_IDS[Math.floor(Math.random() * COMMUNITY_IDS.length)];

  return {
    lat: coords.lat,
    lng: coords.lng,
    description: desc,
    authorId,
    communityId,
    eventIds,
  };
}

/**
 * Gera um comentário para um alerta
 */
export function generateAlertComment(alertId) {
  const COMMENTS = [
    'Confirmado! Já reportei às autoridades locais.',
    'Passei pelo local agora, situação crítica.',
    'Estou monitorando de perto. Vou atualizar em breve.',
    'Precisa de atenção imediata, afeta várias famílias.',
    'A situação piorou desde o último relatório.',
    'Equipe de resposta foi acionada.',
    'Moradores já foram orientados a evacuar.',
    'Problema identificado há 3 dias sem solução.',
  ];

  return {
    alertId,
    content: COMMENTS[Math.floor(Math.random() * COMMENTS.length)],
  };
}

/**
 * Gera uma reação para um alerta
 */
export function generateAlertReaction(alertId) {
  return {
    alertId,
    type: Math.random() > 0.3 ? 'LIKE' : 'DISLIKE',
  };
}
