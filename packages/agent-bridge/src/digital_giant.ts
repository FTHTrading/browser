/**
 * Sovereign Browser → Digital Giant API client.
 *
 * Single typed surface for the permanent backend at api.digitalgiant.xyz.
 * Hydrates the canonical activation pack on startup, exposes the seven
 * sovereign-agent functions, and proxies every persistence call through
 * the deterministic schema-validated endpoints.
 *
 * Contract source: docs/SOVEREIGN_BRIDGE.md (mirrored from FTHTrading/digital-giant).
 * Prompt source:  https://digitalgiant.xyz/agents/SYSTEM_PROMPT.md
 * Prompt served:  https://api.digitalgiant.xyz/api/agent/system_prompt
 * Schemas:        https://digitalgiant.xyz/schemas/{name}.schema.json
 *
 * Operating principles (mirrored from the canonical prompt; do not relax):
 * - This client never claims to move money, custody assets, or issue instruments.
 * - It designs flows and schemas only. Persistence is via /api/* writes.
 * - External identifiers (BIC, Bloomberg, LEI, MSB) are opaque. Never fabricate.
 */

export const DG_API_BASE = "https://api.digitalgiant.xyz" as const;
export const DG_CANONICAL_PROMPT_VERSION = "2026-05-24.1" as const;

// ---------------------------------------------------------------------------
// Activation pack — exactly what /api/agent/activation_pack returns.
// ---------------------------------------------------------------------------

export type DGFunctionName =
  | "generate_wallet"
  | "generate_settlement_plan"
  | "generate_energy_instrument"
  | "generate_carbon_instrument"
  | "generate_registry_entry"
  | "link_entities"
  | "interpret_page";

export interface DGActivationPack {
  version: string;
  target_platforms: string[];
  system_prompt: string;
  activation_rule: string;
  schemas: Record<string, string>;
  function_map: DGFunctionName[];
  endpoints: Record<string, string>;
  identifiers?: Record<string, unknown>;
  runtime?: { backend?: string; [k: string]: unknown };
}

// ---------------------------------------------------------------------------
// Schema-typed payloads (mirrors of the public JSON Schemas, narrowed to the
// fields the agent surface guarantees). Always optional/loose at the leaf so
// the Worker remains the validator of record.
// ---------------------------------------------------------------------------

export interface DGWalletSpec {
  owner_type?: "person" | "entity" | "facility" | "pool";
  owner_reference?: string;
  bic_identifier?: string;
  bloomberg_identifier?: string;
  msb_context?: {
    kyc_required?: boolean;
    aml_required?: boolean;
    jurisdiction?: string;
    risk_rating?: "low" | "medium" | "high";
  };
  chain?: "ethereum" | "bitcoin" | "polygon" | string;
  asset_symbol?: string;
  asset_class?: "stablecoin" | "major" | "rwa" | "carbon" | "energy" | "commodity";
  custody_model?: "self_custody" | "third_party_custodian" | "smart_contract_escrow";
  [extra: string]: unknown;
}

export interface DGSettlementSpec {
  parties?: Array<{
    party_id?: string;
    role?: "payer" | "payee" | "escrow_agent" | "oracle";
    wallet_reference?: string;
  }>;
  assets?: Array<{
    asset_symbol?: string;
    chain?: string;
    amount?: number | string;
    asset_class?: string;
  }>;
  conditions?: Array<{
    condition_id?: string;
    type?: "time_lock" | "oracle_event" | "signature" | "milestone";
    parameters?: Record<string, unknown>;
  }>;
  [extra: string]: unknown;
}

export interface DGEnergyInstrumentSpec {
  instrument_type?: "solar" | "wind" | "hydro" | "storage" | "mixed";
  underlying_asset?: {
    facility_id?: string;
    capacity_mw?: number;
    location?: string;
    jurisdiction?: string;
  };
  [extra: string]: unknown;
}

export interface DGCarbonInstrumentSpec {
  credit_type?: "offset" | "removal" | "avoidance" | "rec";
  standard?: "Verra" | "GoldStandard" | "CAR" | string;
  vintage_year?: number;
  quantity_tonnes?: number;
  project_reference?: string;
  [extra: string]: unknown;
}

export interface DGRegistryEntrySpec {
  subject_id?: string;
  subject_type?: "person" | "entity" | "facility" | "asset" | "instrument";
  document_type?: "agreement" | "certificate" | "attestation" | "identity" | "registry_record";
  document_hash?: string;
  storage_location?: "ipfs" | "s3" | "on_chain" | "hybrid";
  [extra: string]: unknown;
}

export type DGGenerateSpec =
  | { function: "generate_wallet"; spec: DGWalletSpec }
  | { function: "generate_settlement_plan"; spec: DGSettlementSpec }
  | { function: "generate_energy_instrument"; spec: DGEnergyInstrumentSpec }
  | { function: "generate_carbon_instrument"; spec: DGCarbonInstrumentSpec }
  | { function: "generate_registry_entry"; spec: DGRegistryEntrySpec }
  | { function: "link_entities"; spec: { refs: Record<string, string> } }
  | { function: "interpret_page"; spec: { url: string; html?: string; text?: string } };

export interface DGGenerateResult<T = unknown> {
  function: DGFunctionName;
  object: T;
  validation?: { validated: boolean; errors?: string[] };
  routed_to?: string; // populated when model_router proxied
  [extra: string]: unknown;
}

export interface DGConnectorLookup {
  source: string;
  status: number;
  url: string;
  data?: unknown;
  cached?: boolean;
  [extra: string]: unknown;
}

// ---------------------------------------------------------------------------
// Client.
// ---------------------------------------------------------------------------

export interface DGClientOptions {
  /** Override the base URL for staging or air-gapped environments. */
  baseUrl?: string;
  /** Bearer JWT once auth middleware ships (see SOVEREIGN_BRIDGE.md). */
  authToken?: string;
  /** Inject your own fetch (Node 20+ has it native; CEF shell provides one too). */
  fetchImpl?: typeof fetch;
  /** Per-request timeout, ms. Default 30s. */
  timeoutMs?: number;
}

export class DigitalGiantClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly authToken: string | undefined;
  private activationCache: { pack: DGActivationPack; fetchedAt: number } | null = null;

  constructor(opts: DGClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? DG_API_BASE).replace(/\/$/, "");
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
    this.authToken = opts.authToken;
    if (!this.fetchImpl) {
      throw new Error("DigitalGiantClient: no fetch implementation available");
    }
  }

  // -------------------------------------------------------------------------
  // Activation hydration. Sovereign Browser calls this once at boot.
  // -------------------------------------------------------------------------

  /**
   * GET /api/agent/activation_pack — returns canonical prompt, schemas,
   * function map, and endpoint catalog. Cached in-memory for 5 minutes.
   * Sovereign Browser pins `pack.version` and surfaces a soft warning if
   * a redeploy bumps it.
   */
  async hydrate(force = false): Promise<DGActivationPack> {
    const fresh = !force && this.activationCache && Date.now() - this.activationCache.fetchedAt < 5 * 60_000;
    if (fresh && this.activationCache) return this.activationCache.pack;
    const pack = await this.request<DGActivationPack>("GET", "/api/agent/activation_pack");
    this.activationCache = { pack, fetchedAt: Date.now() };
    if (pack.version !== DG_CANONICAL_PROMPT_VERSION) {
      // Soft drift signal; the shell decides whether to surface it.
      console.warn(
        `[digital_giant] prompt drift: bridge pinned ${DG_CANONICAL_PROMPT_VERSION}, ` +
          `server returned ${pack.version}. Refresh the bridge.`,
      );
    }
    return pack;
  }

  /** Plaintext prompt (the same string the page assistant uses). */
  async systemPrompt(): Promise<string> {
    return await this.requestText("GET", "/api/agent/system_prompt");
  }

  async health(): Promise<{ status: string; db: boolean; timestamp: string }> {
    return await this.request("GET", "/health");
  }

  // -------------------------------------------------------------------------
  // Agent surface — the 7-function map. Returns deterministic schema objects.
  // -------------------------------------------------------------------------

  async generate<T = unknown>(payload: DGGenerateSpec): Promise<DGGenerateResult<T>> {
    return await this.request<DGGenerateResult<T>>("POST", "/api/agent/generate", payload);
  }

  // Typed convenience wrappers. Each one routes through `generate` so the
  // model_router can intercept and re-route by function name.
  generateWallet(spec: DGWalletSpec) {
    return this.generate({ function: "generate_wallet", spec });
  }
  generateSettlementPlan(spec: DGSettlementSpec) {
    return this.generate({ function: "generate_settlement_plan", spec });
  }
  generateEnergyInstrument(spec: DGEnergyInstrumentSpec) {
    return this.generate({ function: "generate_energy_instrument", spec });
  }
  generateCarbonInstrument(spec: DGCarbonInstrumentSpec) {
    return this.generate({ function: "generate_carbon_instrument", spec });
  }
  generateRegistryEntry(spec: DGRegistryEntrySpec) {
    return this.generate({ function: "generate_registry_entry", spec });
  }
  linkEntities(refs: Record<string, string>) {
    return this.generate({ function: "link_entities", spec: { refs } });
  }
  interpretPage(spec: { url: string; html?: string; text?: string }) {
    return this.generate({ function: "interpret_page", spec });
  }

  // -------------------------------------------------------------------------
  // Persistence — design → persist is always a two-step. The agent designs
  // the JSON, the shell shows it to the user, then the user explicitly
  // commits via these endpoints.
  // -------------------------------------------------------------------------

  persistWallet<T>(obj: T) {
    return this.request("POST", "/api/wallets", obj);
  }
  persistSettlement<T>(obj: T) {
    return this.request("POST", "/api/settlements", obj);
  }
  persistEnergyInstrument<T>(obj: T) {
    return this.request("POST", "/api/instruments/energy", obj);
  }
  persistCarbonInstrument<T>(obj: T) {
    return this.request("POST", "/api/instruments/carbon", obj);
  }
  persistRegistryEntry<T>(obj: T) {
    return this.request("POST", "/api/registry", obj);
  }
  registryBySubject(subjectId: string) {
    return this.request("GET", `/api/registry/by_subject/${encodeURIComponent(subjectId)}`);
  }

  // -------------------------------------------------------------------------
  // Registry connectors — verifiable lookups, never fabricated.
  // -------------------------------------------------------------------------

  gleif(lei: string) {
    return this.request<DGConnectorLookup>("GET", `/api/connectors/gleif/${encodeURIComponent(lei)}`);
  }
  mrets(certId: string) {
    return this.request<DGConnectorLookup>("GET", `/api/connectors/mrets/${encodeURIComponent(certId)}`);
  }
  wregis(certId: string) {
    return this.request<DGConnectorLookup>("GET", `/api/connectors/wregis/${encodeURIComponent(certId)}`);
  }
  verra(projectId: string) {
    return this.request<DGConnectorLookup>("GET", `/api/connectors/verra/${encodeURIComponent(projectId)}`);
  }
  connectorHistory() {
    return this.request("GET", "/api/connectors/history");
  }

  // -------------------------------------------------------------------------
  // Low-level transport.
  // -------------------------------------------------------------------------

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const r = await this.rawFetch(method, path, body);
    if (!r.ok) {
      const text = await safeText(r);
      throw new DGAPIError(r.status, `${method} ${path} → ${r.status}: ${text}`, text);
    }
    return (await r.json()) as T;
  }

  private async requestText(method: string, path: string): Promise<string> {
    const r = await this.rawFetch(method, path);
    if (!r.ok) {
      const text = await safeText(r);
      throw new DGAPIError(r.status, `${method} ${path} → ${r.status}: ${text}`, text);
    }
    return await r.text();
  }

  private async rawFetch(method: string, path: string, body?: unknown): Promise<Response> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      accept: "application/json",
      "user-agent": "sovereign-browser/agent-bridge/0.1.0",
    };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (this.authToken) headers["authorization"] = `Bearer ${this.authToken}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

export class DGAPIError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: string,
  ) {
    super(message);
    this.name = "DGAPIError";
  }
}

async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return "";
  }
}
