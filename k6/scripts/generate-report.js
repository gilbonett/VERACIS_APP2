#!/usr/bin/env node
'use strict';
/**
 * generate-report.js — Gera relatório HTML de performance K6
 *
 * Consulta o InfluxDB para obter métricas por testid,
 * renderiza gráficos idênticos ao Grafana e inclui o log K6 ao final.
 *
 * Uso:
 *   node k6/scripts/generate-report.js <testid> [log-file]
 */

const fs   = require('fs');
const path = require('path');
const http = require('http');

// ── Configuração ──────────────────────────────────────────────────────────────
const INFLUXDB_RAW  = (process.env.INFLUXDB_URL || 'http://localhost:8086');
const INFLUXDB_HOST = INFLUXDB_RAW.replace(/^https?:\/\//, '').split(':')[0];
const INFLUXDB_PORT = parseInt(INFLUXDB_RAW.split(':')[2] || '8086', 10);
const INFLUXDB_DB   = 'k6';
const RESULTS_DIR   = path.join(process.cwd(), 'k6', 'results');

const testId  = process.argv[2];
const logFile = process.argv[3] || path.join(RESULTS_DIR, `log-${testId}.txt`);

if (!testId) {
  console.error('\n❌ Uso: node k6/scripts/generate-report.js <testid> [log-file]\n');
  process.exit(1);
}

// ── InfluxDB HTTP Query (zero dependências externas) ──────────────────────────
function influxQuery(q) {
  return new Promise((resolve) => {
    const opts = {
      hostname: INFLUXDB_HOST,
      port:     INFLUXDB_PORT,
      path:     `/query?db=${INFLUXDB_DB}&epoch=ms&q=${encodeURIComponent(q)}`,
      method:   'GET',
      headers:  { 'Accept': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

// ── Helpers de extração ───────────────────────────────────────────────────────
function toTimeSeries(result, colIdx = 1) {
  const series = result?.results?.[0]?.series?.[0];
  if (!series?.values) return { times: [], values: [] };
  const times = [], values = [];
  for (const row of series.values) {
    if (row[colIdx] != null) {
      times.push(row[0]);
      values.push(+row[colIdx].toFixed(3));
    }
  }
  return { times, values };
}

function toGrouped(result) {
  return result?.results?.[0]?.series || [];
}

const avg = arr => arr.length ? arr.reduce((a,b) => a + (b||0), 0) / arr.length : 0;
const max = arr => arr.length ? Math.max(...arr.filter(v => v != null)) : 0;
const fmtMs  = n => isNaN(n) || n == null ? '—' : `${Math.round(n)} ms`;
const fmtPct = n => isNaN(n) || n == null ? '—' : `${(n*100).toFixed(1)}%`;
const fmtRps = n => isNaN(n) || n == null ? '—' : `${n.toFixed(1)} req/s`;
const fmtN   = n => isNaN(n) || n == null ? '—' : Math.round(n).toString();

function humanTime(ms) {
  const d = new Date(ms);
  return d.toLocaleTimeString('pt-BR', { hour12: false });
}

// ── Buscar todas as métricas ──────────────────────────────────────────────────
async function fetchMetrics(id) {
  const W   = `WHERE "testid" = '${id}'`;
  const GBT = `GROUP BY time(15s)`;

  process.stdout.write('  ⟳ Consultando InfluxDB');
  const tick = setInterval(() => process.stdout.write('.'), 400);

  const [
    r_p50, r_p90, r_p95, r_p99,
    r_vus, r_reqs, r_errors,
    r_endpoints, r_checks,
    r_overall_dur, r_overall_err, r_overall_reqs,
  ] = await Promise.all([
    influxQuery(`SELECT percentile("value",50)  FROM "http_req_duration"  ${W} ${GBT} fill(null)`),
    influxQuery(`SELECT percentile("value",90)  FROM "http_req_duration"  ${W} ${GBT} fill(null)`),
    influxQuery(`SELECT percentile("value",95)  FROM "http_req_duration"  ${W} ${GBT} fill(null)`),
    influxQuery(`SELECT percentile("value",99)  FROM "http_req_duration"  ${W} ${GBT} fill(null)`),
    influxQuery(`SELECT max("value")            FROM "vus"                ${W} ${GBT} fill(previous)`),
    influxQuery(`SELECT non_negative_derivative(max("value"),1s) FROM "http_reqs" ${W} ${GBT} fill(null)`),
    influxQuery(`SELECT mean("value")           FROM "http_req_failed"   ${W} ${GBT} fill(null)`),
    // Tabela por endpoint
    influxQuery(`SELECT percentile("value",50),percentile("value",95),percentile("value",99),max("value"),count("value") FROM "http_req_duration" ${W} GROUP BY "endpoint"`),
    // Tabela de checks
    influxQuery(`SELECT sum("passes"),sum("fails") FROM "checks" ${W} GROUP BY "check"`),
    // Sumário geral
    influxQuery(`SELECT percentile("value",50),percentile("value",95),percentile("value",99),mean("value"),max("value") FROM "http_req_duration" ${W}`),
    influxQuery(`SELECT mean("value") FROM "http_req_failed" ${W}`),
    influxQuery(`SELECT count("value") FROM "http_reqs" ${W}`),
  ]);

  clearInterval(tick);
  process.stdout.write(' OK\n');

  const p50 = toTimeSeries(r_p50);
  const p90 = toTimeSeries(r_p90);
  const p95 = toTimeSeries(r_p95);
  const p99 = toTimeSeries(r_p99);
  const vus  = toTimeSeries(r_vus);
  const reqs = toTimeSeries(r_reqs);
  const errs = toTimeSeries(r_errors);

  // Sumário
  const ov = r_overall_dur?.results?.[0]?.series?.[0]?.values?.[0];
  const sumP50  = ov?.[1] || avg(p50.values);
  const sumP95  = ov?.[2] || avg(p95.values);
  const sumP99  = ov?.[3] || avg(p99.values);
  const sumMean = ov?.[4] || avg(p50.values);
  const sumMax  = ov?.[5] || max(p99.values);
  const sumErrRate = r_overall_err?.results?.[0]?.series?.[0]?.values?.[0]?.[1] ?? avg(errs.values);
  const sumReqTotal = r_overall_reqs?.results?.[0]?.series?.[0]?.values?.[0]?.[1] ?? 0;
  const sumVusMax = max(vus.values);
  const sumThroughput = avg(reqs.values);

  // Checks
  const checksGroups = toGrouped(r_checks);
  let totalPasses = 0, totalFails = 0;
  const checkRows = [];
  for (const s of checksGroups) {
    const pIdx = s.columns.indexOf('sum_passes');
    const fIdx = s.columns.indexOf('sum_fails');
    const passes = s.values?.[0]?.[pIdx] || 0;
    const fails  = s.values?.[0]?.[fIdx]  || 0;
    totalPasses += passes;
    totalFails  += fails;
    const name  = s.tags?.check || '(desconhecido)';
    const rate  = (passes + fails) > 0 ? (passes / (passes + fails)) * 100 : 0;
    checkRows.push({ name, passes, fails, rate });
  }
  checkRows.sort((a, b) => a.rate - b.rate); // falhos primeiro
  const checksRate = (totalPasses + totalFails) > 0
    ? (totalPasses / (totalPasses + totalFails)) * 100 : 0;

  // Endpoints
  const endpointGroups = toGrouped(r_endpoints);
  const endpointRows = endpointGroups
    .filter(s => s.tags?.endpoint)
    .map(s => {
      const v = s.values?.[0] || [];
      return {
        endpoint: s.tags.endpoint,
        p50:  v[1] || 0,
        p95:  v[2] || 0,
        p99:  v[3] || 0,
        max:  v[4] || 0,
        count: v[5] || 0,
      };
    })
    .sort((a, b) => b.p95 - a.p95);

  return {
    summary: {
      p50: sumP50, p95: sumP95, p99: sumP99,
      mean: sumMean, max: sumMax,
      errorRate: sumErrRate,
      vusMax: sumVusMax,
      throughput: sumThroughput,
      totalRequests: sumReqTotal,
      checksRate, totalPasses, totalFails,
    },
    ts: { p50, p90, p95, p99, vus, reqs, errs },
    checkRows,
    endpointRows,
  };
}

// ── Gerador HTML ──────────────────────────────────────────────────────────────
function buildHtml(id, metrics, logContent) {
  const { summary, ts, checkRows, endpointRows } = metrics;
  const date = new Date().toLocaleString('pt-BR');

  // Cor dos stat cards
  const errColor  = summary.errorRate > 0.05 ? '#F2495C' : summary.errorRate > 0.01 ? '#FF9830' : '#73BF69';
  const p95Color  = summary.p95 > 1000 ? '#F2495C' : summary.p95 > 500 ? '#FF9830' : '#73BF69';
  const chkColor  = summary.checksRate < 80 ? '#F2495C' : summary.checksRate < 98 ? '#FF9830' : '#73BF69';
  const passed    = summary.errorRate < 0.01 && summary.checksRate >= 98;

  // Serializar dados para Chart.js
  const labels   = ts.p50.times.map(humanTime);
  const ds_p50   = ts.p50.values;
  const ds_p90   = ts.p90.values;
  const ds_p95   = ts.p95.values;
  const ds_p99   = ts.p99.values;
  const ds_vus   = ts.vus.values;
  const ds_reqs  = ts.reqs.values;
  const ds_errs  = ts.errs.values.map(v => +(v * 100).toFixed(2));

  const labelsVus   = ts.vus.times.map(humanTime);
  const labelsReqs  = ts.reqs.times.map(humanTime);
  const labelsErrs  = ts.errs.times.map(humanTime);

  // Tabelas HTML
  const endpointTableRows = endpointRows.map(r => {
    const color = r.p95 > 1000 ? '#F2495C' : r.p95 > 500 ? '#FF9830' : '#73BF69';
    return `
      <tr>
        <td style="font-family:monospace;font-size:12px">${r.endpoint}</td>
        <td>${fmtMs(r.p50)}</td>
        <td style="color:${color};font-weight:bold">${fmtMs(r.p95)}</td>
        <td>${fmtMs(r.p99)}</td>
        <td>${fmtMs(r.max)}</td>
        <td>${fmtN(r.count)}</td>
      </tr>`;
  }).join('');

  const checksTableRows = checkRows.map(r => {
    const color = r.rate >= 99 ? '#73BF69' : r.rate >= 80 ? '#FF9830' : '#F2495C';
    const icon  = r.rate >= 99 ? '✓' : '✗';
    return `
      <tr>
        <td style="color:${color};font-weight:bold;width:24px">${icon}</td>
        <td style="font-family:monospace;font-size:12px">${r.name}</td>
        <td style="color:#73BF69">${fmtN(r.passes)}</td>
        <td style="color:${r.fails > 0 ? '#F2495C' : '#73BF69'}">${fmtN(r.fails)}</td>
        <td style="color:${color};font-weight:bold">${r.rate.toFixed(1)}%</td>
      </tr>`;
  }).join('');

  // Escapar log para HTML
  const logHtml = logContent
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/✓/g,'<span style="color:#73BF69">✓</span>')
    .replace(/✗/g,'<span style="color:#F2495C">✗</span>')
    .replace(/\[.*?\] THRESHOLDS/g, '<span style="color:#5794F2;font-weight:bold">$&</span>')
    .replace(/ERRO\[/g,'<span style="color:#F2495C;font-weight:bold">ERRO[</span>')
    .replace(/WARN\[/g,'<span style="color:#FF9830;font-weight:bold">WARN[</span>');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>K6 Performance Report — ${id}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Inter', 'Segoe UI', sans-serif;
    background: #111217;
    color: #d4d4d8;
    font-size: 13px;
    line-height: 1.5;
  }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, #1a1d27 0%, #1f2236 100%);
    border-bottom: 2px solid #F7801A;
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header-left h1 {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.3px;
  }
  .header-left .subtitle {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 4px;
    font-family: monospace;
  }
  .badge {
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .badge-pass { background: rgba(115,191,105,0.15); color: #73BF69; border: 1px solid #73BF69; }
  .badge-fail { background: rgba(242,73,92,0.15);  color: #F2495C; border: 1px solid #F2495C; }

  /* ── Section ── */
  .section { padding: 20px 32px; }
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #2d3039;
  }

  /* ── Stat Cards ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
  }
  .stat-card {
    background: #1f2128;
    border: 1px solid #2d3039;
    border-radius: 8px;
    padding: 14px 16px;
    position: relative;
    overflow: hidden;
  }
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--accent, #5794F2);
  }
  .stat-label {
    font-size: 11px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    margin-bottom: 8px;
  }
  .stat-value {
    font-size: 26px;
    font-weight: 700;
    color: var(--accent, #fff);
    line-height: 1;
    letter-spacing: -0.5px;
  }
  .stat-sub {
    font-size: 11px;
    color: #4b5563;
    margin-top: 6px;
  }

  /* ── Charts Grid ── */
  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .chart-card {
    background: #1f2128;
    border: 1px solid #2d3039;
    border-radius: 8px;
    padding: 16px;
  }
  .chart-title {
    font-size: 12px;
    font-weight: 600;
    color: #9ca3af;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.7px;
  }
  .chart-card canvas { max-height: 200px; }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  thead th {
    background: #16181f;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    font-size: 11px;
    font-weight: 600;
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #2d3039;
  }
  tbody tr:nth-child(even) { background: #1a1d27; }
  tbody tr:hover { background: #242736; }
  tbody td {
    padding: 7px 12px;
    border-bottom: 1px solid #1e2130;
    color: #c9cfd7;
  }
  .table-wrapper {
    background: #1f2128;
    border: 1px solid #2d3039;
    border-radius: 8px;
    overflow: hidden;
  }

  /* ── K6 Log ── */
  .log-wrapper {
    background: #0d0f14;
    border: 1px solid #2d3039;
    border-radius: 8px;
    overflow: hidden;
  }
  .log-header {
    background: #16181f;
    border-bottom: 1px solid #2d3039;
    padding: 8px 16px;
    font-size: 11px;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  pre.log-content {
    padding: 16px;
    font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
    font-size: 11.5px;
    line-height: 1.65;
    color: #c9cfd7;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: auto;
    max-height: none;
  }

  /* ── Footer ── */
  .footer {
    padding: 16px 32px;
    border-top: 1px solid #1e2130;
    display: flex;
    justify-content: space-between;
    color: #374151;
    font-size: 11px;
  }

  /* ── Print / PDF A4 ── */
  @page {
    size: A4 portrait;
    margin: 10mm 12mm;
  }

  @media print {
    /* Forçar impressão de cores de fundo e cores exatas */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      background: #111217 !important;
      font-size: 11px !important;
      width: 100%;
      max-width: 100%;
    }

    /* Seções com padding reduzido para A4 */
    .section {
      padding: 10px 0 !important;
    }
    .section-title {
      font-size: 11px !important;
      margin-bottom: 8px !important;
    }

    /* Header compacto */
    .header {
      padding: 12px 16px !important;
    }
    .header-left h1 {
      font-size: 16px !important;
    }
    .header-left .subtitle {
      font-size: 10px !important;
    }
    .badge {
      font-size: 11px !important;
      padding: 4px 12px !important;
    }

    /* Stat cards menores */
    .stats-grid {
      gap: 6px !important;
    }
    .stat-card {
      padding: 8px 10px !important;
    }
    .stat-value {
      font-size: 18px !important;
    }
    .stat-label, .stat-sub {
      font-size: 9px !important;
    }

    /* Gráficos: altura fixa para caber 2x2 em uma página A4 */
    .charts-grid {
      gap: 8px !important;
      page-break-inside: avoid;
    }
    .chart-card {
      padding: 8px !important;
    }
    .chart-title {
      font-size: 9px !important;
      margin-bottom: 6px !important;
    }
    .chart-card canvas {
      max-height: 140px !important;
      height: 140px !important;
    }

    /* Tabelas */
    thead th {
      padding: 5px 8px !important;
      font-size: 9px !important;
    }
    tbody td {
      padding: 4px 8px !important;
      font-size: 10px !important;
    }
    .table-wrapper {
      page-break-inside: avoid;
    }

    /* Dividers */
    .divider {
      margin: 0 !important;
    }

    /* Log: começa em nova página e exibe completo */
    .log-wrapper {
      page-break-before: always !important;
    }
    pre.log-content {
      max-height: none !important;
      overflow: visible !important;
      font-size: 8.5px !important;
      line-height: 1.4 !important;
      padding: 10px !important;
    }

    /* Footer compacto */
    .footer {
      padding: 8px 0 !important;
      font-size: 9px !important;
      border-top: 1px solid #2d3039;
    }
  }

  /* ── Divider ── */
  .divider { height: 1px; background: #1e2130; margin: 0 32px; }
</style>
</head>
<body>

<!-- ── Header ─────────────────────────────────────────────────────────────── -->
<div class="header">
  <div class="header-left">
    <h1>🔥 VERACIS API — K6 Performance Report</h1>
    <div class="subtitle">
      Test Run: ${id} &nbsp;|&nbsp; Gerado em: ${date}
    </div>
  </div>
  <span class="badge ${passed ? 'badge-pass' : 'badge-fail'}">
    ${passed ? '✓ PASSOU' : '✗ FALHOU'}
  </span>
</div>

<!-- ── Summary Stats ──────────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-title">📊 Resumo da Execução</div>
  <div class="stats-grid">
    <div class="stat-card" style="--accent: ${errColor}">
      <div class="stat-label">Taxa de Erro</div>
      <div class="stat-value">${fmtPct(summary.errorRate)}</div>
      <div class="stat-sub">meta: &lt; 1%</div>
    </div>
    <div class="stat-card" style="--accent: ${p95Color}">
      <div class="stat-label">p95 Latência</div>
      <div class="stat-value">${fmtMs(summary.p95)}</div>
      <div class="stat-sub">meta: &lt; 800ms</div>
    </div>
    <div class="stat-card" style="--accent: #5794F2">
      <div class="stat-label">p50 Mediana</div>
      <div class="stat-value">${fmtMs(summary.p50)}</div>
      <div class="stat-sub">p99: ${fmtMs(summary.p99)}</div>
    </div>
    <div class="stat-card" style="--accent: #B877D9">
      <div class="stat-label">VUs Máximo</div>
      <div class="stat-value">${fmtN(summary.vusMax)}</div>
      <div class="stat-sub">usuários simultâneos</div>
    </div>
    <div class="stat-card" style="--accent: #5794F2">
      <div class="stat-label">Throughput</div>
      <div class="stat-value">${fmtRps(summary.throughput)}</div>
      <div class="stat-sub">total: ${fmtN(summary.totalRequests)} reqs</div>
    </div>
    <div class="stat-card" style="--accent: ${chkColor}">
      <div class="stat-label">Checks OK</div>
      <div class="stat-value">${summary.checksRate.toFixed(0)}%</div>
      <div class="stat-sub">${fmtN(summary.totalPasses)} ✓ / ${fmtN(summary.totalFails)} ✗</div>
    </div>
  </div>
</div>

<div class="divider"></div>

<!-- ── Charts ─────────────────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-title">⏱️ Gráficos de Performance</div>
  <div class="charts-grid">
    <div class="chart-card">
      <div class="chart-title">Latência — p50 / p90 / p95 / p99</div>
      <canvas id="chartLatency"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">VUs Ativos</div>
      <canvas id="chartVus"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Throughput — Requisições por Segundo</div>
      <canvas id="chartReqs"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Taxa de Erros HTTP (%)</div>
      <canvas id="chartErrors"></canvas>
    </div>
  </div>
</div>

<div class="divider"></div>

<!-- ── Endpoint Table ─────────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-title">🔍 Performance por Endpoint</div>
  ${endpointRows.length > 0 ? `
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>p50</th>
          <th>p95</th>
          <th>p99</th>
          <th>Máx</th>
          <th>Reqs</th>
        </tr>
      </thead>
      <tbody>${endpointTableRows}</tbody>
    </table>
  </div>` : '<p style="color:#4b5563;font-style:italic;padding:8px 0">Nenhum dado de endpoint disponível (use tags endpoint nos helpers)</p>'}
</div>

<div class="divider"></div>

<!-- ── Checks Table ───────────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-title">☑️ Checks</div>
  ${checkRows.length > 0 ? `
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th style="width:24px"></th>
          <th>Check</th>
          <th>Passou</th>
          <th>Falhou</th>
          <th>Taxa</th>
        </tr>
      </thead>
      <tbody>${checksTableRows}</tbody>
    </table>
  </div>` : '<p style="color:#4b5563;font-style:italic;padding:8px 0">Nenhum check registrado</p>'}
</div>

<div class="divider"></div>

<!-- ── K6 Log ─────────────────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-title">📋 Output K6</div>
  <div class="log-wrapper">
    <div class="log-header">
      <span>●</span> Terminal output — ${id}
    </div>
    <pre class="log-content">${logHtml || '<span style="color:#4b5563">Arquivo de log não encontrado. Execute o teste com pnpm run k6:*:grafana para capturar o log.</span>'}</pre>
  </div>
</div>

<!-- ── Footer ─────────────────────────────────────────────────────────────── -->
<div class="footer">
  <span>VERACIS API — Relatório de Performance K6</span>
  <span>Test Run: ${id} | ${date}</span>
</div>

<!-- ── Chart.js Scripts ───────────────────────────────────────────────────── -->
<script>
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: true,
  animation: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      labels: { color: '#9ca3af', font: { size: 11 }, boxWidth: 12, padding: 12 },
    },
    tooltip: {
      backgroundColor: '#1f2128',
      borderColor: '#2d3039',
      borderWidth: 1,
      titleColor: '#d4d4d8',
      bodyColor: '#9ca3af',
    },
  },
  scales: {
    x: {
      ticks: { color: '#4b5563', font: { size: 10 }, maxTicksLimit: 10 },
      grid: { color: '#1e2130' },
    },
    y: {
      ticks: { color: '#4b5563', font: { size: 10 } },
      grid: { color: '#1e2130' },
    },
  },
};

// ── Latência ──────────────────────────────────────────────────────────────
new Chart(document.getElementById('chartLatency'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(labels)},
    datasets: [
      {
        label: 'p50',
        data: ${JSON.stringify(ds_p50)},
        borderColor: '#73BF69',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [4, 3],
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'p90',
        data: ${JSON.stringify(ds_p90)},
        borderColor: '#FADE2A',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'p95',
        data: ${JSON.stringify(ds_p95)},
        borderColor: '#FF9830',
        backgroundColor: 'rgba(255,152,48,0.05)',
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'p99',
        data: ${JSON.stringify(ds_p99)},
        borderColor: '#F2495C',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  },
  options: {
    ...CHART_DEFAULTS,
    scales: {
      ...CHART_DEFAULTS.scales,
      y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'ms', color: '#4b5563', font: { size: 10 } } },
    },
  },
});

// ── VUs ──────────────────────────────────────────────────────────────────
new Chart(document.getElementById('chartVus'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(labelsVus)},
    datasets: [{
      label: 'VUs',
      data: ${JSON.stringify(ds_vus)},
      borderColor: '#B877D9',
      backgroundColor: 'rgba(184,119,217,0.1)',
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      tension: 0.2,
    }],
  },
  options: {
    ...CHART_DEFAULTS,
    scales: {
      ...CHART_DEFAULTS.scales,
      y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true, title: { display: true, text: 'VUs', color: '#4b5563', font: { size: 10 } } },
    },
  },
});

// ── Throughput ────────────────────────────────────────────────────────────
new Chart(document.getElementById('chartReqs'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(labelsReqs)},
    datasets: [{
      label: 'req/s',
      data: ${JSON.stringify(ds_reqs)},
      borderColor: '#5794F2',
      backgroundColor: 'rgba(87,148,242,0.1)',
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      tension: 0.3,
    }],
  },
  options: {
    ...CHART_DEFAULTS,
    scales: {
      ...CHART_DEFAULTS.scales,
      y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true, title: { display: true, text: 'req/s', color: '#4b5563', font: { size: 10 } } },
    },
  },
});

// ── Error Rate ────────────────────────────────────────────────────────────
new Chart(document.getElementById('chartErrors'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(labelsErrs)},
    datasets: [{
      label: 'erro (%)',
      data: ${JSON.stringify(ds_errs)},
      borderColor: '#F2495C',
      backgroundColor: 'rgba(242,73,92,0.15)',
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      tension: 0.3,
    }],
  },
  options: {
    ...CHART_DEFAULTS,
    scales: {
      ...CHART_DEFAULTS.scales,
      y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true, max: 100, title: { display: true, text: '%', color: '#4b5563', font: { size: 10 } } },
    },
  },
});
</script>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📊 Gerando relatório K6 — VERACIS API`);
  console.log(`   Test ID : ${testId}`);
  console.log(`   Log file: ${logFile}\n`);

  // Garantir diretório
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

  // Buscar métricas
  const metrics = await fetchMetrics(testId);

  // Ler log
  let logContent = '';
  if (fs.existsSync(logFile)) {
    logContent = fs.readFileSync(logFile, 'utf8');
    console.log(`  ✓ Log carregado (${(logContent.length / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`  ⚠ Arquivo de log não encontrado: ${logFile}`);
  }

  // Gerar HTML
  const html = buildHtml(testId, metrics, logContent);

  const outputHtml = path.join(RESULTS_DIR, `report-${testId}.html`);
  fs.writeFileSync(outputHtml, html, 'utf8');

  console.log(`\n  ✅ Relatório HTML gerado:`);
  console.log(`     ${outputHtml}\n`);

  // Imprimir path para o shell script capturar
  process.stdout.write(`__HTML_OUTPUT__:${outputHtml}\n`);
}

main().catch(err => {
  console.error('\n❌ Erro ao gerar relatório:', err.message);
  process.exit(1);
});
