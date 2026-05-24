# Module spec — Agent

**Packages:** `packages/agent-bridge` (Node), `packages/agent-shell-bridge` (IPC)
**Contract version:** 0.1.0 — 2026-05-24
**Status:** locked

The Agent module is sovereign-only. No third-party LLM is in the hot path. Every generation runs against a local runtime configured by the user (Ollama by default). The Cloudflare Worker at `api.digitalgiant.xyz` is the validator of record, the persistence layer, and the connector proxy — never the LLM.

---

## 1. Surface — the 7-function map

| Function | Schema | Purpose |
| --- | --- | --- |
| `generate_wallet` | `wallet.schema.json` | Multi-asset, multi-chain wallet object. |
| `generate_settlement_plan` | `settlement.schema.json` | FTH Pay settlement plan. |
| `generate_energy_instrument` | `energy_instrument.schema.json` | Renewable / deregulated market instrument. |
| `generate_carbon_instrument` | `carbon_instrument.schema.json` | Carbon offset, REC, removal credit. |
| `generate_registry_entry` | `registry.schema.json` | Unykorn Genesis registry entry. |
| `link_entities` | `ontology.schema.json` | Cross-schema linkage. |
| `interpret_page` | n/a (free-form structured extraction) | Web page → JSON. |

All seven flow through the same four-step UX: **Scaffold → Generate → Validate → Persist.**

## 2. Three policy classes

The OpenClaw gateway tags every agent call:

| Class | Examples | Gating |
| --- | --- | --- |
| `design` | `generate_wallet`, `generate_settlement_plan` | Always raises the approval drawer if `permissions.approval_on_design = true` in the admin-pack. |
| `interpret` | `interpret_page` | Auto-approved by default. Marked `validation.validated = false`. |
| `persist` | POST to `/api/wallets`, `/api/settlements`, etc. | Always raises the drawer with the full object preview. x402 metering fires here if configured. |
| `lookup` | GLEIF / M-RETS / WREGIS / Verra | Auto-approved. Logged in the connector audit trail. |

## 3. Shell IPC (this is the contract for `packages/agent-shell-bridge`)

```
shell (CEF, C++)                                sidecar (Node)
  │                                              │
  │── spawn(node sidecar.js /tmp/dg.sock) ──→    │ binds Unix socket
  │── connect(/tmp/dg.sock) ───────────────→     │ accepts
  │── { "method": "hello" } ─────────────→       │
  │ ←── { result: { sidecar_version, … } } ───── │
  │── { "method": "agent.generate",
  │      "params": { function, spec } } ──→     │
  │                                              │ ┌── local runtime (Ollama)
  │                                              │ │   model fills the schema
  │                                              │ └──→ POST /api/agent/generate (validate)
  │ ←── { result: { object, validation } } ──── │
```

Protocol: JSON-RPC 2.0, newline-delimited, over a Unix domain socket on macOS/Linux or a Windows named pipe. See `packages/agent-shell-bridge/src/protocol.ts` for the method catalog and error codes.

## 4. Local runtime

The user configures one or more local runtimes at first launch. The DG Browser ships with zero opinion about which one. Defaults probed in order:

1. `http://127.0.0.1:11434/v1` (Ollama)
2. `http://127.0.0.1:1234/v1` (LM Studio)
3. `http://127.0.0.1:18789/v1` (OpenClaw native LLM bridge)

If none respond, the agent slide-over shows a clean empty state with three buttons: `Install Ollama`, `Open LM Studio`, `Configure custom endpoint`. No silent fall-through to anything hosted.

## 5. Validation flow

The local model fills a JSON object. The sidecar POSTs that object back to the Worker:

```
POST https://api.digitalgiant.xyz/api/agent/generate
{ "function": "generate_wallet", "object": { ... } }
```

The Worker checks the required-key set, mints `wallet_id` / `settlement_id` / etc. if absent, stamps `audit.created_at` + `audit.created_by`, and returns `{ object, validation: { validated: true | false, missing: [...] } }`.

A user-facing failure to validate is not a hard error — it surfaces as `missing N` in the drawer, with the missing keys highlighted in the spec editor.

## 6. Persistence flow

After validation, the user clicks Persist. The sidecar POSTs the validated object to the matching endpoint:

```
generate_wallet           → POST /api/wallets
generate_settlement_plan  → POST /api/settlements
generate_energy_instrument→ POST /api/instruments/energy
generate_carbon_instrument→ POST /api/instruments/carbon
generate_registry_entry   → POST /api/registry
link_entities             → POST /api/registry  (linkage rows)
interpret_page            → not persisted; render-only
```

D1 is the persistence layer. The Worker is the gate.

## 7. Acceptance criteria for M2

- The shell spawns the sidecar and the IPC `hello` round-trips.
- Each of the 7 functions completes Scaffold → Generate → Validate → Persist on the desktop binary.
- Generate with no local runtime configured raises the empty state, never a third-party fallback.
- Validation failures render in the drawer with the missing-key list, no console-only errors.

## 8. Out of scope

- The "free-form chat" model — the Chat tab in the web playground is a developer convenience, not a v1 product surface. Agent is always invoked via the 7-fn map in the desktop product.
- Streaming agent transcripts to D1 — privacy issue, not shipping.
- Auto-running agent loops without explicit user gesture — there is no "always-on" agent.
