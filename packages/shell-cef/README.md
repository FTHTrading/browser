# Sovereign Browser — CEF Shell (Primary v1)

**Status:** 🔴 Not started — M1 engineering target  
**Decision:** [docs/02-ENGINE-DECISION.md](../../docs/02-ENGINE-DECISION.md)

## Spike goals

1. CEF stable branch binary linked to host executable
2. Tabbed browser window + navigation
3. Expose CDP port for `packages/agent-bridge/` (Browser Use)
4. Embed WebUI for agent side panel (`packages/sidecar-ui/`)
5. `about:license` / credits page with Chromium + CEF notices

## Suggested layout (when implemented)

```
packages/shell-cef/
  CMakeLists.txt
  src/
    main.cpp
    browser_client.h
    cef_app.cpp
  resources/
    sovereign.icns / .ico
```

## Build notes

- Track CEF LTS branch per [CEF branches](https://chromiumembedded.github.io/cef/branches_and_building.html)
- Do **not** enable `is_chrome_branded` / Google Chrome assets
- Windows: VS2022 + Win10 SDK; macOS: Xcode 15+

## Acceptance

See [docs/02-ENGINE-DECISION.md](../../docs/02-ENGINE-DECISION.md) § Spike acceptance criteria.
