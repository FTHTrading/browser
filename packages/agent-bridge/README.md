# Sovereign Browser — Agent Bridge

**Status:** 🟡 Scaffold  
**Planned:** Browser Use (MIT) + Playwright CDP → OpenClaw gateway

## Responsibilities

- Observe/act/verify loop for privileged navigation
- MCP tool surface registered on OpenClaw
- No AGPL cores in default build (Skyvern optional cloud-only)

## Interface

```
Shell (CEF/Electron) --CDP--> agent-bridge --HTTP--> OpenClaw gateway (127.0.0.1:18789)
                                           --x402--> paid.unykorn.org
```

## OpenClaw tools (target)

| Tool | Purpose |
|------|---------|
| `research_corpus_query` | Corpus-first search over CORPUS_MANIFEST |
| `browser_use.navigate` | CDP navigation with policy gate |
| `x402.quote` / `x402.settle` | Metered privileged actions |

## Local development

```powershell
# Gateway must be running
curl http://127.0.0.1:18789/health
```

See [docs/08-ROADMAP.md](../../docs/08-ROADMAP.md) for M1 milestones.
