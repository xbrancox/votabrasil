/* ============================================================
   ATUALIZAR FUNDO ELEITORAL — snapshot data/fundo-eleitoral.json
   ------------------------------------------------------------
   Regenera `porPolitico` (valores FEFC por candidato) a partir do
   arquivo OFICIAL de receitas da prestação de contas 2026 do TSE.

   REGRA COMPROVADA (15/09/2026): soma, por SQ_CANDIDATO, das linhas
   com DS_FONTE_RECEITA contendo "FUNDO ESPECIAL" e origem
   "Recursos de partido político" OU "Recursos de outros candidatos".
   Reproduz 9.121/9.121 candidatos e R$ 3.107.211.522,33 — o total
   distribuído pelo FEFC nas prestações já publicadas. Nunca inventa
   valor: linha sem registro na fonte não entra no snapshot.

   USO:
     node scripts/atualizar-fundo-eleitoral.js <csv-receitas-brasil>
   Ex.: baixando do espelho público (raw.githubusercontent falha
   nesta máquina; use a API de blobs do GitHub com
   Accept: application/vnd.github.raw). O script também grava
   tmp/fefc_detalhe.json (repasses linha-a-linha por SQ), lido pelo
   endpoint /api/fundo-eleitoral/detalhe/.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT = path.join(ROOT, 'data', 'fundo-eleitoral.json');
const DETALHE = path.join(ROOT, 'tmp', 'fefc_detalhe.json');

function parseCsv(buf) {
  const txt = buf.toString('latin1');
  const rows = []; let row = [], cell = '', inQ = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (inQ) {
      if (ch === '"') { if (txt[i + 1] === '"') { cell += '"'; i++ } else inQ = false }
      else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ';') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '' }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows;
}
function vlr(s) { return parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0 }

const csvPath = process.argv[2];
if (!csvPath || !fs.existsSync(csvPath)) {
  console.error('Uso: node scripts/atualizar-fundo-eleitoral.js <csv receitas_candidatos BRASIL>');
  process.exit(1);
}
const rows = parseCsv(fs.readFileSync(csvPath));
const h = rows[0];
const idx = n => { const i = h.indexOf(n); if (i < 0) throw new Error('coluna ausente: ' + n); return i };
const SI = idx('SQ_CANDIDATO'), OI = idx('DS_ORIGEM_RECEITA'), VI = idx('VR_RECEITA'),
  FI = idx('DS_FONTE_RECEITA'), DI = idx('DT_RECEITA'), ND = idx('NM_DOADOR_RFB'),
  ES = idx('DS_ESFERA_PARTIDARIA_DOADOR'), SG = idx('SG_PARTIDO'), UF = idx('SG_UF'),
  CG = idx('DS_CARGO'), NC = idx('NM_CANDIDATO');

const sum = {}, det = {};
for (let i = 1; i < rows.length; i++) {
  const a = rows[i]; if (!a[SI]) continue;
  const fe = /FUNDO ESPECIAL/i.test(a[FI] || '');
  const part = a[OI] === 'Recursos de partido político';
  const outro = a[OI] === 'Recursos de outros candidatos';
  if (!(fe && (part || outro))) continue;
  const v = vlr(a[VI]);
  sum[a[SI]] = (sum[a[SI]] || 0) + v;
  (det[a[SI]] = det[a[SI]] || []).push({
    data: a[DI] || '', doador: a[ND] || '', esfera: a[ES] || '',
    tipo: part ? 'Partido' : 'Outro candidato', valor: Math.round(v * 100) / 100
  });
}
for (const k in det) det[k].sort((x, y) => String(y.data).localeCompare(String(x.data)));

/* metadados dos candidatos vêm do snapshot versionado (nome civil/cargo/UF/partido) */
const snapFile = path.join(ROOT, 'data', 'candidatos-2026.json');
const meta = {};
if (fs.existsSync(snapFile)) {
  for (const c of JSON.parse(fs.readFileSync(snapFile, 'utf8')).candidatos) meta[String(c.sq)] = c;
}

const fundo = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
const porPolitico = [];
for (const k in sum) {
  if (sum[k] <= 0) continue;
  const m = meta[k];
  porPolitico.push({
    sq: k, nome: m ? m.nomeCivil : '', cargo: m ? m.cargo : null, uf: m ? m.uf : (rows.find(r => r[SI] === k) || [])[UF] || '',
    partido: m ? m.partido : '', ano: 2026,
    valor: Math.round(sum[k] * 100) / 100,
    origem: (det[k].some(d => d.tipo === 'Partido') ? 'Repasse partidário (FEFC)' : '') +
      (det[k].some(d => d.tipo === 'Outro candidato') ? (det[k].some(x => x.tipo === 'Partido') ? ' + ' : '') + 'Repasse de outro candidato (FEFC)' : '')
  });
}
porPolitico.sort((a, b) => b.valor - a.valor);
fundo.porPolitico = porPolitico;
fundo.atualizadoEm = new Date().toISOString().slice(0, 10);
fundo.fontePorPolitico = 'TSE — Relatório Financeiro das Prestações de Contas Eleitorais 2026 (arquivo oficial receitas_candidatos); soma, por SQ_CANDIDATO, das receitas com fonte declarada FUNDO ESPECIAL DE FINANCIAMENTO DE CAMPANHA recebidas de órgãos partidários ou de outros candidatos.';
fs.writeFileSync(SNAPSHOT, JSON.stringify(fundo));
fs.writeFileSync(DETALHE, JSON.stringify(det));

const total = porPolitico.reduce((s, p) => s + p.valor, 0);
console.log('[ok] porPolitico:', porPolitico.length, '· soma R$', total.toFixed(2), '· detalhe:', Object.keys(det).length, 'sqs,', Object.values(det).reduce((s, v) => s + v.length, 0), 'linhas');
