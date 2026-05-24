# @unykorn/agent-bridge

**Status:** active
**Role:** Sovereign Browser ↔ Digital Giant ↔ OpenClaw gateway bridge.

This package is what makes the desktop Sovereign Browser (CEF + Electron shells in this monorepo) talk to the permanent backend at `api.digitalgiant.xyz` and expose its sovereign-agent function map to the OpenClaw gateway on `127.0.0.1:18789`.

It has no AGPL cores. It does not handle browser automation directly — that lives in `browser-use` / Playwright tool surfaces invoked by OpenClaw. This package is the **schema and policy layer**.

## What it contains

| Module | Responsibility |
| --- | --- |
| `digital_giant.ts` | Typed client for `api.digitalgiant.xyz`. Activation hydration, 7-function generate surface, persistence writes, registry connectors. |
| `model_router.ts` | Tiered dispatch. Design endpoints → Worker + Sonnet. `interpret_page` → local Ollama / Qwen / OpenClaw-native. Auto-escalates on local parse failure. |
| `openclaw_tools.ts` | Explicit allowlist registration on the OpenClaw gateway. Three policy classes: `design`, `persist`, `lookup`, `interpret`. |
| `index.ts` | Public exports. |

## Architecture

```text
Shell (CEF / Electron)
  │
  ├── boot ──→ DigitalGiantClient.hydrate()
  │             ↳ GET /api/agent/activation_pack   (Worker + D1, canonical prompt)
  │             ↳ pin pack.version, soft-warn on drift
  │
  ├── tools ──→ registerDigitalGiantTools(openClawRegistry, { dg, router })
  │             ↳ dg.generate_wallet         (design   · approval modal · Sonnet)
  │             ↳ dg.generate_settlement_plan (design   · approval modal · Sonnet)
  │             ↳ dg.generate_energy_instrument
  │             ↳ dg.generate_carbon_instrument
  │             ↳ dg.generate_registry_entry
  │             ↳ dg.link_entities
  │             ↳ dg.interpret_page          (interpret · local runtime · escalate on miss)
  │             ↳ dg.persist_*               (persist   · approval-required · D1 write)
  │             ↳ dg.lookup_gleif/mrets/wregis/verra (lookup · verifiable · audit log)
  │
  └── agent ──→ OpenClaw gateway (127.0.0.1:18789)
                ↳ planner / executor / compliance mesh
                ↳ x402 metering on persist + lookup
                ↳ LPS-1 provenance on every step
```

## Routing policy

Chosen 2026-05-24 (see [`docs/SOVEREIGN_BRIDGE.md`](../../docs/SOVEREIGN_BRIDGE.md)):

| Function | Default route | Rationale |
| --- | --- | --- |
| `generate_wallet` | `dg_worker_sonnet` | High-stakes; schema-strict; audit of record. |
| `generate_settlement_plan` | `dg_worker_sonnet` | Same. |
| `generate_energy_instrument` | `dg_worker_sonnet` | Same. |
| `generate_carbon_instrument` | `dg_worker_sonnet` | Same; pass-through retirement is regulated. |
| `generate_registry_entry` | `dg_worker_sonnet` | Identity-of-record. |
| `link_entities` | `dg_worker_sonnet` | Ontology consistency. |
| `interpret_page` | `local_runtime` | High-volume; sovereign; cheaper; escalates to Sonnet on parse failure. |

Override per-deployment via `ModelRouter({ routes: { ... } })`.

## Usage

```ts
import {
  DigitalGiantClient,
  ModelRouter,
  registerDigitalGiantTools,
} from "@unykorn/agent-bridge";

// 1. Permanent backend.
const dg = new DigitalGiantClient({
  // baseUrl: "https://api.digitalgiant.xyz",  // default
  // authToken: ...,                            // once JWT middleware ships
});

// 2. Hydrate canonical prompt + function map. Pin the version.
const pack = await dg.hydrate();
console.log("DG activation pack:", pack.version, pack.target_platforms);

// 3. Tiered model router.
const router = new ModelRouter({
  dg,
  systemPrompt: pack.system_prompt,
  local: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1",
    model: process.env.LOCAL_MODEL ?? "qwen2.5:32b",
  },
});

// 4. Register on the OpenClaw gateway.
const bound = registerDigitalGiantTools(openClawRegistry, { dg, router });
console.log("Bound DG tools:", bound);
```

## Promises this package keeps

- **Never fabricates identifiers.** BIC / Bloomberg / LEI / MSB are opaque. The lookup tools call the verifiable registry connectors; they never guess.
- **Never claims to move money.** The design surface produces schema-validated JSON. Persistence is a separate, explicitly-approved tool call.
- **Worker is validator of record.** Local interpretation is marked `validation.validated = false` and re-validated on persist.
- **Schema drift is visible.** `DG_CANONICAL_PROMPT_VERSION` is pinned at the bridge layer; mismatch with the live Worker is logged as a warning so the shell can refuse to boot in an "unknown prompt" state.

## Build

```bash
pnpm --filter @unykorn/agent-bridge install
pnpm --filter @unykorn/agent-bridge build
pnpm --filter @unykorn/agent-bridge typecheck
```

## Related

- Canonical contract: [`docs/SOVEREIGN_BRIDGE.md`](../../docs/SOVEREIGN_BRIDGE.md)
- Canonical prompt: <https://digitalgiant.xyz/agents/SYSTEM_PROMPT.md>
- Live Worker: <https://api.digitalgiant.xyz>
- Activation pack: <https://api.digitalgiant.xyz/api/agent/activation_pack>
- Schemas: <https://digitalgiant.xyz/schemas/>
