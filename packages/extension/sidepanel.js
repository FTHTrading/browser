import { SOVEREIGN_CONFIG } from './config.js';

const $ = (sel) => document.querySelector(sel);

async function probeGateway() {
  const pill = $('#gateway-pill');
  const url = `${SOVEREIGN_CONFIG.gatewayUrl}${SOVEREIGN_CONFIG.gatewayHealthPath}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      pill.textContent = 'gateway live';
      pill.className = 'pill pill-ok';
      return true;
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    pill.textContent = 'gateway down';
    pill.className = 'pill pill-bad';
    $('#chat-log').textContent = `Cannot reach ${url}\n${err.message}\n\nStart OpenClaw gateway on port 18789`;
    return false;
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('active', t === btn));
      document.querySelectorAll('.panel').forEach((p) => {
        const isChat = p.id === 'panel-chat';
        const show = name === 'chat' ? isChat : !isChat;
        p.classList.toggle('active', show);
        p.hidden = !show;
      });
    });
  });
}

function setCorpusStub() {
  const el = $('#corpus-stats');
  el.textContent =
    '2,998 docs harvested · 1,831 in manifest (local). Wire OpenClaw research_corpus_query to search.';
}

function stubResearchSearch() {
  const q = $('#research-query').value.trim().toLowerCase();
  const ul = $('#research-results');
  ul.innerHTML = '';
  const samples = [
    {
      title: 'LPS-1 bridge README',
      path: 'integrations/lps1-bridge/README.md',
      tags: ['protocol', 'lps1'],
    },
    {
      title: 'GENESIS_PROOF_INDEX',
      path: 'content/GENESIS_PROOF_INDEX.md',
      tags: ['research', 'genesis'],
    },
    {
      title: 'Sovereign Browser Product Canon',
      path: 'docs/01-PRODUCT-CANON.md',
      tags: ['product', 'sovereign'],
    },
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
    ul.innerHTML =
      '<li class="muted">No stub hits — register gateway tool for real manifest search.</li>';
    return;
  }
  hits.forEach((doc) => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="title">${doc.title}</div><div class="path">${doc.path}</div>`;
    ul.appendChild(li);
  });
}

async function main() {
  initTabs();
  setCorpusStub();
  $('#donkeys-link').href = SOVEREIGN_CONFIG.donkeysLibraryUrl;
  await probeGateway();
  $('#research-search').addEventListener('click', stubResearchSearch);
  $('#research-query').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') stubResearchSearch();
  });
}

main();
