# DG Browser — Chromium Fork Build Plan

**Owner:** FTH Trading / Unykorn Labs
**Status:** authoritative; supersedes informal scoping notes
**Date sealed:** 2026-05-24
**Target client:** Digital Giant white-label customers (managed enterprise rollout)

This is the engineering plan for the real, ship-able Digital Giant Browser: a Chromium-based desktop product with managed DG Wallet, x402 payments, agent actions, and white-label theming. It supersedes the hosted web shell at `digitalgiant.xyz/browser/`, which now serves as a marketing surface and developer playground only.

---

## 1. Engine decision

**Decision:** **CEF for the M1 spike, full Chromium fork for v1 GA.**

| Option | Verdict | Reasoning |
| --- | --- | --- |
| **Chromium Embedded Framework (CEF)** | **M1 spike** | LTS branch 146.x active as of 2026-04 (CEF on Bitbucket; Fedora ships `cef-146.0.11`). Embeds Blink + V8 in a native host with documented C++ + CefSharp + JCEF bindings. Fast to a working binary in 4–6 weeks. Limitation: cannot deeply rebrand Chromium internals (about: pages, code-signing chain, Widevine licensing). |
| **Full Chromium fork (Brave's path)** | **v1 GA** | The only way to ship "Digital Giant Browser" with our own update server, code-signing chain, default-browser-OS integration, and full removal of Google branding/Sync/Safe Browsing endpoints. Brave proved the path; Arc, Comet, Dia, Sidekick all run variants of it. Cost: 1.5–2 FTE quarters to first signed build per platform. |
| **Tauri** (Rust + system WebView) | reject for shell | System WebView (WebView2 / WKWebView) is not Chromium-uniform across OSes. Cannot guarantee Manifest V3 extension support, can't ship our own Widevine, can't promise enterprise policy parity. Fine for the **sidecar UI** rendered inside the CEF window — see §4. |
| **Servo** (Mozilla / Linux Foundation) | reject for v1 | Not feature-complete for general web. Revisit for v2 long-tail privacy. |
| **Electron-only shell** | reject | Not a real browser. Chrome DevTools community already proved this is a dead end for "browser as product" — Comet started here and migrated. |

**TL;DR.** Build the CEF spike (this repo, `packages/shell-cef`) to prove the architecture in 4–6 weeks. While that runs, stand up the Chromium fork repo in parallel and start the v1 GA pipeline.

---

## 2. Module architecture (locked)

Five modules. Each has its own package, contract, and team boundary.

```
┌──────────────────────────────────────────────────────────────────┐
│                       DG Browser (CEF / Chromium)                 │
│                                                                   │
│  ┌────────┐  ┌────────────┐  ┌────────┐  ┌─────────┐  ┌────────┐ │
│  │Browser │  │ DG Wallet  │  │ x402   │  │  Agent  │  │ Admin  │ │
│  │ shell  │  │ (dual id)  │  │ rails  │  │ (Soverei│  │ (white │ │
│  │        │  │            │  │        │  │  gn)    │  │ label) │ │
│  └────────┘  └────────────┘  └────────┘  └─────────┘  └────────┘ │
│        ▲           ▲              ▲           ▲           ▲      │
└────────┼───────────┼──────────────┼───────────┼───────────┼──────┘
         │           │              │           │           │
   packages/    packages/      packages/   packages/    packages/
   shell-cef    dg-wallet      x402         agent-      admin-
                                            bridge      pack
         │           │              │           │           │
         ▼           ▼              ▼           ▼           ▼
   CEF host +   Dual identity   Paywall      OpenClaw +   Policy
   Blink/V8     (BIP-39 +       detection,   local        bundles,
                EIP-1193        Pay-with-DG  runtime,     theme
                bridge)         inline,      7-fn map     packs,
                                receipts                  client
                                                          rollout
```

### 2.1 Module: Browser shell
- **Package:** `packages/shell-cef` (this repo); later `packages/shell-fork` for v1 GA.
- **Contract:** CEF host (or Chromium fork executable) + native window chrome with Back / Forward / Reload / Address Bar / Tabs / Wallet / Agent / Settlement / Settings — **labels, not emoji icons**. No "powered by" copy. Custom Chrome DevTools branding (`Digital Giant DevTools`).
- **Tech:** C++ for the host, system-native UI library (Cocoa on macOS, Win32 on Windows, GTK on Linux), or Qt 6 if we go cross-platform from day one.
- **Decision pending:** Qt 6 vs platform-native — see §5.

### 2.2 Module: DG Wallet
- **Package:** `packages/dg-wallet` (TypeScript core + Rust signing backend later).
- **Identity model:** **dual, side-by-side**.
  - Primary: **DG-native account.** BIP-39 seed generated client-side, encrypted with OS keychain (Keychain / DPAPI / libsecret). Never leaves the device. Networks: Ethereum mainnet, Polygon, Base. Balances pulled from public RPC. Sign-request drawer intercepts every `eth_sendTransaction`.
  - Secondary: **EIP-1193 bridge.** Detects and exposes existing wallets (MetaMask, Rabby, OKX). Same sign-request drawer UI, different keystore.
- **Permissions:** per-domain ACL stored in encrypted SQLite. Modeled on Chromium's site permissions but separate so it survives Chromium update churn.
- **D1 sync (optional):** signed permission digests pushed to the DG Worker for cross-device. Never the seed, never balances.

### 2.3 Module: x402 rails
- **Package:** `packages/x402` (TypeScript).
- **Contract:** detect `HTTP 402 Payment Required` and `x-pay-with-x402` headers on every navigation and `fetch()`. Render inline "Pay with DG Wallet" overlay. Issue an x402 settlement via the DG Wallet sign drawer. Store receipts in encrypted local SQLite, with optional D1 mirror for the customer's accounting.
- **Spec:** follows the public x402 protocol (Coinbase, 2024) — see [github.com/coinbase/x402](https://github.com/coinbase/x402). DG-specific: route through `paid.unykorn.org` facilitator by default; customer-managed facilitator URL configurable via Admin pack.

### 2.4 Module: Agent
- **Package:** `packages/agent-bridge` (already exists, sovereign-only) + new `packages/agent-shell-bridge` for IPC.
- **Contract:** the 7-function map (`generate_wallet` / `generate_settlement_plan` / `generate_energy_instrument` / `generate_carbon_instrument` / `generate_registry_entry` / `link_entities` / `interpret_page`). Local runtime only (Ollama / OpenClaw). Validator-of-record = the Cloudflare Worker at `api.digitalgiant.xyz`.
- **Shell IPC:** the native shell exposes a Cap'n Proto IPC channel to a sandboxed Node side-process running `agent-bridge`. JSON-RPC over Unix socket / Windows named pipe. No agent code in the privileged browser process.

### 2.5 Module: Admin (white-label)
- **Package:** `packages/admin-pack`.
- **Contract:** a `dg-brand.json` policy bundle that the shell reads at startup. Fields:
  - Brand: name, logo, palette (primary / accent / surface), wordmark SVG.
  - Defaults: home page, search engine, default x402 facilitator, default RPC endpoints.
  - Policy: per-domain ACL preloads, blocked-domain list, agent allowed/blocked, x402 spend limits.
  - Rollout: update channel, telemetry endpoint (opt-in by default).
- **Distribution:** signed JSON, delivered via Cloudflare Worker `GET https://api.digitalgiant.xyz/api/admin/brand/{client_id}`. Worker is already stood up; the endpoint is the next thing to add.

---

## 3. Milestones

| Milestone | Calendar | What lands | Acceptance |
| --- | --- | --- | --- |
| **M1: CEF Spike** | weeks 1–6 | `packages/shell-cef` builds + runs a tabbed Chromium window on macOS + Windows. CDP exposed on `localhost:9222`. No DG modules yet. | macOS .app and Windows .exe boot, navigate, devtools work, signed locally. |
| **M2: DG Wallet + Agent** | weeks 5–10 | `packages/dg-wallet` lights up the Wallet slide-over. `packages/agent-shell-bridge` wires the existing sovereign agent surface into the shell. EIP-1193 + DG-native both functional. | Sign request flow works end-to-end on a real testnet. Agent's `generate_wallet` writes to D1 with the user's DG-native account as `owner_reference`. |
| **M3: x402** | weeks 9–14 | `packages/x402` detects paywalls, renders inline pay UI, settles via DG Wallet, persists receipts. | A demo paid endpoint settles. Receipt visible in the wallet history panel. |
| **M4: Admin / White-label** | weeks 13–18 | `packages/admin-pack` + Worker `/api/admin/brand/{client_id}`. Theme swap works without a rebuild. Two demo customer skins ship. | Boot the same binary with `DG_BRAND_ID=acme` and `DG_BRAND_ID=globex` and see two distinct branded experiences. |
| **M5: GA prep (Chromium fork)** | months 5–8 | New repo `FTHTrading/browser-fork` based on a real Chromium pinned branch. M1–M4 modules ported. Code signing on macOS (Developer ID) + Windows (EV cert) + Linux (sigstore/cosign). Auto-update via Omaha-style framework. | First signed installer ships to a real client. |

---

## 4. Sidecar / UI rendering

The browser **chrome** (window controls, tabs, address bar, side rail) is rendered natively (Qt 6 or platform-native). The **module panels** (Wallet, Agent, x402, Admin) are React + Tailwind running inside an embedded webview pointed at a local file URL — the same React tree that runs on `digitalgiant.xyz/browser/` today.

Why: the shell engineer writes C++ once. The product team iterates on UI in TypeScript every day. Hot reload during development = a normal React dev loop, even though the host is C++.

Communication: a tiny synchronous bridge via CEF's `CefMessageRouter` exposes the native APIs (`dg.wallet.sign(...)`, `dg.x402.pay(...)`, `dg.agent.invoke(...)`) to the React panels.

---

## 5. Open engineering decisions

These need a hire/contractor before M1 starts. Listed here so they don't ambush the schedule:

1. **UI toolkit for the native chrome.** Qt 6 (cross-platform, one codebase, slower native feel) vs platform-native (3× the code, perfect feel). Recommendation: **Qt 6 for M1–M4, native rewrite during M5 if customers complain.**
2. **Code-signing pipeline.** Need an Apple Developer ID account ($99/yr) and a Windows EV code-signing cert (~$300/yr through DigiCert or SSL.com). Owner: ops, not engineering.
3. **Update server.** Brave runs Omaha (Google's update protocol). Easier path: ship as a sparkle-style update feed served from `digitalgiant.xyz/updates/{platform}.xml`. The Worker can serve this.
4. **CEF licensing.** BSD 3-clause for CEF, but Chromium drags in LGPL components for proprietary codecs (H.264, AAC). If we ship H.264 playback in the box, we owe MPEG-LA licensing — track this with Counsel.
5. **Sandbox model.** Chromium's renderer sandbox is one of its biggest assets and is fragile in CEF when you embed extra processes. Need explicit "what runs where" diagram before M2.

---

## 6. What goes in this repo right now

After this commit:

```
packages/
├── shell-cef/          # M1 native browser shell — CMakeLists, main.cpp stub, README
├── dg-wallet/          # DG-native + EIP-1193 dual identity, typed contracts
├── agent-bridge/       # ALREADY DONE — sovereign-only TS bridge
├── agent-shell-bridge/ # IPC bridge between the native shell and agent-bridge
├── extension/          # Web prototype, frozen at v0.4
└── (later) x402/       # M3
└── (later) admin-pack/ # M4
```

Plus three module spec docs in `docs/modules/`:
- `BROWSER_MODULE.md`
- `WALLET_MODULE.md`
- `AGENT_MODULE.md`

These are contracts — the engineer hired for M1 is implementing against them, not reinventing them.

---

## 7. The hosted web shell (`digitalgiant.xyz/browser/`)

It does not become this product. It remains a **developer playground and marketing demo**. Its purpose going forward:

- Lets customers preview the agent surface and white-label themes before they install the desktop binary.
- Serves the Worker `/api/agent/*` surface for headless CI and integration tests.
- Keeps the door open for an "online lite" tier (no Chromium, no wallet keystore — just the agent + scaffolding).

It will be retitled "DG Browser — Web Preview" so customers don't confuse it for the real product.

---

## 8. Costs (rough)

| Bucket | One-time | Recurring |
| --- | --- | --- |
| Apple Developer ID | $99 | $99/yr |
| Windows EV code-signing | $300–600 | $300–600/yr |
| Linux signing (sigstore) | $0 | $0 |
| Engineer (M1–M4, single mid-senior shell engineer) | $0 | ~$200k/yr fully loaded |
| CEF/Chromium build infra (CI: macOS arm64 + intel, Windows, Linux) | ~$200/mo | ~$200/mo |
| MPEG-LA H.264 (if shipped) | $0 | $5k cap/yr for under 100k units; check current tariff |
| Update server | already on Cloudflare | $0 incremental |

GA-blockers are the engineer hire and the code-signing certs. Everything else is in hand.

---

## 9. Why this is the right call, blunt

The hosted web shell at `digitalgiant.xyz/browser/` is a marketing artifact. Calling it "the browser" any longer dilutes what we're actually selling to enterprise. Customers buying "Digital Giant Browser" expect:

- A binary they install.
- An icon in their dock / start menu.
- Their company's logo and palette, not ours.
- A wallet whose keys never leave the machine.
- Policy controls their IT department can enforce.

None of that ships from a Cloudflare Pages static site, no matter how clean the CSS gets. The path forward is the native shell. This plan exists so M1 starts Monday, not "soon."
