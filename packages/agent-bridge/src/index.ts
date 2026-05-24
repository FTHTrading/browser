/**
 * @unykorn/agent-bridge
 *
 * Sovereign Browser → Digital Giant + OpenClaw bridge.
 *
 * Quickstart (CEF / Electron host):
 *
 *   import {
 *     DigitalGiantClient,
 *     ModelRouter,
 *     registerDigitalGiantTools,
 *   } from "@unykorn/agent-bridge";
 *
 *   const dg = new DigitalGiantClient();
 *   const pack = await dg.hydrate();                          // pin pack.version
 *   const router = new ModelRouter({
 *     dg,
 *     systemPrompt: pack.system_prompt,
 *     local: {
 *       baseUrl: "http://127.0.0.1:11434/v1",
 *       model: "qwen2.5:32b",
 *     },
 *   });
 *   const tools = registerDigitalGiantTools(openClawRegistry, { dg, router });
 *
 * `tools` is the function map the gateway exposes to the active agent.
 */

export {
  DigitalGiantClient,
  DGAPIError,
  DG_API_BASE,
  DG_CANONICAL_PROMPT_VERSION,
} from "./digital_giant.js";

export type {
  DGActivationPack,
  DGCarbonInstrumentSpec,
  DGClientOptions,
  DGConnectorLookup,
  DGEnergyInstrumentSpec,
  DGFunctionName,
  DGGenerateResult,
  DGGenerateSpec,
  DGRegistryEntrySpec,
  DGSettlementSpec,
  DGWalletSpec,
} from "./digital_giant.js";

export { ModelRouter } from "./model_router.js";
export type {
  LocalRuntime,
  ModelRouterOptions,
  RouteTarget,
} from "./model_router.js";

export { registerDigitalGiantTools } from "./openclaw_tools.js";
export type {
  OpenClawTool,
  OpenClawToolRegistry,
  RegisterOptions,
} from "./openclaw_tools.js";
