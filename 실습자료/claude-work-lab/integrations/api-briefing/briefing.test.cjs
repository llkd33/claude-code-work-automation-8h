'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const api = require('./briefing.cjs');
const now = new Date('2026-10-08T06:00:00Z');
const rate = { date: '2026-10-07', base: 'USD', quote: 'KRW', rate: 1350.125 };
const mock = body => async () => new Response(JSON.stringify(body), { status: 200 });
const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'api-briefing-tests-'));
let counter = 0;
function opts(extra = {}) { return { amount: 100, output: path.join(root, String(counter++)), ...extra }; }
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function hashes(output) { return Object.fromEntries(api.FILES.map(name => [name, api.sha256(fs.readFileSync(path.join(output, name)))])); }
process.on('exit', () => fs.rmSync(root, { recursive: true, force: true }));

test('default / explicit options / amount zero are usable', () => {
  assert.deepEqual(api.parseArgs([]), { amount: 100, output: 'output/api', fixture: null, summary: null });
  assert.equal(api.parseArgs(['--amount', '0', '--summary', 'summary.json']).amount, 0);
  assert.equal(api.parseArgs(['--amount', '100.25']).amount, 100.25);
});
test('malformed amount / duplicate / missing / unknown options rejected', () => {
  for (const args of [['--amount', '-1'], ['--amount', 'NaN'], ['--amount', '1e3'], ['--amount', '1.234'], ['--amount', '1000000001'], ['--amount', ''], ['--output'], ['--amount','1','--amount','2'], ['--url','https://example.com']]) assert.throws(() => api.parseArgs(args));
});
test('native fetch is one read-only GET to fixed official provider URL', async () => {
  let calls = 0;
  await api.fetchRate(async (url, options) => { calls++; assert.equal(url, api.ENDPOINT); assert.equal(options.method, 'GET'); assert.equal(options.headers.Accept, 'application/json'); assert.ok(options.signal); return new Response(JSON.stringify(rate)); });
  assert.equal(calls, 1);
});
test('HTTP errors never become reports', async () => {
  await assert.rejects(api.fetchRate(async () => new Response('{}', { status: 503 })), /HTTP 503/);
});
test('invalid JSON and oversized body rejected', async () => {
  await assert.rejects(api.fetchRate(async () => new Response('<html>error</html>')), /JSON/);
  await assert.rejects(api.fetchRate(async () => new Response('x'.repeat(65537))), /크기/);
});
test('network error propagated without synthetic fallback', async () => {
  await assert.rejects(api.fetchRate(async () => { throw new Error('network disconnected'); }), /network disconnected/);
});
test('timeout covers response and hanging response body', async () => {
  await assert.rejects(api.fetchRate(() => new Promise(() => {}), 25), /시간 초과/);
  await assert.rejects(api.fetchRate(async () => ({ ok: true, text: () => new Promise(() => {}) }), 25), /시간 초과/);
});
test('valid leap day accepted; malformed / impossible / future dates rejected', () => {
  assert.equal(api.validateRate({ ...rate, date: '2024-02-29' }, now).date, '2024-02-29');
  for (const date of ['2026-2-01', '2026-02-29', '2026-04-31', '2026-10-09', '<script>']) assert.throws(() => api.validateRate({ ...rate, date }, now));
});
test('wrong currency / missing key / array rejected', () => {
  for (const value of [{ ...rate, base: 'EUR' }, { ...rate, quote: 'usd' }, { date: rate.date, rate: 1 }, [rate], null]) assert.throws(() => api.validateRate(value, now));
});
test('zero / negative / nonfinite / numeric-string rates rejected', () => {
  for (const value of [0, -1, NaN, Infinity, '1350', null]) assert.throws(() => api.validateRate({ ...rate, rate: value }, now));
});
test('LIVE produces four files, rounded calculation, source and dates', async () => {
  const o = opts(); const result = await api.run(o, { now, fetchImpl: mock(rate) });
  assert.equal(result.referenceKrw, 135013); assert.equal(result.mode, 'LIVE');
  const model = json(path.join(o.output, 'rate.json'));
  assert.equal(model.source, 'Frankfurter v2 / European Central Bank (ECB)'); assert.equal(model.requestUrl, api.ENDPOINT); assert.equal(model.queriedAt, now.toISOString());
  assert.match(fs.readFileSync(path.join(o.output, 'share.txt'),'utf8'), /기준일: 2026-10-07/);
  assert.equal(json(path.join(o.output, 'verification.json')).apiConnectionVerified, true);
  for (const name of api.FILES) assert.ok(fs.existsSync(path.join(o.output, name)));
});
test('amount zero makes zero KRW without rejecting positive rate', async () => {
  const o = opts({ amount: 0 }); assert.equal((await api.run(o, { now, fetchImpl: mock(rate) })).referenceKrw, 0);
});
test('result hashes match actual file bytes; tamper detected independently', async () => {
  const o = opts(); await api.run(o, { now, fetchImpl: mock(rate) });
  const verification = json(path.join(o.output, 'verification.json'));
  for (const [name, hash] of Object.entries(verification.hashes)) assert.equal(hash, api.sha256(fs.readFileSync(path.join(o.output, name))));
  fs.appendFileSync(path.join(o.output, 'share.txt'), 'tampered');
  assert.notEqual(verification.hashes['share.txt'], api.sha256(fs.readFileSync(path.join(o.output, 'share.txt'))));
});
test('explicit fixture is DEMO everywhere; fetch never called and input intact', async () => {
  const fixture = path.join(__dirname, 'demo-rate.json'); const before = api.sha256(fs.readFileSync(fixture));
  const o = opts({ fixture }); const result = await api.run(o, { now, fetchImpl: () => { throw new Error('must not call API'); } });
  assert.equal(result.mode, 'DEMO'); assert.equal(result.apiConnectionVerified, false);
  for (const file of ['rate.json', 'briefing.html', 'share.txt', 'verification.json']) assert.match(fs.readFileSync(path.join(o.output, file), 'utf8'), /DEMO/);
  assert.match(fs.readFileSync(path.join(o.output, 'share.txt'),'utf8'), /실제 API 연결 미확인/);
  assert.equal(before, api.sha256(fs.readFileSync(fixture)));
});
test('API failure preserves all four previous files and records failed attempt', async () => {
  const o = opts(); await api.run(o, { now, fetchImpl: mock(rate) }); const before = hashes(o.output);
  await assert.rejects(api.run(o, { now, fetchImpl: async () => new Response('{}', { status: 429 }) }), /HTTP 429/);
  assert.deepEqual(hashes(o.output), before);
  const marker = json(path.join(o.output, 'error.json'));
  assert.equal(marker.ok, false); assert.equal(marker.attemptedMode, 'LIVE'); assert.equal(marker.previousOutputsPreserved, true); assert.equal(marker.apiConnectionVerified, false);
});
test('first failure writes only error marker; no false PASS / DEMO output', async () => {
  const o = opts(); await assert.rejects(api.run(o, { now, fetchImpl: mock({ ...rate, rate: 0 }) }));
  assert.deepEqual(fs.readdirSync(o.output), ['error.json']);
  assert.equal(json(path.join(o.output, 'error.json')).previousReportAvailable, false);
});
test('second-file publish failure actually restores all four prior outputs', async () => {
  const o = opts(); await api.run(o, { now, fetchImpl: mock(rate) }); const before = hashes(o.output); let count = 0;
  await assert.rejects(api.run({ ...o, amount: 200 }, { now, fetchImpl: mock(rate), publishOps: { renameSync(a,b) { if (++count === 2) throw new Error('simulated disk failure'); fs.renameSync(a,b); } } }), /결과 게시 실패/);
  assert.deepEqual(hashes(o.output), before); assert.equal(json(path.join(o.output, 'error.json')).previousOutputsPreserved, true);
  assert.ok(!fs.readdirSync(o.output).some(f => f.startsWith('.api-stage-')));
});
test('fourth-file publish failure restores prior verification rather than false PASS', async () => {
  const o = opts(); await api.run(o, { now, fetchImpl: mock(rate) }); const before = hashes(o.output); let count = 0;
  await assert.rejects(api.run({ ...o, amount: 200 }, { now, fetchImpl: mock(rate), publishOps: { renameSync(a,b) { if (++count === 4) throw new Error('final rename failed'); fs.renameSync(a,b); } } }));
  assert.deepEqual(hashes(o.output), before);
});
test('restore failure is not disguised as previous report preserved', async () => {
  const o = opts(); await api.run(o, { now, fetchImpl: mock(rate) }); let count = 0;
  await assert.rejects(api.run({ ...o, amount: 200 }, { now, fetchImpl: mock(rate), publishOps: { renameSync(a,b) { if (++count === 2) { fs.rmSync(b); fs.mkdirSync(b); throw new Error('target replaced by directory'); } fs.renameSync(a,b); } } }), /복구 실패/);
  const marker = json(path.join(o.output, 'error.json'));
  assert.equal(marker.previousOutputsPreserved, false); assert.equal(marker.previousReportAvailable, false); assert.match(marker.note, /일부 결과가 바뀌었을 수/);
});
test('successful retry clears prior failure marker', async () => {
  const o = opts(); await assert.rejects(api.run(o, { now, fetchImpl: async () => new Response('{}',{status:503}) }));
  await api.run(o, { now, fetchImpl: mock(rate) }); assert.equal(fs.existsSync(path.join(o.output,'error.json')),false);
});
test('display metadata is HTML escaped; title keeps explicit DEMO', () => {
  const rendered = api.render({ mode:'DEMO',amountUsd:100,referenceKrw:100,rate:1,date:'2026-10-07',queriedAt:'<img src=x onerror=alert(1)>',source:'A & <script>x</script>',requestUrl:'"unsafe"',observationAgeDays:1 });
  assert.ok(!rendered.html.includes('<script>')); assert.match(rendered.html,/&lt;script&gt;/); assert.match(rendered.html,/&quot;unsafe&quot;/);
});
test('old observation visibly warns without pretending live trading', () => {
  const rendered = api.render({mode:'LIVE',amountUsd:100,referenceKrw:100,rate:1,date:'2020-01-01',queriedAt:now.toISOString(),source:'ECB',requestUrl:api.ENDPOINT,observationAgeDays:100});
  assert.match(rendered.share,/10일보다 오래/); assert.match(rendered.share,/실제 거래환율/);
});
test('output must not overwrite tool or fixture source; symlink target rejected', async () => {
  await assert.rejects(api.run(opts({output:__dirname}),{now,fetchImpl:mock(rate)}));
  const dir=path.join(root,'fixture-source');fs.mkdirSync(dir);const file=path.join(dir,'rate.json');fs.writeFileSync(file,JSON.stringify(rate));
  await assert.rejects(api.run(opts({output:dir,fixture:file}),{now}));
  const link=path.join(root,'linked-output');fs.symlinkSync(dir,link);
  await assert.rejects(api.run(opts({output:link}),{now,fetchImpl:mock(rate)}));
});
function summary() { return {inputRows:2,validRows:2,errorRows:0,duplicateRows:0,qualityChecked:true,qualityStatus:'passed',totalAmount:30000,byDepartment:{'영업':10000,'마케팅':20000},byStatus:{'완료':{rows:2,amount:30000}}}; }
test('optional domestic summary is read, verified, shown separately, and never modified', async () => {
  const file=path.join(root,'summary.json');fs.writeFileSync(file,JSON.stringify(summary()));const before=api.sha256(fs.readFileSync(file));
  const o=opts({summary:file});await api.run(o,{now,fetchImpl:mock(rate)});
  const model=json(path.join(o.output,'rate.json')); assert.equal(model.domesticSummary.totalAmount,30000); assert.equal(model.referenceKrw,135013); assert.equal(model.domesticSummary.sha256,before);
  const text=fs.readFileSync(path.join(o.output,'share.txt'),'utf8');assert.match(text,/국내비용: 30,000원 \/ 2건/);assert.match(text,/합산하지 않습니다/);assert.equal(api.sha256(fs.readFileSync(file)),before);
});
test('inconsistent totals / counts / unverified summaries rejected before fetching', async () => {
  for (const [i, value] of [{...summary(),totalAmount:30001},{...summary(),validRows:1},{...summary(),qualityChecked:false},{...summary(),byStatus:{'완료':{rows:1,amount:30000}}}].entries()) {
    const file=path.join(root,`bad-summary-${i}.json`);fs.writeFileSync(file,JSON.stringify(value));
    await assert.rejects(api.run(opts({summary:file}),{now,fetchImpl:()=>{throw new Error('should validate input before API');}}),/費用|비용|국내/);
  }
});
test('CLI demo runs without any npm install and zero amount valid', () => {
  const output=opts().output;
  const result=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'briefing.cjs'),'--amount','0','--fixture',path.join(__dirname,'demo-rate.json'),'--output',output],{encoding:'utf8'}));
  assert.equal(result.mode,'DEMO');assert.equal(result.referenceKrw,0);assert.equal(result.apiConnectionVerified,false);
});
