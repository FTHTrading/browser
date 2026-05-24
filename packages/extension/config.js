/**
 * Sovereign Browser — operator config.
 *
 * Sovereign-only by design: no third-party LLM keys live here, ever.
 * The bridge calls a local runtime (Ollama / OpenClaw / any
 * OpenAI-compatible local server) and validates the result against the
 * Digital Giant Worker at api.digitalgiant.xyz.
 */
export const SOVEREIGN_CONFIG = {
  // Digital Giant permanent API (validator + persistence + connectors)
  dgApiBase: 'https://api.digitalgiant.xyz',

  // OpenClaw gateway (optional; if running, used for browser-use tools)
  gatewayUrl: 'http://127.0.0.1:18789',
  gatewayHealthPath: '/health',

  // Local LLM runtime (required for sovereign-only design tier)
  localRuntime: {
    baseUrl: 'http://127.0.0.1:11434/v1', // Ollama default
    model: 'qwen2.5:32b',
    // To switch to LM Studio:    baseUrl: 'http://127.0.0.1:1234/v1'
    // To switch to OpenClaw LLM: baseUrl: 'http://127.0.0.1:18789/v1'
  },

  // Canonical Zenodo DOIs (Phase 1)
  dois: {
    lps1: '10.5281/zenodo.18646886',
    genesis: '10.5281/zenodo.18729652',
  },

  donkeysLibraryUrl: 'https://donkeys.xxxiii.io/',
};

/** @deprecated kept for backward compat with older sidepanel.js */
export const STORM_CONFIG = SOVEREIGN_CONFIG;
