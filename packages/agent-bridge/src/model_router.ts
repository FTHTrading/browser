/**
 * Tiered model router for the sovereign-agent function map.
 *
 * Policy (chosen 2026-05-24):
 *   - Design endpoints  → Claude Sonnet 4.5/4.6 via the Worker
 *                         (high-stakes, schema-strict, audit-of-record).
 *   - interpret_page    → local Ollama / Qwen / OpenClaw-native
 *                         (high-volume, page-shaped, sovereign).
 *
 * The router never bypasses validation. The Worker remains the validator of
 * record for every persisted object — local interpretation is only allowed
 * to produce *intermediate* structures that the design tier later refines.
 */

import {
  DigitalGiantClient,
  type DGFunctionName,
  type DGGenerateResult,
  type DGGenerateSpec,
} from "./digital_giant.js";

export type RouteTarget = "dg_worker_sonnet" | "local_runtime";

export interface LocalRuntime {
  /** OpenAI-compatible chat completion endpoint, e.g. http://127.0.0.1:11434/v1 */
  baseUrl: string;
  /** Model id known to the local runtime (qwen2.5:32b, llama3.1:70b, openclaw-local, …). */
  model: string;
  /** Optional API key for local runtimes that gate access. */
  apiKey?: string;
  /** Per-request timeout, ms. Default 60s — local CPUs can be slow. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface ModelRouterOptions {
  /** The DG client wired to api.digitalgiant.xyz. */
  dg: DigitalGiantClient;
  /** Local runtime config; if absent, every call falls back to the Worker. */
  local?: LocalRuntime;
  /**
   * Override the routing table. By default only `interpret_page` is local.
   * Provide a full map to harden or relax the policy.
   */
  routes?: Partial<Record<DGFunctionName, RouteTarget>>;
  /**
   * The canonical sovereign-agent system prompt. If omitted, the router
   * hydrates it lazily from the Worker.
   */
  systemPrompt?: string;
}

const DEFAULT_ROUTES: Record<DGFunctionName, RouteTarget> = {
  generate_wallet: "dg_worker_sonnet",
  generate_settlement_plan: "dg_worker_sonnet",
  generate_energy_instrument: "dg_worker_sonnet",
  generate_carbon_instrument: "dg_worker_sonnet",
  generate_registry_entry: "dg_worker_sonnet",
  link_entities: "dg_worker_sonnet",
  interpret_page: "local_runtime",
};

export class ModelRouter {
  private readonly dg: DigitalGiantClient;
  private readonly local: LocalRuntime | undefined;
  private readonly routes: Record<DGFunctionName, RouteTarget>;
  private cachedPrompt: string | undefined;

  constructor(opts: ModelRouterOptions) {
    this.dg = opts.dg;
    this.local = opts.local;
    this.routes = { ...DEFAULT_ROUTES, ...(opts.routes ?? {}) };
    this.cachedPrompt = opts.systemPrompt;
  }

  routeFor(fn: DGFunctionName): RouteTarget {
    const target = this.routes[fn];
    if (target === "local_runtime" && !this.local) return "dg_worker_sonnet";
    return target;
  }

  async dispatch<T = unknown>(payload: DGGenerateSpec): Promise<DGGenerateResult<T>> {
    const target = this.routeFor(payload.function);
    if (target === "dg_worker_sonnet") {
      const r = await this.dg.generate<T>(payload);
      return { ...r, routed_to: "dg_worker_sonnet" };
    }
    return await this.dispatchLocal<T>(payload);
  }

  /**
   * Local-runtime dispatch. Only used for interpret_page by default.
   *
   * Contract: the local model must return a JSON object on a single line or
   * inside a ```json fence. Anything else is treated as a parse failure and
   * the request is escalated to the Worker tier.
   */
  private async dispatchLocal<T>(payload: DGGenerateSpec): Promise<DGGenerateResult<T>> {
    if (!this.local) throw new Error("ModelRouter: local runtime not configured");
    const prompt = await this.ensurePrompt();
    const userMessage = buildLocalUserMessage(payload);

    const fetchImpl = this.local.fetchImpl ?? globalThis.fetch;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.local.timeoutMs ?? 60_000);
    let raw: string;
    try {
      const r = await fetchImpl(`${this.local.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...(this.local.apiKey ? { authorization: `Bearer ${this.local.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.local.model,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
      if (!r.ok) {
        return await this.escalate<T>(payload, `local ${r.status}`);
      }
      const json = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      raw = json.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      return await this.escalate<T>(payload, `local error: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }

    const parsed = tryParseJson(raw);
    if (parsed === undefined) {
      return await this.escalate<T>(payload, "local non-json response");
    }
    return {
      function: payload.function,
      object: parsed as T,
      validation: { validated: false, errors: ["validated locally; not yet checked against schema"] },
      routed_to: `local_runtime:${this.local.model}`,
    };
  }

  private async escalate<T>(payload: DGGenerateSpec, reason: string): Promise<DGGenerateResult<T>> {
    const r = await this.dg.generate<T>(payload);
    return { ...r, routed_to: `dg_worker_sonnet (escalated: ${reason})` };
  }

  private async ensurePrompt(): Promise<string> {
    if (this.cachedPrompt) return this.cachedPrompt;
    const prompt = await this.dg.systemPrompt();
    this.cachedPrompt = prompt;
    return prompt;
  }
}

function buildLocalUserMessage(payload: DGGenerateSpec): string {
  return [
    `function=${payload.function}`,
    `spec=${JSON.stringify(payload.spec)}`,
    "Return ONLY a single JSON object that conforms to the matching Digital Giant schema.",
    "Do not include prose. Do not invent identifiers. Mark unverified fields with \"_unverified\": true.",
  ].join("\n");
}

function tryParseJson(raw: string): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}
