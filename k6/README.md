# 🔥 Testes de Performance — VERACIS_APP com Grafana K6

Suíte completa de testes de **carga**, **desempenho** e **stress** da API VERACIS usando [Grafana K6](https://k6.io/).

---

## 📋 Pré-requisitos

| Ferramenta | Versão | Instalação |
|-----------|--------|-----------|
| [K6](https://k6.io/docs/get-started/installation/) | ≥ 0.49 | `brew install k6` |
| [Docker Desktop](https://www.docker.com/) | qualquer | Para Grafana |
| API rodando | — | `pnpm run dev` |
| Seed executado | — | `pnpm run --filter @veracis/api db:seed` |

> ⚠️ **Importante:** Execute o seed do banco antes de rodar os testes.
> Os testes autenticados usam os usuários criados pelo seed.

---

## 🗂️ Estrutura

```
k6/
├── config/
│   ├── environments.js     # URLs por ambiente (local/staging/prod)
│   └── thresholds.js       # Limites de performance por tipo de teste
├── helpers/
│   ├── auth.js             # Login, logout, refresh + usuários seed
│   ├── http.js             # Wrapper HTTP padronizado
│   ├── data-generator.js   # Gerador de dados (CPF, coordenadas Manaus)
│   └── checks.js           # Assertions reutilizáveis por endpoint
├── scenarios/
│   ├── smoke/
│   │   └── smoke.test.js       # ✅ Validação básica (1 VU)
│   ├── load/
│   │   ├── auth-flow.test.js   # 🔵 Fluxo completo autenticado (50 VUs)
│   │   ├── read-only.test.js   # 🔵 Leituras paralelas (80 VUs)
│   │   └── write-ops.test.js   # 🔵 Operações de escrita (30 VUs)
│   ├── stress/
│   │   └── stress.test.js      # 🔴 Escalada 10→400 VUs (encontra limite)
│   ├── spike/
│   │   └── spike.test.js       # ⚡ Pico repentino 10→500 VUs em 30s
│   └── soak/
│       └── soak.test.js        # 🏊 Estabilidade por 30 minutos
├── grafana/
│   ├── dashboards/
│   │   └── k6-dashboard.json   # Dashboard pré-configurado
│   └── provisioning/
│       ├── datasources/influxdb.yml
│       └── dashboards/dashboard.yml
├── docker-compose.k6.yml       # Stack K6 + InfluxDB + Grafana
└── README.md                   # Este arquivo
```

---

## 🚀 Início Rápido

### 1. Iniciar stack de observabilidade (Grafana + InfluxDB)

```bash
pnpm run k6:dashboard:up
```

Acesse o Grafana em **http://localhost:3001**
- Usuário: `admin` | Senha: `veracis123`
- O dashboard **"VERACIS — K6 Performance Dashboard"** estará disponível

### 2. Rodar o Smoke Test (validação rápida)

```bash
# Sem Grafana (output no terminal)
pnpm run k6:smoke

# Com Grafana (recomendado)
pnpm run k6:smoke:grafana
```

---

## 📊 Cenários de Teste

### 🟢 Smoke Test
**Objetivo:** Validar que todos os endpoints respondem corretamente.

```bash
pnpm run k6:smoke
# ou com Grafana:
pnpm run k6:smoke:grafana
```

| Parâmetro | Valor |
|-----------|-------|
| VUs | 1 |
| Iterações | 1 |
| Duração | ~2 min |
| Endpoints cobertos | 13+ |

---

### 🔵 Load Tests
**Objetivo:** Simular carga normal de produção.

```bash
# Fluxo completo autenticado (login → alertas → comentários → logout)
pnpm run k6:load:auth

# Operações de leitura (GET endpoints, cenários paralelos)
pnpm run k6:load:read

# Operações de escrita (criar alertas, comentários, reações)
pnpm run k6:load:write
```

| Teste | VUs Pico | Duração | Foco |
|-------|----------|---------|------|
| `auth-flow` | 50 | ~11 min | Fluxo completo de usuário |
| `read-only` | 80 | ~10 min | Performance de leitura |
| `write-ops` | 30 | ~8 min | Escrita no banco |

**Thresholds:**
- `p95 < 800ms` | `erros < 1%` | `throughput > 10 req/s`

---

### 🔴 Stress Test
**Objetivo:** Aumentar VUs progressivamente até encontrar o limite da API.

```bash
pnpm run k6:stress
# ou com Grafana:
pnpm run k6:stress:grafana
```

| Nível | VUs | Duração |
|-------|-----|---------|
| Baseline | 10 | 3 min |
| Normal | 50 | 3 min |
| Pesado | 100 | 3 min |
| Stress | 200 | 3 min |
| Extremo | 300 | 3 min |
| Limite | 400 | 3 min |
| Recovery | 50 | 3 min |

**Total:** ~24 minutos

**Observe no Grafana:**
- Em qual nível o `p95` ultrapassa 2 segundos?
- Em qual nível a taxa de erro sobe acima de 5%?
- Onde o throughput para de crescer (saturação)?

---

### ⚡ Spike Test
**Objetivo:** Simular picos abruptos de tráfego (evento viral).

```bash
pnpm run k6:spike
# ou com Grafana:
pnpm run k6:spike:grafana
```

| Fase | VUs | Duração |
|------|-----|---------|
| Baseline | 10 | 1 min |
| **Explosão 1** | **500** | 30s ramp + 1 min |
| Recovery 1 | 10 | 2 min |
| Observação | 10 | 2 min |
| **Explosão 2** | **500** | 30s ramp + 1 min |
| Recovery 2 | 10 | 2 min |

**Pergunta-chave:** A API se recupera completamente entre os picos?

---

### 🏊 Soak Test
**Objetivo:** Detectar memory leaks, degradação gradual e instabilidade.

```bash
# Padrão: 30 VUs por 30 minutos
pnpm run k6:soak

# Estendido: 1 hora
k6 run -e SOAK_DURATION=1h k6/scenarios/soak/soak.test.js

# Extendido com mais VUs e Grafana
k6 run -e SOAK_DURATION=1h -e SOAK_VUS=50 \
  --out influxdb=http://localhost:8086/k6 \
  k6/scenarios/soak/soak.test.js
```

**Monitore no Grafana:**
- O `p95` está crescendo ao longo do tempo? (indicador de memory leak)
- O heap do Node.js está crescendo? (verificar métricas do servidor)
- Há aumento gradual na taxa de erros?

---

## 🌍 Ambientes

Por padrão os testes rodam contra `http://localhost:3333`.

```bash
# Staging
k6 run -e ENV=staging -e STAGING_URL=https://staging-api.veracis.com \
  k6/scenarios/smoke/smoke.test.js

# Produção (cuidado!)
k6 run -e ENV=production -e PROD_URL=https://api.veracis.com \
  k6/scenarios/smoke/smoke.test.js
```

---

## 👥 Usuários de Teste (Seed)

Todos os testes autenticados usam os usuários criados pelo seed:

| Usuário | CPF | Papel | Status |
|---------|-----|-------|--------|
| Admin Veracis | `46477239094` | MANAGER | ✅ Ativo |
| Carlos Amazonas | `52998224725` | COMMUNITY_LEADER | ✅ Ativo |
| Beatriz Cerrado | `07077902071` | COMMUNITY_LEADER | ✅ Ativo |
| Ana Silva | `71428793860` | COMMUNITY_MEMBER | ✅ Ativo |

**Senha de todos:** `Password@123`

---

## 📈 Métricas Monitoradas

| Métrica K6 | Descrição |
|-----------|-----------|
| `http_req_duration` | Tempo total da requisição (p50, p90, p95, p99) |
| `http_req_failed` | Taxa de requisições com erro |
| `http_reqs` | Throughput total (req/s) |
| `http_req_waiting` | Tempo aguardando resposta do servidor (TTFB) |
| `http_req_connecting` | Tempo de estabelecimento de conexão TCP |
| `vus` | VUs ativos no momento |
| `checks` | Taxa de sucesso das asserções |
| `iterations` | Número de iterações completadas |

---

## 🔧 Thresholds por Tipo de Teste

| Métrica | Smoke | Load | Stress | Spike | Soak |
|---------|-------|------|--------|-------|------|
| `p95 duration` | < 2s | < 800ms | < 3s | < 5s | < 1s |
| `error rate` | < 1% | < 1% | < 10% | < 15% | < 0.5% |
| `checks pass` | > 99% | > 98% | > 85% | > 80% | > 98% |

---

## 🐛 Troubleshooting

### ❌ "dial tcp: connection refused"
A API não está rodando. Execute:
```bash
pnpm run dev
```

### ❌ Login retorna 429 (Too Many Requests)
O rate limiter está ativo (5 req/min para login). Durante stress/spike tests, isso é **esperado e intencional**.

### ❌ "GONOSUCHFILE" no K6
Verifique se está rodando os comandos a partir da **raiz do monorepo**.

### ❌ Grafana sem dados
Verifique se o InfluxDB está rodando:
```bash
docker compose -f k6/docker-compose.k6.yml ps
```

---

## 📚 Referências

- [K6 Documentation](https://k6.io/docs/)
- [K6 InfluxDB Output](https://k6.io/docs/results-output/real-time/influxdb/)
- [K6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [Grafana K6 Dashboard](https://grafana.com/grafana/dashboards/2587-k6-load-testing-results/)
