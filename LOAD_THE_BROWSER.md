# Load the Sovereign Browser — 5 minutes

This is the shortest path from zero to a working white-label Sovereign Browser side panel calling `api.digitalgiant.xyz` + your local Ollama.

## 1. Get the repo on disk

```bash
git clone https://github.com/FTHTrading/browser.git sovereign-browser
cd sovereign-browser
```

## 2. Start Ollama (one-time)

Install Ollama from <https://ollama.com>, then in a terminal:

```bash
ollama serve
```

Leave that running. In another terminal:

```bash
ollama pull qwen2.5:32b     # or llama3.1:70b-instruct, or any JSON-mode capable model
```

(If you already run Ollama, skip this step.)

## 3. Load the extension

1. Open `chrome://extensions` in Chrome, Edge, Brave, Arc, Vivaldi — any Chromium browser.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked**.
4. Pick the folder: `sovereign-browser/packages/extension`
5. Pin **Sovereign Browser** to the toolbar.

## 4. Open it

Click the toolbar icon. Side panel opens on the right. You should see three pills at the top:

- **api live** (green) — Worker is up
- **local live** (green) — Ollama is up
- **gw off** (grey) — OpenClaw gateway not running, that's fine

If `local` is red: `ollama serve` is not running, or the model in `packages/extension/config.js` is not pulled.

## 5. Use it

Sovereign tab → pick a function → edit the spec JSON → click the buttons in order:

1. **Scaffold** — see the canonical schema skeleton with a fresh id stamped.
2. **Generate (local)** — Ollama fills it. Should take 5–60 seconds depending on model + hardware.
3. **Validate** — Worker checks the required keys.
4. **Persist** — writes to D1 at `api.digitalgiant.xyz`.

Output appears in the black panel underneath. Status line above it tells you what just happened.

## Nothing leaves your machine that you didn't authorize

- Generation runs on your local Ollama. No prompts ever go to a third-party LLM.
- The Worker at `api.digitalgiant.xyz` only sees the **finished JSON object** you ship it for validation or persistence. It runs zero LLM code.
- Connector lookups (GLEIF, M-RETS, WREGIS, Verra) are proxied through the Worker and logged in D1 (`/api/connectors/history`).

## To rebrand

White-label is the default. To skin it for a client:

- `packages/extension/manifest.json` → `name`, `description`
- `packages/extension/sidepanel.html` → `<h1>` text
- `packages/extension/sidepanel.css` → `--accent` and `--bg`

That's it. No registrations, no app stores, no review queues for dev/internal use.

## More

- Canonical contract: `docs/SOVEREIGN_BRIDGE.md`
- Canonical prompt: <https://digitalgiant.xyz/agents/SYSTEM_PROMPT.md>
- Bridge package (for CEF/Electron later): `packages/agent-bridge`
