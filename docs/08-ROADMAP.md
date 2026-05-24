# Sovereign Browser — Engineering Roadmap

**Document version:** 1.0  
**Date:** 2026-05-24  
**Status:** Active planning  
**Requirements:** [REQUIREMENTS.md](../REQUIREMENTS.md)

---

## Phase overview

| Phase | Horizon | Outcome | Engine |
|-------|---------|---------|--------|
| **M1** | 90d | Sovereign Shell Alpha | CEF (Electron fallback) |
| **M2** | 180d | SNP omnibox + x402 wallet + creator onboarding | CEF |
| **M3** | 365d | White-label build pipeline + mobile WebView companion | CEF + CI branding |
| **M4** | 18mo+ | Chromium fork hardening + extension SDK | `unykorn/chromium` fork |

---

## M1 — Sovereign Shell Alpha (90 days)

### Deliverables

- [ ] Signed Windows + macOS installer
- [ ] `packages/shell-cef/` host OR `packages/shell-electron/` fallback
- [ ] `packages/sidecar-ui/` agent panel wired to OpenClaw
- [ ] `packages/agent-bridge/` Browser Use over CDP
- [ ] Approval modal on privileged actions
- [ ] x402 gate stub on at least one metered action
- [ ] New tab corpus search (API)
- [ ] `about:credits` license page

### Success metrics

| Metric | Target |
|--------|--------|
| Internal workflows | 10 complete |
| Unapproved payments | 0 |
| p95 plan→first action | <8s local |
| Corpus search p95 | <200ms |
| Design partners | 3 signed |

### Explicit non-goals

- Chrome Web Store extension as product
- Full SNP omnibox
- White-label theming
- Mobile shell

---

## M2 — Identity & Payments (180 days)

- [ ] SNP omnibox resolver in native chrome
- [ ] x402 wallet UI + ATP receipt history
- [ ] LPS-1 verify button in creator flows
- [ ] Multi-agent mesh visible in Sidecar
- [ ] Nerve voice wire (push-to-talk)
- [ ] unykorn.ai portal parity with new tab bundle

---

## M3 — White-label & Mobile (365 days)

- [ ] Per-tenant branding CI (MSIX/dmg)
- [ ] First agency client ship (`creator.clientbrand.com`)
- [ ] Mobile companion (Samsung / WebView) — voice delegate + x402 approve
- [ ] SOC 2 roadmap kickoff for control plane
- [ ] Enterprise air-gapped gateway package

---

## M4 — Chromium Fork (18mo+)

- [ ] `unykorn/chromium` git mirror + `//unykorn/` overlay
- [ ] Extension SDK for namespace-published skills
- [ ] WebXR hail/storm/law spatial approve layers
- [ ] CEF retired for consumer channel

---

## Team shape

| Role | M1 | M3+ |
|------|----|-----|
| Chromium/CEF engineer | 1 (contractor OK) | 2 |
| Desktop (Electron/Tauri) | 1 | 1 |
| Agent platform (OpenClaw) | 1 (operator) | 1 |
| Security / policy | 0.5 | 1 |
| DevOps (installers, updates) | 0.5 | 1 |
| Design (chrome, onboarding) | 0.5 | 1 |

**Solo operator + OpenClaw:** M1 shell, gateway wiring, corpus RAG, x402 gates, dogfood. **Must hire/contract:** CEF build fluency, code signing, auto-update infra.

---

## Package maturity tracker

| Package | M1 | M2 | M3 |
|---------|----|----|-----|
| `shell-cef` | Alpha | Beta | Production |
| `shell-electron` | Fallback spike | Maintain | Deprecate |
| `sidecar-ui` | Alpha WebUI | Feature complete | White-label themes |
| `agent-bridge` | CDP + OpenClaw | Multi-agent | Marketplace tools |
| `extension` | Dev prototype frozen | Unmaintained | Archive |

---

## unykorn.ai portal alignment

| Now | M1 | M2 |
|-----|----|----|
| Operator command plane | Download page + corpus search | Account/namespace admin |
| DNS apex P0 | Real installers from `/download` | SNP + wallet admin |

---

## Next engineering step

**Start CEF spike in `packages/shell-cef/`:**

1. Link CEF stable binary distribution
2. Minimal tabbed browser window
3. Expose CDP port
4. Load `packages/sidecar-ui/` placeholder in docked panel
5. Verify OpenClaw gateway health from sidecar

Parallel: register `research_corpus_query` on OpenClaw for extension/sidecar corpus search.

---

*Last updated: 2026-05-24*
