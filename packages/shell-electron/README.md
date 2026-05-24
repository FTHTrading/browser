# Sovereign Browser — Electron Fallback Shell

**Status:** 🔴 Fallback if CEF spike slips >30d  
**Not the 365d end state** — migrate to Chromium fork path in Phase 4.

## When to use

- Need signed Win/Mac installer before CEF pipeline is ready
- Internal dogfood only (not "we shipped Electron" in client contracts without CEF roadmap)

## Minimal layout (when implemented)

```
packages/shell-electron/
  package.json
  main.js              # BrowserWindow + CDP
  preload.js
  panel/               # Agent side panel (loads sidecar-ui)
```

Wire to `packages/agent-bridge/` Browser Use sidecar same as CEF path.
