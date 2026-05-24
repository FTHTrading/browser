# Sovereign Browser — Extension

The shipping agent surface, loadable into any Chromium-based browser today (Chrome, Edge, Brave, Arc, Vivaldi). White-label. Sovereign-only.

## Three pills, three sovereign components

| Pill | What it means | When red |
| --- | --- | --- |
| **api** | `api.digitalgiant.xyz` — validator + persistence + connectors | check internet |
| **local** | Local LLM runtime (Ollama / OpenClaw) — does the actual generation | `ollama serve` not running |
| **gw** | OpenClaw gateway (optional, for browser-use tools) | gateway not running — that's fine |

The Sovereign tab does NOT require the gateway. It only needs the api + local pills green.

## Prerequisites

1. **Ollama** running locally. Default URL: `http://127.0.0.1:11434`.

   ```bash
   ollama serve            # in one terminal
   ollama pull qwen2.5:32b # in another (or any capable JSON-mode model)
   ```

   To swap models or runtime, edit `config.js` → `localRuntime`.

2. A Chromium browser.

## Load (dev)

1. `chrome://extensions`
2. Toggle **Developer mode**
3. **Load unpacked** → select this folder: `packages/extension`
4. Pin **Sovereign Browser** to the toolbar
5. Click the icon → side panel opens on the right

## The Sovereign tab

The shipping product surface. Pick a function from the dropdown, edit the spec JSON, then:

- **Scaffold** — Worker mints an id, stamps audit, marks missing required keys `_unverified: true`. Deterministic, no LLM.
- **Generate (local)** — Local runtime (Ollama / OpenClaw) fills the schema. JSON-only. Two automatic retries on parse failure. Never falls back to a third party.
- **Validate** — POST the draft back to the Worker. Required-key check, audit stamping, id minting if missing.
- **Persist** — Write to D1 via `/api/wallets`, `/api/settlements`, `/api/instruments/energy`, etc.

The four buttons map to the deterministic policy classes in `packages/agent-bridge`: scaffold/generate = `design` + `interpret`, validate/persist = `persist`.

## Config

Edit `config.js`:

```js
export const SOVEREIGN_CONFIG = {
  dgApiBase: 'https://api.digitalgiant.xyz',
  gatewayUrl: 'http://127.0.0.1:18789',
  localRuntime: {
    baseUrl: 'http://127.0.0.1:11434/v1', // Ollama default
    model: 'qwen2.5:32b',
  },
};
```

Swap-in examples:

- LM Studio: `baseUrl: 'http://127.0.0.1:1234/v1'`
- OpenClaw LLM bridge: `baseUrl: 'http://127.0.0.1:18789/v1'`
- A different Ollama model: `model: 'llama3.1:70b-instruct'`

## What this extension does not do

- It does **not** call Anthropic, OpenAI, or any other third-party LLM.
- It does **not** ship with any API key for a hosted model.
- It does **not** require the OpenClaw gateway for the Sovereign tab; the gateway is for browser-use automation (Chat tab, future).

If `local` pill is red, the design tier is dead — that's the design.
