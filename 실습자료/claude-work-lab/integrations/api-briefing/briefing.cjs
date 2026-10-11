#!/usr/bin/env node
'use strict';
// Node 22/24 LTS. 외부 패키지 없이 GET 한 번 → 검증 → 파일 네 개.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const ENDPOINT = 'https://api.frankfurter.dev/v2/providers/ecb/rate/usd/krw';
const SOURCE = 'Frankfurter v2 / European Central Bank (ECB)';
const DISCLAIMER = '기준환율로 계산한 참고금액입니다. 은행·카드의 실제 거래환율, 수수료, 결제금액이 아닙니다.';
const FILES = ['rate.json', 'briefing.html', 'share.txt', 'verification.json'];
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function parseArgs(args) {
  const opts = { amount: 100, output: 'output/api', fixture: null, summary: null };
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--help' || key === '-h') return { help: true };
    if (!['--amount', '--output', '--fixture', '--summary'].includes(key) || seen.has(key)) throw new Error(`알 수 없거나 중복된 옵션: ${key}`);
    seen.add(key);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`${key} 뒤에 값을 입력하세요.`);
    if (key === '--amount') {
      if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('금액은 0 이상의 숫자, 소수 둘째 자리까지 입력하세요.');
      opts.amount = Number(value);
    } else if (key === '--output') opts.output = value;
    else if (key === '--fixture') opts.fixture = value;
    else opts.summary = value;
  }
  validateAmount(opts.amount);
  return opts;
}

function validateAmount(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 1e9) throw new Error('금액은 0~1,000,000,000 USD 범위여야 합니다.');
}

function validateRate(raw, now = new Date()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('API 응답은 단일 JSON 객체여야 합니다.');
  if (raw.base !== 'USD' || raw.quote !== 'KRW') throw new Error('통화 검증 실패: USD → KRW 응답만 허용합니다.');
  if (typeof raw.rate !== 'number' || !Number.isFinite(raw.rate) || raw.rate <= 0) throw new Error('환율 검증 실패: 0보다 큰 유한한 숫자가 필요합니다.');
  if (typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) throw new Error('기준일 형식은 YYYY-MM-DD여야 합니다.');
  const date = new Date(`${raw.date}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== raw.date) throw new Error('기준일이 실제 달력 날짜가 아닙니다.');
  if (raw.date > now.toISOString().slice(0, 10)) throw new Error('기준일이 조회일보다 미래입니다. 컴퓨터 날짜도 확인하세요.');
  return { date: raw.date, base: 'USD', quote: 'KRW', rate: raw.rate };
}

function readSummary(file) {
  if (!file) return null;
  const bytes = fs.readFileSync(path.resolve(file));
  const value = JSON.parse(bytes.toString('utf8'));
  const countKeys = ['inputRows', 'validRows', 'duplicateRows', 'errorRows'];
  if (!countKeys.every(k => Number.isSafeInteger(value[k]) && value[k] >= 0) || value.inputRows !== value.validRows || value.errorRows !== 0 || value.duplicateRows !== 0) throw new Error('비용 요약의 건수 또는 오류 검증이 일치하지 않습니다. 먼저 정상 보고서를 만드세요.');
  if (value.qualityChecked !== true || value.qualityStatus !== 'passed') throw new Error('원본 검사를 통과한 로컬 비용 요약만 사용합니다.');
  if (!Number.isSafeInteger(value.totalAmount) || value.totalAmount < 0 || !value.byDepartment || typeof value.byDepartment !== 'object' || Array.isArray(value.byDepartment)) throw new Error('비용 요약의 금액 또는 부서별 합계가 올바르지 않습니다.');
  const parts = Object.values(value.byDepartment);
  if (!parts.length || !parts.every(v => Number.isSafeInteger(v) && v >= 0) || parts.reduce((a, b) => a + b, 0) !== value.totalAmount) throw new Error('국내비용 총액과 부서별 합계가 일치하지 않습니다.');
  if (!value.byStatus || typeof value.byStatus !== 'object') throw new Error('비용 요약의 상태별 건수가 없습니다.');
  const statuses = Object.values(value.byStatus);
  if (!statuses.length || !statuses.every(s => s && Number.isSafeInteger(s.rows) && s.rows >= 0 && Number.isSafeInteger(s.amount) && s.amount >= 0) || statuses.reduce((a, s) => a + s.rows, 0) !== value.validRows || statuses.reduce((a, s) => a + s.amount, 0) !== value.totalAmount) throw new Error('비용 요약의 상태별 건수 또는 금액이 일치하지 않습니다.');
  return { file: path.basename(file), sha256: sha256(bytes), rows: value.validRows, totalAmount: value.totalAmount, consistencyChecked: true };
}

async function fetchRate(fetchImpl = globalThis.fetch, timeoutMs = 10000) {
  if (typeof fetchImpl !== 'function') throw new Error('Node.js 22/24 LTS로 실행하세요. 현재 환경에 fetch가 없습니다.');
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error(`API 응답 대기 시간 초과 (${timeoutMs / 1000}초)`)); }, timeoutMs);
  });
  try {
    return await Promise.race([(async () => {
      const response = await fetchImpl(ENDPOINT, { method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error(`API HTTP ${response.status}: 연결 상태 또는 서비스 상태를 확인하세요.`);
      const text = await response.text();
      if (text.length > 65536) throw new Error('API 응답 크기가 예상보다 큽니다.');
      try { return JSON.parse(text); } catch { throw new Error('API 응답이 올바른 JSON이 아닙니다.'); }
    })(), timeout]);
  } finally { clearTimeout(timer); }
}

function render(model) {
  const amount = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(model.amountUsd);
  const krw = new Intl.NumberFormat('ko-KR').format(model.referenceKrw);
  const rate = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 8 }).format(model.rate);
  const label = model.mode === 'DEMO' ? 'DEMO · 고정 예시, 실제 API 연결 미확인' : 'LIVE · 외부 API 응답 확인';
  const stale = model.observationAgeDays > 10 ? '기준일이 10일보다 오래되었습니다. 최신 자료인지 출처에서 확인하세요.' : '주말·휴일에는 기준일이 조회일보다 앞설 수 있습니다.';
  const domestic = model.domesticSummary ? `국내비용: ${new Intl.NumberFormat('ko-KR').format(model.domesticSummary.totalAmount)}원 / ${model.domesticSummary.rows}건 (기존 비용 요약)` : null;
  const share = [`[${label}]`, ...(domestic ? [domestic] : []), `${amount} USD의 참고 원화금액: ${krw}원 (원 단위 반올림)`, ...(domestic ? ['국내비용과 USD 참고금액은 별도 표시하며 합산하지 않습니다.'] : []), `1 USD = ${rate} KRW`, `기준일: ${model.date}`, `조회시각: ${model.queriedAt} (UTC)`, `출처: ${model.source}`, `조회 URL: ${model.requestUrl}`, stale, DISCLAIMER].join('\n') + '\n';
  const e = escapeHtml;
  const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>API 환율 브리핑</title><style>body{max-width:760px;margin:40px auto;padding:0 24px;font-family:system-ui,sans-serif;line-height:1.7;color:#20252b;background:#fff}section{padding:20px;background:#fff1f5;border-radius:12px}dt{font-weight:700}dd{margin:0 0 14px;overflow-wrap:anywhere}.amount{font-size:28px;font-weight:700}small{color:#4b5563}</style><h1>비용 보고서 + 외부 API 참고값</h1>${domestic ? `<p><strong>${e(domestic)}</strong></p>` : ''}<section><strong>${e(label)}</strong><p>${e(amount)} USD의 참고 원화금액</p><p class="amount">${e(krw)}원</p></section>${domestic ? '<p>국내비용과 USD 참고금액은 별도 표시하며 합산하지 않습니다.</p>' : ''}<dl><dt>환율</dt><dd>1 USD = ${e(rate)} KRW</dd><dt>기준일</dt><dd>${e(model.date)}</dd><dt>조회시각 (UTC)</dt><dd>${e(model.queriedAt)}</dd><dt>출처</dt><dd>${e(model.source)}</dd><dt>조회 URL</dt><dd>${e(model.requestUrl)}</dd></dl><p>${e(stale)}</p><p>${e(DISCLAIMER)}</p><small>계산: 입력 금액 × API 환율, 원 단위 반올림. share.txt에는 공유 문안만 만들며 실제 발송하지 않습니다.</small></html>\n`;
  return { html, share };
}

function outputPath(output, fixture, summary) {
  const resolved = path.resolve(output);
  if ([path.parse(resolved).root, os.homedir(), process.cwd()].includes(resolved)) throw new Error('별도의 결과 폴더를 지정하세요. 예: output/api');
  const sourceDir = path.resolve(__dirname);
  if (resolved === sourceDir || sourceDir.startsWith(resolved + path.sep) || resolved.startsWith(sourceDir + path.sep)) throw new Error('도구 폴더 안에는 결과를 저장할 수 없습니다. output/api를 사용하세요.');
  if (fixture && (path.resolve(fixture) === resolved || path.resolve(fixture).startsWith(resolved + path.sep))) throw new Error('예시 입력 파일을 결과 폴더 밖에 두세요.');
  if (summary && (path.resolve(summary) === resolved || path.resolve(summary).startsWith(resolved + path.sep))) throw new Error('비용 요약 입력을 결과 폴더 밖에 두세요.');
  let walk = resolved;
  while (!fs.existsSync(walk)) walk = path.dirname(walk);
  for (let cur = walk;; cur = path.dirname(cur)) {
    if (fs.lstatSync(cur).isSymbolicLink()) throw new Error('결과 폴더 경로에 심볼릭 링크가 있습니다. 일반 폴더를 사용하세요.');
    if (cur === path.dirname(cur)) break;
  }
  for (const name of [...FILES, 'error.json']) {
    const file = path.join(resolved, name);
    if (fs.existsSync(file) && (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink())) throw new Error(`결과 파일 경로가 일반 파일이 아닙니다: ${name}`);
  }
  return resolved;
}

function snapshots(output) {
  return Object.fromEntries(FILES.map(name => [name, fs.existsSync(path.join(output, name)) ? fs.readFileSync(path.join(output, name)) : null]));
}

// 먼저 별도 폴더에서 네 파일을 완성한다. 게시 실패 시 이전 바이트를 복구한다.
function publish(output, contents, ops = fs) {
  fs.mkdirSync(output, { recursive: true });
  const previous = snapshots(output);
  const staging = fs.mkdtempSync(path.join(output, '.api-stage-'));
  const touched = [];
  try {
    for (const name of FILES) fs.writeFileSync(path.join(staging, name), contents[name]);
    for (const name of FILES) { touched.push(name); ops.renameSync(path.join(staging, name), path.join(output, name)); }
  } catch (error) {
    const restoreErrors = [];
    for (const name of touched) {
      try {
        if (previous[name] === null) fs.rmSync(path.join(output, name), { force: true });
        else fs.writeFileSync(path.join(output, name), previous[name]);
      } catch (restoreError) { restoreErrors.push(`${name}: ${restoreError.message}`); }
    }
    error.message = `결과 게시 실패: ${error.message}${restoreErrors.length ? `; 복구 실패: ${restoreErrors.join(', ')}` : '; 이전 결과 복구 완료'}`;
    throw error;
  } finally { fs.rmSync(staging, { recursive: true, force: true }); }
}

async function run(opts, deps = {}) {
  validateAmount(opts.amount);
  const output = outputPath(opts.output, opts.fixture, opts.summary);
  const previous = snapshots(output);
  const now = deps.now || new Date();
  const mode = opts.fixture ? 'DEMO' : 'LIVE';
  try {
    const domesticSummary = readSummary(opts.summary);
    const raw = opts.fixture ? JSON.parse(fs.readFileSync(path.resolve(opts.fixture), 'utf8')) : await fetchRate(deps.fetchImpl, deps.timeoutMs || 10000);
    const rate = validateRate(raw, now);
    const referenceKrw = Math.round(opts.amount * rate.rate);
    if (!Number.isSafeInteger(referenceKrw)) throw new Error('계산금액이 안전한 정수 범위를 넘습니다. 입력을 줄이세요.');
    const model = { schemaVersion: 1, mode, ...rate, amountUsd: opts.amount, referenceKrw, rounding: 'KRW 정수 반올림', source: mode === 'DEMO' ? '고정 교육 예시 (실제 API 데이터 아님)' : SOURCE, requestUrl: mode === 'DEMO' ? null : ENDPOINT, apiEndpoint: ENDPOINT, queriedAt: now.toISOString(), observationAgeDays: Math.floor((now.getTime() - Date.parse(rate.date + 'T00:00:00Z')) / 86400000), disclaimer: DISCLAIMER };
    // DEMO도 연결 대상은 명시하되 조회했다고 표현하지 않는다.
    if (mode === 'DEMO') model.requestUrl = `연결하지 않음 · 예정 API: ${ENDPOINT}`;
    if (domesticSummary) model.domesticSummary = domesticSummary;
    const rendered = render(model);
    const contents = { 'rate.json': JSON.stringify(model, null, 2) + '\n', 'briefing.html': rendered.html, 'share.txt': rendered.share };
    const verification = { schemaVersion: 1, status: 'PASS', mode, apiConnectionVerified: mode === 'LIVE', checkedAt: now.toISOString(), checks: { dateValid: true, currencyPairValid: true, positiveFiniteRate: true, nonnegativeAmount: true, calculationMatches: referenceKrw === Math.round(opts.amount * rate.rate), sourceAndDatesIncluded: true, demoClearlyLabeled: mode !== 'DEMO' || rendered.share.includes('실제 API 연결 미확인'), domesticSummaryConsistency: domesticSummary ? true : 'not requested', domesticAndFxNotAdded: true }, hashes: Object.fromEntries(Object.entries(contents).map(([name, text]) => [name, sha256(text)])), note: '해시는 rate.json / briefing.html / share.txt의 바이트를 검증합니다. verification.json 자체 해시는 포함하지 않습니다. 비용 요약 검사는 건수·합계의 일치 확인이며 Excel 원본을 다시 계산하는 검사가 아닙니다.' };
    contents['verification.json'] = JSON.stringify(verification, null, 2) + '\n';
    fs.rmSync(path.join(output, 'error.json'), { force: true });
    publish(output, contents, deps.publishOps);
    return { ok: true, mode, output, referenceKrw, apiConnectionVerified: mode === 'LIVE' };
  } catch (error) {
    let preserved = false;
    try { preserved = FILES.every(name => previous[name] === null ? !fs.existsSync(path.join(output, name)) : fs.existsSync(path.join(output, name)) && previous[name].equals(fs.readFileSync(path.join(output, name)))); } catch { /* 읽기 불가능한 결과는 보존 성공으로 표시하지 않는다. */ }
    const marker = { ok: false, attemptedMode: mode, apiConnectionVerified: false, attemptedAt: now.toISOString(), message: error.message, causeCode: error.cause?.code || error.code || null, previousOutputsPreserved: preserved, previousReportAvailable: preserved && FILES.every(name => previous[name] !== null), note: preserved ? '이번 실행은 실패했습니다. 남아 있는 보고서는 이전 실행 결과입니다. DEMO로 자동 전환하지 않습니다.' : '이번 실행과 결과 복구가 실패했습니다. 일부 결과가 바뀌었을 수 있습니다. error.json을 확인하고 정상 입력으로 다시 실행하세요. DEMO로 자동 전환하지 않습니다.' };
    try { fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, 'error.json'), JSON.stringify(marker, null, 2) + '\n'); } catch (markerError) { error.message += `; error.json 기록 실패: ${markerError.message}`; }
    throw error;
  }
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.help) { console.log('사용법: node integrations/api-briefing/briefing.cjs --amount 100 --output output/api\nDEMO: --fixture integrations/api-briefing/demo-rate.json --output output/api-demo'); return; }
    console.log(JSON.stringify(await run(opts), null, 2));
  } catch (error) { console.error(`실행 실패: ${error.message}`); if (error.cause?.code) console.error(`연결 오류 코드: ${error.cause.code}`); process.exitCode = 1; }
}
if (require.main === module) main();
module.exports = { ENDPOINT, FILES, DISCLAIMER, parseArgs, validateRate, validateAmount, readSummary, fetchRate, render, publish, run, escapeHtml, sha256 };
