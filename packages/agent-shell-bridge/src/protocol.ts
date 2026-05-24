/**
 * Wire protocol between the DG Browser native shell and the sandboxed
 * Node sidecar that hosts @unykorn/agent-bridge.
 *
 * Transport: JSON-RPC 2.0, newline-delimited, over a Unix domain socket
 *   (macOS / Linux) or a Windows named pipe. One client (shell) talks to
 *   one server (sidecar); reconnection is the shell's responsibility.
 *
 * Why JSON-RPC, not Cap'n Proto / gRPC: the surface is tiny (10 methods
 * total at v1), latency is non-critical (a sign drawer + an LLM round
 * trip dwarfs any IPC cost), and pure-text frames are debuggable in
 * production logs. We pay one schema, not two.
 *
 * All payloads MUST round-trip through JSON. No Buffer, no Date — use
 * ISO 8601 strings. No undefined — omit the field instead.
 */

/**
 * Type aliases mirror the public surface of @unykorn/agent-bridge.
 * They are duplicated here on purpose: this package must be installable
 * independently and must not introduce a build-time dependency on the
 * sibling source tree. Runtime code that uses these types injects a
 * dispatcher (see SidecarOptions.dispatch) so we never import the
 * concrete agent-bridge implementation across the package boundary.
 */
export type DGFunctionName =
  | "generate_wallet"
  | "generate_settlement_plan"
  | "generate_energy_instrument"
  | "generate_carbon_instrument"
  | "generate_registry_entry"
  | "link_entities"
  | "interpret_page";

export type DGWalletSpec = Record<string, unknown>;
export type DGSettlementSpec = Record<string, unknown>;
export type DGEnergyInstrumentSpec = Record<string, unknown>;
export type DGCarbonInstrumentSpec = Record<string, unknown>;
export type DGRegistryEntrySpec = Record<string, unknown>;

export interface DGGenerateResult<T = unknown> {
  function: DGFunctionName;
  object: T;
  validation?: { validated: boolean; missing?: string[]; errors?: string[] };
  routed_to?: string;
  mode?: "scaffold" | "validate";
  [extra: string]: unknown;
}

// -----------------------------------------------------------------------------
// JSON-RPC 2.0 envelopes.
// -----------------------------------------------------------------------------

export interface RpcRequest<P = unknown> {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: P;
}

export interface RpcResponse<R = unknown> {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: R;
  error?: RpcError;
}

export interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface RpcNotification<P = unknown> {
  jsonrpc: "2.0";
  method: string;
  params?: P;
}

// -----------------------------------------------------------------------------
// Method catalog. Keep this in sync with the sidecar implementation in
// packages/agent-bridge/src/openclaw_tools.ts.
// -----------------------------------------------------------------------------

/** All RPC method names the shell can call. */
export type RpcMethod =
  | "hello"                  // shell handshake; returns sidecar version + canonical prompt version
  | "agent.generate"         // run a 7-fn function map call
  | "agent.scaffold"         // worker-only scaffold (no LLM)
  | "agent.validate"         // worker-only validate (no LLM)
  | "agent.persist"          // POST the validated object to /api/<route>
  | "connector.gleif"        // verifiable identifier lookups
  | "connector.mrets"
  | "connector.wregis"
  | "connector.verra"
  | "connector.history"
  | "ping";                  // health, returns server timestamp

export interface HelloResult {
  sidecar_version: string;
  agent_bridge_version: string;
  canonical_prompt_version: string;
  local_runtime: { configured: boolean; base_url?: string; model?: string };
}

// Convenient typed unions for the call surface.
export type AgentGenerateParams =
  | { function: "generate_wallet"; spec: DGWalletSpec; object?: Record<string, unknown> }
  | { function: "generate_settlement_plan"; spec: DGSettlementSpec; object?: Record<string, unknown> }
  | { function: "generate_energy_instrument"; spec: DGEnergyInstrumentSpec; object?: Record<string, unknown> }
  | { function: "generate_carbon_instrument"; spec: DGCarbonInstrumentSpec; object?: Record<string, unknown> }
  | { function: "generate_registry_entry"; spec: DGRegistryEntrySpec; object?: Record<string, unknown> }
  | { function: "link_entities"; spec: { refs: Record<string, string> }; object?: Record<string, unknown> }
  | { function: "interpret_page"; spec: { url: string; html?: string; text?: string }; object?: Record<string, unknown> };

export type AgentGenerateResult = DGGenerateResult;

export interface ConnectorLookupParams {
  id: string;
}

// -----------------------------------------------------------------------------
// Notifications: server → client. The shell renders these as toast / drawer
// updates without holding open an RPC response.
// -----------------------------------------------------------------------------

export type SidecarNotification =
  | {
      method: "sidecar.runtime.degraded";
      params: { reason: "local_unreachable" | "worker_unreachable"; message: string };
    }
  | {
      method: "sidecar.progress";
      params: { request_id: string; step: string; pct?: number };
    };

// -----------------------------------------------------------------------------
// Reserved error codes (negatives are JSON-RPC standard; we use positives).
// -----------------------------------------------------------------------------

export const DG_RPC_ERRORS = {
  LOCAL_RUNTIME_UNREACHABLE: 1001,
  WORKER_UNREACHABLE: 1002,
  PERMISSION_DENIED: 1003,
  VALIDATION_FAILED: 1004,
  PERSIST_FAILED: 1005,
  UNKNOWN_FUNCTION: 1006,
} as const;

export function isFunctionName(s: unknown): s is DGFunctionName {
  return (
    typeof s === "string" &&
    [
      "generate_wallet",
      "generate_settlement_plan",
      "generate_energy_instrument",
      "generate_carbon_instrument",
      "generate_registry_entry",
      "link_entities",
      "interpret_page",
    ].includes(s)
  );
}
