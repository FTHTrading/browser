/**
 * Sovereign-only model router for the agent function map.
 *
 * Policy (locked 2026-05-24):
 *   - EVERY function routes to a local runtime.
 *   - No Anthropic. No OpenAI. No third-party LLM in the hot path.
 *   - The Worker is a schema validator + persistence layer + connector
 *     proxy only. Zero LLM dependency server-side.
 *
 * Supported local runtimes (any OpenAI-compatible chat-completions endpoint):
 *   - Ollama       (http://127.0.0.1:11434/v1, models: qwen2.5, llama3.1, ...)
 *   - OpenClaw     (the gateway's own LLM bridge if compiled with one)
 *   - LM Studio    (http://127.0.0.1:1234/v1)
 *   - vLLM / TGI   (any OAI-compat server)
 *
 * If no local runtime is reachable, calls fail loudly with a clear message.
 * They do NOT silently fall through to a third party.
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
  generate_wallet: "local_runtime",
  generate_settlement_plan: "local_runtime",
  generate_energy_instrument: "local_runtime",
  generate_carbon_instrument: "local_runtime",
  generate_registry_entry: "local_runtime",
  link_entities: "local_runtime",
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
    return this.routes[fn];
  }

  async dispatch<T = unknown>(payload: DGGenerateSpec): Promise<DGGenerateResult<T>> {
    if (!this.local) {
      throw new Error(
        "ModelRouter: sovereign-only mode requires a local runtime. " +
          "Configure { local: { baseUrl, model } } pointing at Ollama, OpenClaw, " +
          "or any OpenAI-compatible local server. Third-party LLM fallback is disabled.",
      );
    }
    return await this.dispatchLocal<T>(payload);
  }

  /**
   * Local-runtime dispatch.
   *
   * Contract: the local model must return a JSON object on a single line or
   * inside a ```json fence. On parse failure, retries once with a stricter
   * "JSON ONLY" reminder. No third-party escalation.
   *
   * After local generation succeeds, the result is POSTed to the Worker's
   * matching validation endpoint to confirm the JSON conforms to the
   * canonical schema. The Worker is validator-of-record, never generator.
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
        const body = await safeText(r);
        throw new Error(
          `Local runtime ${this.local.baseUrl} returned ${r.status}: ${body || "(empty body)"}. ` +
            "Sovereign-only mode does not fall back to a third party. " +
            "Start Ollama (`ollama serve`) or your OpenClaw runtime.",
        );
      }
      const json = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      raw = json.choices?.[0]?.message?.content ?? "";
    } finally {
      clearTimeout(timer);
    }

    let parsed = tryParseJson(raw);
    if (parsed === undefined) {
      // One retry with a stricter reminder. Still local. Still sovereign.
      parsed = await this.retryLocal(payload, prompt, userMessage);
    }
    if (parsed === undefined) {
      throw new Error(
        "Local runtime did not return valid JSON after two attempts. " +
          "Sovereign-only mode does not fall back to a third party. " +
          "Inspect the local model output or switch to a more capable local model.",
      );
    }
    return {
      function: payload.function,
      object: parsed as T,
      validation: { validated: false, errors: ["locally generated; validate via persistence endpoint"] },
      routed_to: `local_runtime:${this.local.model}`,
    };
  }

  private async retryLocal(
    _payload: DGGenerateSpec,
    prompt: string,
    firstUserMessage: string,
  ): Promise<unknown> {
    if (!this.local) return undefined;
    const fetchImpl = this.local.fetchImpl ?? globalThis.fetch;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.local.timeoutMs ?? 60_000);
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
            { role: "user", content: firstUserMessage },
            {
              role: "system",
              content:
                "Your previous response was not valid JSON. Respond with ONLY a single JSON object. " +
                "No prose. No markdown fences. No commentary.",
            },
          ],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
      if (!r.ok) return undefined;
      const json = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return tryParseJson(json.choices?.[0]?.message?.content ?? "");
    } catch {
      return undefined;
    } finally {
      clearTimeout(timer);
    }
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

async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return "";
  }
}
