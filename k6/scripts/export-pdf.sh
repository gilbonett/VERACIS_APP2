#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# export-pdf.sh — Gera relatório HTML com gráficos + log K6 e exporta para PDF
#
# Fluxo:
#   1. Consulta o InfluxDB pelo testid
#   2. Gera HTML com gráficos Chart.js (idêntico ao Grafana)
#   3. Inclui o log K6 ao final do relatório
#   4. Converte HTML → PDF via Chrome headless
#   5. Abre o PDF automaticamente no macOS
#
# Uso:
#   bash k6/scripts/export-pdf.sh [TESTID] [ARQUIVO_SAIDA.pdf]
#   bash k6/scripts/export-pdf.sh            ← lista testids disponíveis
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

GRAFANA_URL="${GRAFANA_URL:-http://localhost:3001}"
INFLUXDB_URL="${INFLUXDB_URL:-http://localhost:8086}"
RESULTS_DIR="k6/results"
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# ── Cores ─────────────────────────────────────────────────────────────────────
GRN='\033[0;32m'; YLW='\033[1;33m'; BLU='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

# ── Se nenhum testid, listar disponíveis ─────────────────────────────────────
if [ -z "${1:-}" ]; then
  echo -e "\n${BLU}📋 Test IDs disponíveis:${NC}\n"
  curl -s "${INFLUXDB_URL}/query?db=k6&q=SHOW+TAG+VALUES+FROM+%22http_reqs%22+WITH+KEY+%3D+%22testid%22" \
    2>/dev/null \
    | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    vals = data['results'][0]['series'][0]['values']
    for v in reversed(vals):
        print(f'  → {v[1]}')
except:
    print('  (nenhum test ID — rode: pnpm run k6:smoke:grafana)')
" 2>/dev/null || echo "  (InfluxDB indisponível)"

  echo -e "\n${YLW}Uso: bash k6/scripts/export-pdf.sh <testid>${NC}"
  echo -e "${YLW}Uso: bash k6/scripts/export-pdf.sh <testid> <arquivo.pdf>${NC}\n"
  exit 0
fi

TESTID="$1"
OUTPUT="${2:-${RESULTS_DIR}/report-${TESTID}.pdf}"
LOG_FILE="${RESULTS_DIR}/log-${TESTID}.txt"
HTML_FILE="${RESULTS_DIR}/report-${TESTID}.html"

mkdir -p "$RESULTS_DIR"

echo ""
echo -e "${BLU}🖨️  Exportando relatório K6 — VERACIS API${NC}"
echo -e "${BLU}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "   Test ID  : ${GRN}${TESTID}${NC}"
echo -e "   PDF saída: ${GRN}${OUTPUT}${NC}"
if [ -f "$LOG_FILE" ]; then
  echo -e "   Log K6   : ${GRN}${LOG_FILE}${NC}"
else
  echo -e "   Log K6   : ${YLW}não encontrado (relatório sem log)${NC}"
fi
echo ""

# ── Passo 1: Gerar HTML ───────────────────────────────────────────────────────
echo -e "📊 ${YLW}[1/2] Gerando HTML com gráficos e log...${NC}"

# Captura o caminho do HTML da saída do script
HTML_OUTPUT=$(node k6/scripts/generate-report.js "$TESTID" "$LOG_FILE" 2>&1 | tee /dev/stderr | grep "__HTML_OUTPUT__:" | sed 's/__HTML_OUTPUT__://')

# Se o script não retornou o path, usar o padrão
if [ -z "$HTML_OUTPUT" ]; then
  HTML_OUTPUT="$HTML_FILE"
fi

if [ ! -f "$HTML_OUTPUT" ]; then
  echo -e "\n${RED}❌ Falha ao gerar HTML${NC}"
  exit 1
fi

echo -e "   ${GRN}✓ HTML gerado:${NC} $HTML_OUTPUT"
echo ""

# ── Passo 2: Converter HTML → PDF ────────────────────────────────────────────
echo -e "🖨️  ${YLW}[2/2] Convertendo HTML → PDF (Chrome headless)...${NC}"

ABS_OUTPUT="$(cd "$(dirname "$OUTPUT")"; pwd)/$(basename "$OUTPUT")"

if [ ! -f "$CHROME_PATH" ]; then
  echo -e "\n${YLW}⚠ Chrome não encontrado — abrindo HTML no navegador padrão${NC}"
  echo -e "   Para PDF: abra o arquivo e use Cmd+P → Salvar como PDF"
  open "$HTML_OUTPUT"
  echo ""
  echo -e "${GRN}✅ Relatório HTML:${NC} $HTML_OUTPUT"
  exit 0
fi

"$CHROME_PATH" \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --disable-dev-shm-usage \
  --print-to-pdf="$ABS_OUTPUT" \
  --print-to-pdf-no-header \
  --no-pdf-header-footer \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=20000 \
  --disable-extensions \
  --window-size=794,1123 \
  "file://$HTML_OUTPUT" 2>/dev/null

echo ""
if [ -f "$ABS_OUTPUT" ]; then
  SIZE=$(du -sh "$ABS_OUTPUT" | cut -f1)
  echo -e "${GRN}✅ PDF gerado com sucesso! (${SIZE})${NC}"
  echo -e "   📄 ${ABS_OUTPUT}"
  echo ""
  open "$ABS_OUTPUT"
else
  echo -e "${YLW}⚠ PDF não gerado pelo Chrome — abrindo HTML como alternativa${NC}"
  open "$HTML_OUTPUT"
  echo -e "   💡 Use Cmd+P → Salvar como PDF"
fi

echo ""
echo -e "${BLU}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GRN}🎉 Relatório pronto — Test ID: ${TESTID}${NC}"
echo ""
