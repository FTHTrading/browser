# Sovereign Browser — Extension (DEV PROTOTYPE ONLY)

> **Not the product.** Sovereign Browser ships as an **installable CEF/Electron shell**. This Chrome MV3 folder is for **gateway/corpus demos** only.

Minimal Chrome MV3 side panel. Do not use in client GTM or status as "Phase 0 product."

## Prerequisites

- Chromium browser (Chrome / Edge)
- OpenClaw gateway on **http://127.0.0.1:18789**

```powershell
curl http://127.0.0.1:18789/health
```

## Load unpacked (dev)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder: `packages/extension`
4. Pin **Sovereign Browser (Dev Prototype)** to the toolbar
5. Click the icon → side panel opens

## Configuration

Edit `config.js`:

| Key | Default |
|-----|---------|
| `gatewayUrl` | `http://127.0.0.1:18789` |
| `corpusManifestHint` | `vault/intel/CORPUS_MANIFEST.json` (docs only until gateway tool exists) |

## Tabs

| Tab | Status |
|-----|--------|
| **Chat** | Gateway health probe only; send disabled |
| **Research** | Stub search + DOI links; real RAG via `research_corpus_query` |

## Next steps

1. Register OpenClaw tool `research_corpus_query`
2. Extension `fetch` → gateway tool endpoint for manifest search
3. LPS-1 verify button → ref impl spawn
4. Approval modal before pay/submit/download
5. x402 gate on privileged actions → `paid.unykorn.org`

## Docs

- [docs/01-PRODUCT-CANON.md](../../docs/01-PRODUCT-CANON.md)
- [docs/08-ROADMAP.md](../../docs/08-ROADMAP.md)
