/**
 * OpenClaw gateway tool registration for the Digital Giant agent surface.
 *
 * The CEF / Electron shell starts the OpenClaw gateway on 127.0.0.1:18789
 * (see docs/06-SECURITY.md) and asks this module to register the sovereign
 * function map. Every tool is an explicit allowlist entry; there is no
 * arbitrary shell escape.
 *
 * The registrar is transport-agnostic: pass any OpenClaw-shaped tool
 * registry (the gateway library, an MCP server, or a Cursor adapter) and
 * the same definitions bind.
 */

import {
  DGAPIError,
  DigitalGiantClient,
  type DGFunctionName,
  type DGGenerateResult,
} from "./digital_giant.js";
import type { ModelRouter } from "./model_router.js";

/** Minimal contract the gateway exposes to bridge packages. */
export interface OpenClawToolRegistry {
  register(tool: OpenClawTool): void;
}

export interface OpenClawTool {
  name: string;
  description: string;
  /** JSON Schema (draft-07 or 2020-12) for the tool input. */
  input_schema: Record<string, unknown>;
  /** Tags surfaced by the gateway approval modal. */
  tags?: string[];
  /** Policy class — gates approval modal, x402 metering, audit log. */
  policy: "design" | "persist" | "lookup" | "interpret";
  /** Handler. Must be deterministic; returns JSON-serializable object. */
  handler: (input: unknown) => Promise<unknown>;
}

export interface RegisterOptions {
  dg: DigitalGiantClient;
  /** If supplied, design + interpret functions go through the router. */
  router?: ModelRouter;
  /** Allow persistence tools (`/api/*` writes). Default true. */
  enablePersistence?: boolean;
  /** Allow connector tools (GLEIF, M-RETS, WREGIS, Verra). Default true. */
  enableConnectors?: boolean;
}

export function registerDigitalGiantTools(
  registry: OpenClawToolRegistry,
  opts: RegisterOptions,
): DGFunctionName[] {
  const { dg, router, enablePersistence = true, enableConnectors = true } = opts;
  const designed: DGFunctionName[] = [];

  const dispatch = async (fn: DGFunctionName, spec: unknown): Promise<DGGenerateResult> => {
    const payload = { function: fn, spec } as Parameters<DigitalGiantClient["generate"]>[0];
    if (router) return await router.dispatch(payload);
    return await dg.generate(payload);
  };

  // -- Design tier (Sonnet by default) --
  registry.register(
    designTool(
      "dg.generate_wallet",
      "Design a multi-asset wallet conforming to wallet.schema.json. Returns JSON only.",
      walletInputSchema(),
      async (input) => safe(await dispatch("generate_wallet", input)),
    ),
  );
  designed.push("generate_wallet");

  registry.register(
    designTool(
      "dg.generate_settlement_plan",
      "Design an FTH Pay settlement plan conforming to settlement.schema.json.",
      genericSpecSchema(),
      async (input) => safe(await dispatch("generate_settlement_plan", input)),
    ),
  );
  designed.push("generate_settlement_plan");

  registry.register(
    designTool(
      "dg.generate_energy_instrument",
      "Design a renewable / deregulated energy instrument conforming to energy_instrument.schema.json.",
      genericSpecSchema(),
      async (input) => safe(await dispatch("generate_energy_instrument", input)),
    ),
  );
  designed.push("generate_energy_instrument");

  registry.register(
    designTool(
      "dg.generate_carbon_instrument",
      "Design a carbon credit / offset / REC conforming to carbon_instrument.schema.json. Include pass_through.retired_for_subject when a client receives the credit.",
      genericSpecSchema(),
      async (input) => safe(await dispatch("generate_carbon_instrument", input)),
    ),
  );
  designed.push("generate_carbon_instrument");

  registry.register(
    designTool(
      "dg.generate_registry_entry",
      "Design a Unykorn Genesis registry entry conforming to registry.schema.json.",
      genericSpecSchema(),
      async (input) => safe(await dispatch("generate_registry_entry", input)),
    ),
  );
  designed.push("generate_registry_entry");

  registry.register(
    designTool(
      "dg.link_entities",
      "Compute cross-schema linkage per ontology.schema.json. Input is a map of named references.",
      {
        type: "object",
        properties: {
          refs: { type: "object", additionalProperties: { type: "string" } },
        },
        required: ["refs"],
        additionalProperties: false,
      },
      async (input) => safe(await dispatch("link_entities", (input as { refs: Record<string, string> }).refs ? input : { refs: {} })),
    ),
  );
  designed.push("link_entities");

  // -- Interpret tier (local by default per ModelRouter policy) --
  registry.register({
    name: "dg.interpret_page",
    description:
      "Interpret an open web page into a deterministic structured extract suitable for downstream sovereign-agent calls. Local model by default; escalates to Sonnet on parse failure.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
        html: { type: "string" },
        text: { type: "string" },
      },
      required: ["url"],
      additionalProperties: false,
    },
    tags: ["digital-giant", "interpret", "local-first"],
    policy: "interpret",
    handler: async (input) => safe(await dispatch("interpret_page", input)),
  });
  designed.push("interpret_page");

  // -- Persistence tier (write-through to D1 via the Worker) --
  if (enablePersistence) {
    registry.register(persistTool("dg.persist_wallet", "Persist a designed wallet object.", (o) => dg.persistWallet(o)));
    registry.register(persistTool("dg.persist_settlement", "Persist a designed settlement plan.", (o) => dg.persistSettlement(o)));
    registry.register(persistTool("dg.persist_energy_instrument", "Persist a designed energy instrument.", (o) => dg.persistEnergyInstrument(o)));
    registry.register(persistTool("dg.persist_carbon_instrument", "Persist a designed carbon instrument.", (o) => dg.persistCarbonInstrument(o)));
    registry.register(persistTool("dg.persist_registry_entry", "Persist a designed registry entry.", (o) => dg.persistRegistryEntry(o)));
  }

  // -- Lookup tier (registry connectors; never fabricate identifiers) --
  if (enableConnectors) {
    registry.register(lookupTool("dg.lookup_gleif", "Resolve a Legal Entity Identifier via GLEIF.", "lei", (id) => dg.gleif(id)));
    registry.register(lookupTool("dg.lookup_mrets", "Resolve a Midwest RETS certificate id.", "cert_id", (id) => dg.mrets(id)));
    registry.register(lookupTool("dg.lookup_wregis", "Resolve a WREGIS certificate id.", "cert_id", (id) => dg.wregis(id)));
    registry.register(lookupTool("dg.lookup_verra", "Resolve a Verra project id.", "project_id", (id) => dg.verra(id)));
    registry.register({
      name: "dg.connector_history",
      description: "Audit log of registry connector lookups performed by this Digital Giant deployment.",
      input_schema: { type: "object", properties: {}, additionalProperties: false },
      tags: ["digital-giant", "audit"],
      policy: "lookup",
      handler: async () => safe(await dg.connectorHistory()),
    });
  }

  return designed;
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

function designTool(
  name: string,
  description: string,
  inputSchema: Record<string, unknown>,
  handler: (input: unknown) => Promise<unknown>,
): OpenClawTool {
  return {
    name,
    description,
    input_schema: inputSchema,
    tags: ["digital-giant", "design", "schema-strict"],
    policy: "design",
    handler,
  };
}

function persistTool(
  name: string,
  description: string,
  fn: (obj: unknown) => Promise<unknown>,
): OpenClawTool {
  return {
    name,
    description,
    input_schema: { type: "object", additionalProperties: true },
    tags: ["digital-giant", "persist", "approval-required"],
    policy: "persist",
    handler: async (input) => safe(await fn(input)),
  };
}

function lookupTool(
  name: string,
  description: string,
  paramName: string,
  fn: (id: string) => Promise<unknown>,
): OpenClawTool {
  return {
    name,
    description,
    input_schema: {
      type: "object",
      properties: { [paramName]: { type: "string", minLength: 1 } },
      required: [paramName],
      additionalProperties: false,
    },
    tags: ["digital-giant", "lookup", "verifiable"],
    policy: "lookup",
    handler: async (input) => {
      const id = (input as Record<string, string>)[paramName];
      if (typeof id !== "string" || !id) throw new Error(`${name}: missing ${paramName}`);
      return safe(await fn(id));
    },
  };
}

function walletInputSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      owner_type: { type: "string", enum: ["person", "entity", "facility", "pool"] },
      owner_reference: { type: "string" },
      chain: { type: "string" },
      asset_symbol: { type: "string" },
      asset_class: { type: "string" },
      msb_context: { type: "object", additionalProperties: true },
    },
    additionalProperties: true,
  };
}

function genericSpecSchema(): Record<string, unknown> {
  return { type: "object", additionalProperties: true };
}

/** Convert DGAPIError into a tool-shaped error payload so OpenClaw can surface it cleanly. */
async function safe<T>(value: T | Promise<T>): Promise<T> {
  try {
    return await value;
  } catch (err) {
    if (err instanceof DGAPIError) {
      throw new Error(`Digital Giant API ${err.status}: ${err.body || err.message}`);
    }
    throw err;
  }
}
