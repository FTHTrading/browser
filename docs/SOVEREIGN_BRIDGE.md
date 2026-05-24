# Sovereign Bridge — Connecting the Sovereign Browser Engine to Digital Giant

This document is the contract between two repos:

- `FTHTrading/browser` — **Sovereign Browser engine**. CEF + OpenClaw + x402 + LPS-1. Desktop binary path.
- `FTHTrading/digital-giant` — **Digital Giant consumer surface + sovereign infrastructure API**. Marketing site, web browser webapp, and the permanent API at `api.digitalgiant.xyz`.

Goal: one identity layer, one wallet system, one registry — two surfaces (desktop + web) using the same primitives.

---

## Single contract

Both surfaces talk to the same permanent API:

```
Base URL: https://api.digitalgiant.xyz
Backend:  Cloudflare Workers + D1
Auth:     Bearer JWT (TBD; current state: open for design endpoints)
Spec:     https://digitalgiant.xyz/docs/specs/openapi.yaml
GraphQL:  https://digitalgiant.xyz/docs/specs/schema.graphql
Activate: https://api.digitalgiant.xyz/api/agent/activation_pack
```

All schemas live at `https://digitalgiant.xyz/schemas/{name}.schema.json`. JSON Schema 2020-12. Stable URLs; cache-friendly.

---

## What the Sovereign Browser shell consumes

### On startup
1. `GET https://api.digitalgiant.xyz/api/agent/activation_pack`
   - Hydrate the OpenClaw agent system prompt from `system_prompt`.
   - Cache `schemas_inline` (returned by the pack) locally — already validated.
   - Bind `function_map` to your tool router.

2. Verify `runtime.backend == "Cloudflare Workers + D1"`. If not, surface a soft warning to the user; do not block.

### Per-tab / per-action
- Tab opens a URL: post analytics-free event to your local ledger only. Do **not** call DG endpoints unless the user explicitly asks for an agentic action.
- User invokes "Design a wallet" / "Design a settlement" / etc.: POST to `/api/agent/generate` with `{function, spec}`. Render returned `object` as a syntax-highlighted JSON view. Honor `validation.validated`.
- User wants to persist: POST the returned object to the matching `/api/wallets`, `/api/settlements`, etc.

### Identity & wallet
- Desktop shell stores the user's Genesis `subject_id` in its keystore.
- Every wallet created via the shell sets `owner_reference = subject_id`.
- Settlements designed on desktop reference desktop-side wallet IDs that round-trip through `/api/wallets/{id}`.

---

## What Digital Giant consumes from the Sovereign Browser

- Optional: x402 receipts (pay-per-action) as `proofs_required` entries on settlements.
- Optional: LPS-1 provenance hashes as `document_hash` fields on registry entries.
- Optional: OpenClaw multi-agent decision logs as `audit_log.notes`.

When the desktop shell submits any of these to DG endpoints, mark the field with the source:

```json
{
  "audit_log": [{
    "event": "created",
    "timestamp": "2026-05-24T16:30:00Z",
    "actor": "sovereign_browser_engine",
    "notes": "lps1:0xabc... · x402:receipt-id-xyz"
  }]
}
```

---

## Brand split (do not blur)

| | Sovereign Browser (`FTHTrading/browser`) | Digital Giant (`FTHTrading/digital-giant`) |
|---|---|---|
| Audience | Engineering, enterprise, sovereign-grade buyers | Consumer + carbon-conscious clients |
| Surface | Desktop binary (.dmg / .exe / .AppImage) | Web (digitalgiant.xyz) + web browser webapp (/browser/) |
| Voice | Technical, terse, founder-to-founder | Magician × Caregiver; "your site, running clean, giving back" |
| Engine | CEF, OpenClaw, x402, LPS-1 | Calls the same DG API |
| Logo | (per the existing repo) | Bracket-D mark, electric cyan |
| Color | (per the existing repo) | Electric Blue + Carbon Green (semantic only) |

When a desktop user lands on a Digital Giant URL, the shell may inject a small "via Sovereign Browser" attribution — same pattern as the cyan "via Digital Giant" ribbon the DG webapp injects on proxied pages.

---

## Implementation checklist for the Sovereign Browser side

In `FTHTrading/browser`:

```ts
// packages/agent-bridge/src/digital_giant.ts
const DG_API = "https://api.digitalgiant.xyz";

export async function activate() {
  const pack = await fetch(`${DG_API}/api/agent/activation_pack`).then(r => r.json());
  // Pin the system prompt into the OpenClaw agent context
  return {
    systemPrompt: pack.system_prompt,
    schemas: pack.schemas_inline,
    functionMap: pack.function_map,
    invariants: pack.operational_invariants,
  };
}

export async function designWallet(spec: object) {
  return fetch(`${DG_API}/api/agent/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: "generate_wallet", spec }),
  }).then(r => r.json());
}

export async function persistWallet(wallet: object) {
  return fetch(`${DG_API}/api/wallets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(wallet),
  }).then(r => r.json());
}
```

Same shape for `designSettlement`, `designEnergyInstrument`, `designCarbonInstrument`, `designRegistryEntry`. Persist via the matching POST endpoint.

---

## Auth (next milestone)

Today the API is open for design endpoints. Before any binding to real wallets / settlements ships to end users:

1. Add `Authorization: Bearer <JWT>` middleware in the Worker.
2. Issue JWTs from a Sovereign Browser login flow that proves possession of the Genesis subject_id via signature.
3. Scope: per-subject reads, per-subject writes, admin reads gated by an FTH Trading allowlist.

---

## Status

- API: live at `https://api.digitalgiant.xyz` (Cloudflare Workers + D1, region edge)
- D1 schema version: `0001_init.sql` (waitlist + 5 sovereign tables + connector_lookups)
- Agent version: 0.3.1 (system prompt cached server-side from `digitalgiant.xyz/agents/digital_giant_agent.prompt`)
- Connectors live: GLEIF (real API, validated against `LEI 254900OPPU84GM83MG36`)
- Connectors stub-but-verifiable: M-RETS, WREGIS, Verra (verifiable URL patterns; swap for authenticated calls when registry credentials are provisioned)
