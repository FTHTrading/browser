import { SOVEREIGN_CONFIG } from './config.js';

const $ = (sel) => document.querySelector(sel);

// ---------------------------------------------------------------------------
// Health probes — three pills, three sovereign components.
// ---------------------------------------------------------------------------

async function probeDg() {
  const pill = $('#dg-pill');
  try {
    const r = await fetch(`${SOVEREIGN_CONFIG.dgApiBase}/health`, { method: 'GET' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    pill.textContent = `api ${j.db ? 'live' : '∅db'}`;
    pill.className = `pill ${j.db ? 'pill-ok' : 'pill-bad'}`;
    return true;
  } catch (err) {
    pill.textContent = 'api down';
    pill.className = 'pill pill-bad';
    pill.title = err.message;
    return false;
  }
}

async function probeLocalRuntime() {
  const pill = $('#local-pill');
  const url = SOVEREIGN_CONFIG.localRuntime.baseUrl.replace(/\/$/, '') + '/models';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pill.textContent = 'local live';
    pill.className = 'pill pill-ok';
    pill.title = `${SOVEREIGN_CONFIG.localRuntime.baseUrl} · ${SOVEREIGN_CONFIG.localRuntime.model}`;
    return true;
  } catch (err) {
    pill.textContent = 'local down';
    pill.className = 'pill pill-bad';
    pill.title = `Start Ollama: ollama serve · then: ollama pull ${SOVEREIGN_CONFIG.localRuntime.model}`;
    return false;
  }
}

async function probeGateway() {
  const pill = $('#gateway-pill');
  const url = `${SOVEREIGN_CONFIG.gatewayUrl}${SOVEREIGN_CONFIG.gatewayHealthPath}`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    pill.textContent = 'gw live';
    pill.className = 'pill pill-ok';
    return true;
  } catch (err) {
    pill.textContent = 'gw off';
    pill.className = 'pill pill-unknown';
    pill.title = 'Optional. Start OpenClaw on 127.0.0.1:18789 for browser-use tools.';
    return false;
  }
}

// ---------------------------------------------------------------------------
// Tabs.
// ---------------------------------------------------------------------------

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('active', t === btn));
      document.querySelectorAll('.panel').forEach((p) => {
        const show = p.id === `panel-${name}`;
        p.classList.toggle('active', show);
        p.hidden = !show;
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Sovereign tab — the 7-function agent surface.
// ---------------------------------------------------------------------------

const SPEC_PRESETS = {
  generate_wallet: {
    owner_type: 'entity',
    chain: 'ethereum',
    asset_symbol: 'USDC',
    asset_class: 'stablecoin',
  },
  generate_settlement_plan: {
    parties: [
      { role: 'payer', wallet_reference: 'dg-wlt-<id>' },
      { role: 'payee', wallet_reference: 'dg-wlt-<id>' },
    ],
    assets: [{ asset_symbol: 'USDC', chain: 'ethereum', amount: '1000', asset_class: 'stablecoin' }],
  },
  generate_energy_instrument: {
    instrument_type: 'solar',
    underlying_asset: { capacity_mw: 5, location: 'TX', jurisdiction: 'ERCOT' },
  },
  generate_carbon_instrument: {
    credit_type: 'removal',
    standard: 'Verra',
    vintage_year: 2024,
    quantity_tonnes: 1000,
    project_reference: 'VCS-XXXX',
  },
  generate_registry_entry: {
    subject_type: 'entity',
    document_type: 'attestation',
    storage_location: 'ipfs',
  },
  link_entities: { refs: {} },
  interpret_page: { url: 'https://example.com' },
};

let currentDraft = null; // last generated object, used by Validate + Persist

function setStatus(text, kind = 'idle') {
  const el = $('#fn-status');
  el.textContent = text;
  el.dataset.kind = kind;
}

function renderOutput(obj) {
  $('#fn-output').textContent = JSON.stringify(obj, null, 2);
}

function readSpec() {
  try {
    return JSON.parse($('#fn-spec').value || '{}');
  } catch (err) {
    setStatus(`Spec is not valid JSON: ${err.message}`, 'bad');
    return null;
  }
}

async function scaffold() {
  const fn = $('#fn-select').value;
  const spec = readSpec();
  if (!spec) return;
  setStatus('Scaffolding via Worker…');
  try {
    const r = await fetch(`${SOVEREIGN_CONFIG.dgApiBase}/api/agent/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ function: fn, spec }),
    });
    const json = await r.json();
    currentDraft = json.object ?? null;
    renderOutput(json);
    $('#fn-validate').disabled = !currentDraft;
    $('#fn-persist').disabled = true;
    setStatus(`Scaffold ready (${json.mode}). Fill with local runtime or edit, then Validate.`, 'ok');
  } catch (err) {
    setStatus(`Scaffold failed: ${err.message}`, 'bad');
  }
}

async function generateLocal() {
  const fn = $('#fn-select').value;
  const spec = readSpec();
  if (!spec) return;
  setStatus(`Generating locally with ${SOVEREIGN_CONFIG.localRuntime.model}…`);

  // 1. Get the canonical system prompt from the Worker.
  let systemPrompt = '';
  try {
    const r = await fetch(`${SOVEREIGN_CONFIG.dgApiBase}/api/agent/system_prompt`);
    if (r.ok) systemPrompt = await r.text();
  } catch {}

  // 2. Ask the local runtime to fill the schema. JSON-only.
  const userMsg = [
    `function=${fn}`,
    `spec=${JSON.stringify(spec)}`,
    'Return ONLY a single JSON object that fills the matching Digital Giant schema.',
    'Do not include prose. Do not invent identifiers. Mark unverified fields with "_unverified": true.',
  ].join('\n');

  let raw = '';
  try {
    const r = await fetch(
      `${SOVEREIGN_CONFIG.localRuntime.baseUrl.replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: SOVEREIGN_CONFIG.localRuntime.model,
          messages: [
            { role: 'system', content: systemPrompt || 'You are the Digital Giant sovereign agent. JSON only.' },
            { role: 'user', content: userMsg },
          ],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      },
    );
    if (!r.ok) throw new Error(`Local runtime ${r.status}`);
    const json = await r.json();
    raw = json.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    setStatus(`Local runtime failed: ${err.message}. Start Ollama and pull ${SOVEREIGN_CONFIG.localRuntime.model}.`, 'bad');
    return;
  }

  // 3. Parse JSON.
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
    if (fenced) {
      try { obj = JSON.parse(fenced[1]); } catch {}
    }
  }
  if (!obj) {
    setStatus('Local runtime did not return valid JSON. Try again or switch to a more capable local model.', 'bad');
    return;
  }
  currentDraft = obj;
  renderOutput({ function: fn, object: obj, routed_to: `local_runtime:${SOVEREIGN_CONFIG.localRuntime.model}` });
  $('#fn-validate').disabled = false;
  $('#fn-persist').disabled = true;
  setStatus('Generated locally. Click Validate to stamp + check against the canonical schema.', 'ok');
}

async function validate() {
  if (!currentDraft) return;
  const fn = $('#fn-select').value;
  setStatus('Validating with Worker…');
  try {
    const r = await fetch(`${SOVEREIGN_CONFIG.dgApiBase}/api/agent/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ function: fn, object: currentDraft }),
    });
    const json = await r.json();
    currentDraft = json.object ?? currentDraft;
    renderOutput(json);
    const ok = json.validation?.validated === true;
    $('#fn-persist').disabled = !ok;
    setStatus(
      ok
        ? 'Validated. Ready to Persist to D1.'
        : `Validation: missing ${(json.validation?.missing ?? []).join(', ') || '(unknown)'}`,
      ok ? 'ok' : 'bad',
    );
  } catch (err) {
    setStatus(`Validate failed: ${err.message}`, 'bad');
  }
}

async function persist() {
  if (!currentDraft) return;
  const fn = $('#fn-select').value;
  const route = {
    generate_wallet: '/api/wallets',
    generate_settlement_plan: '/api/settlements',
    generate_energy_instrument: '/api/instruments/energy',
    generate_carbon_instrument: '/api/instruments/carbon',
    generate_registry_entry: '/api/registry',
  }[fn];
  if (!route) {
    setStatus(`No persistence route for ${fn}.`, 'bad');
    return;
  }
  setStatus(`Persisting to ${route}…`);
  try {
    const r = await fetch(`${SOVEREIGN_CONFIG.dgApiBase}${route}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(currentDraft),
    });
    const json = await r.json();
    renderOutput({ persisted_to: route, response: json });
    setStatus('Persisted to D1.', 'ok');
  } catch (err) {
    setStatus(`Persist failed: ${err.message}`, 'bad');
  }
}

function initSovereignTab() {
  const sel = $('#fn-select');
  sel.addEventListener('change', () => {
    const preset = SPEC_PRESETS[sel.value] ?? {};
    $('#fn-spec').value = JSON.stringify(preset, null, 2);
    currentDraft = null;
    $('#fn-validate').disabled = true;
    $('#fn-persist').disabled = true;
    setStatus('Idle.', 'idle');
    $('#fn-output').textContent = '';
  });
  $('#fn-scaffold').addEventListener('click', scaffold);
  $('#fn-generate').addEventListener('click', generateLocal);
  $('#fn-validate').addEventListener('click', validate);
  $('#fn-persist').addEventListener('click', persist);
}

// ---------------------------------------------------------------------------
// Research tab (kept; corpus stub).
// ---------------------------------------------------------------------------

function setCorpusStub() {
  $('#corpus-stats').textContent =
    '2,998 docs harvested · 1,831 in manifest. Wire OpenClaw research_corpus_query for live search.';
}

function stubResearchSearch() {
  const q = $('#research-query').value.trim().toLowerCase();
  const ul = $('#research-results');
  ul.innerHTML = '';
  const samples = [
    { title: 'LPS-1 bridge README', path: 'integrations/lps1-bridge/README.md', tags: ['protocol', 'lps1'] },
    { title: 'GENESIS_PROOF_INDEX', path: 'content/GENESIS_PROOF_INDEX.md', tags: ['research', 'genesis'] },
    { title: 'Sovereign Browser Product Canon', path: 'docs/01-PRODUCT-CANON.md', tags: ['product', 'sovereign'] },
    { title: 'Digital Giant SYSTEM_PROMPT', path: 'agents/SYSTEM_PROMPT.md', tags: ['agent', 'canonical'] },
  ];
  const hits = q
    ? samples.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q)) ||
          s.path.includes(q),
      )
    : samples;
  if (!hits.length) {
    ul.innerHTML = '<li class="muted">No stub hits — register gateway tool for real manifest search.</li>';
    return;
  }
  hits.forEach((doc) => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="title">${doc.title}</div><div class="path">${doc.path}</div>`;
    ul.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Boot.
// ---------------------------------------------------------------------------

async function main() {
  initTabs();
  initSovereignTab();
  setCorpusStub();
  $('#donkeys-link').href = SOVEREIGN_CONFIG.donkeysLibraryUrl;
  $('#research-search').addEventListener('click', stubResearchSearch);
  $('#research-query').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') stubResearchSearch();
  });
  await Promise.all([probeDg(), probeLocalRuntime(), probeGateway()]);
}

main();
