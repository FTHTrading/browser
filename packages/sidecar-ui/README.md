# Sovereign Browser — Sidecar UI

**Status:** 🔴 Placeholder — React target for agent side panel  
**UX spec:** [docs/03-UX-VISION.md](../../docs/03-UX-VISION.md)

## Purpose

Primary agent surface (360px right rail) — **not** a Chrome extension pop-out.

Mirrors Comet Sidecar separation: browse chrome stays minimal; agent WebUI deploys independently.

## Target stack

- React + TypeScript
- Vite build embedded in CEF/Electron shell
- SSE streaming from OpenClaw gateway
- Design tokens from [docs/03-UX-VISION.md](../../docs/03-UX-VISION.md)

## M1 features

- [ ] Gateway health indicator
- [ ] Chat stream + step trace
- [ ] @tab context syntax
- [ ] Corpus search tab (via `research_corpus_query`)
- [ ] Approval modal stub for privileged actions
- [ ] DOI citation cards (LPS-1 + Genesis Zenodo links)

## Dev note

Until sidecar-ui ships, use `packages/extension/` for gateway/corpus demos in Chrome — **dev prototype only**.
