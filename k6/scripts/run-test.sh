#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# run-test.sh — Wrapper para execução de testes K6 com Grafana
#
# Gera ID único, exibe o link do dashboard, captura log via tee.
#
# Uso interno (via package.json):
#   bash k6/scripts/run-test.sh <tipo> <script.js> [args...]
#
# Exemplos:
#   bash k6/scripts/run-test.sh smoke k6/scenarios/smoke/smoke.test.js
#   bash k6/scripts/run-test.sh load k6/scenarios/load/auth-flow.test.js
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

TYPE="${1:?Tipo do teste obrigatório (ex: smoke, load, stress)}"
SCRIPT="${2:?Caminho do script K6 obrigatório}"
shift 2

INFLUXDB_OUT="http://localhost:8086/k6"
GRAFANA_URL="http://localhost:3001"
RESULTS_DIR="k6/results"
DASH_UID="veracis-k6-main"

ID="${TYPE}_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${RESULTS_DIR}/log-${ID}.txt"

mkdir -p "$RESULTS_DIR"

cat <<EOF

🔖 Test ID  : ${ID}
🔗 Dashboard: ${GRAFANA_URL}/d/${DASH_UID}?var-testid=${ID}&refresh=5s
🖨️  PDF      : bash k6/scripts/export-pdf.sh ${ID}

EOF

# Executar K6 e capturar saída (exibir E salvar no arquivo)
k6 run \
  --tag testid="${ID}" \
  --out "influxdb=${INFLUXDB_OUT}" \
  "$SCRIPT" \
  "$@" \
  2>&1 | tee "$LOG_FILE"

EXIT_CODE="${PIPESTATUS[0]}"

echo ""
echo "📄 Log salvo: ${LOG_FILE}"
echo "🖨️  Para exportar PDF: bash k6/scripts/export-pdf.sh ${ID}"
echo ""

exit "$EXIT_CODE"
