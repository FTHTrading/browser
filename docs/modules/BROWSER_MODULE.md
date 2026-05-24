# Module spec — Browser shell

**Package:** `packages/shell-cef` (M1), `packages/shell-fork` (M5 v1 GA)
**Contract version:** 0.1.0 — 2026-05-24
**Status:** locked

This is the public contract the Browser shell exposes. Any implementation
(CEF spike, full Chromium fork, future Servo experiment) must honour it.

---

## 1. Window chrome — labels, never emoji

Top bar, left to right:

| Element | Label | Type | Notes |
| --- | --- | --- | --- |
| Brand mark | DG_BRAND_NAME | logo + wordmark | Comes from admin-pack at runtime. |
| Navigation | `Back`, `Forward`, `Reload`, `Home` | icon + tooltip text | Tooltip is the source of truth; icons are the consistent DG icon set, never emoji. |
| Address bar | placeholder: `Address or query` | input | Omnibox: URL, search query, or agent invocation prefixed with `>`. |
| Wallet | `Wallet` + truncated address pill | button | Opens the DG Wallet slide-over (left rail). |
| Agent | `Agent` | button | Opens the agent slide-over. |
| Settings | `Settings` | button | Opens the Admin / Settings slide-over. |

Bottom bar: tabs, then a thin status row that reports `network state` + `pending agent` + `version`. **No "powered by" copy.**

## 2. Tabs

- Strip across the top, below the address bar.
- Show favicon + page title, not the URL.
- Right-click → New Tab, Duplicate, Pin, Close, Close Others.
- Cmd/Ctrl+T / W / Tab as in any Chromium browser.

## 3. Side rail (slide-over modules)

```
┌───────────────────────────────────────────────────────┐
│ ┌─────┐                                               │
│ │ DG  │  [Wallet]  [Agent]  [x402]  [Admin]           │
│ └─────┘                                               │
├───────────────────────────────────────────────────────┤
│                                                       │
│           Tab content (Blink renderer)                │
│                                                       │
└───────────────────────────────────────────────────────┘
```

Each module opens as a 380px slide-over from the right. They share keyboard shortcuts (`Cmd+1` Wallet, `Cmd+2` Agent, etc.) and can be torn off into their own window for a multi-monitor setup.

## 4. CDP

Always bound on `localhost:9222`. The shell launches with `--remote-debugging-port=9222` unless explicitly disabled via `--no-cdp`. Required by the agent-bridge / Browser Use / OpenClaw tool plane.

## 5. Profile model

- One DG account profile per OS user by default.
- Profiles store: DG-native wallet seed (in OS keychain), per-domain permissions (encrypted SQLite), history, bookmarks, agent transcripts.
- Profiles are **portable** — exported as a single signed archive; importable on another machine after the user re-derives the seed from their BIP-39 phrase.

## 6. Default home page

The new-tab page is a dashboard, not a marketing slab. Contents, top to bottom:

1. **Recent sessions** — last 8 tabs by domain, click to re-open.
2. **Active wallets** — DG-native account address + balance, plus any EIP-1193 wallets currently connected.
3. **Apps** — pinned web apps (PWAs or just bookmarks) the admin-pack pinned.
4. **Agent shortcuts** — the 7-function map, each as a one-line card with a single example.

`https://digitalgiant.xyz/browser/` remains as the **web preview** but is no longer treated as the new-tab page in the desktop binary.

## 7. Acceptance criteria for M1

- Boots on macOS arm64 and Windows x64.
- Tabbed window with the chrome described in §1.
- Loads any web URL through Blink at full Chromium fidelity.
- Opens DevTools via Cmd/Ctrl+Shift+I.
- CDP responds on `:9222`.
- The Wallet / Agent / Settings buttons are wired to dummy slide-overs (M2 fills them).
- Built binary is reproducible from the steps in `packages/shell-cef/README.md`.

## 8. Out of scope for M1

- Tab grouping, vertical tabs, profile switcher — M3.
- Auto-updater — M5.
- Sandbox hardening review — M5 (before any GA distribution).
- Sync — never (we explicitly do not sync browsing data through DG infra; profile export is the migration story).
