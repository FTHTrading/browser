/** Sovereign Browser extension — operator config (dev prototype only) */
export const SOVEREIGN_CONFIG = {
  /** OpenClaw gateway (local operator stack) */
  gatewayUrl: 'http://127.0.0.1:18789',
  gatewayHealthPath: '/health',

  /**
   * Local corpus manifest — extension cannot read filesystem paths in MV3.
   * Use OpenClaw `research_corpus_query` when wired; path is documentation only.
   * Set via operator workspace: vault/intel/CORPUS_MANIFEST.json
   */
  corpusManifestHint: 'vault/intel/CORPUS_MANIFEST.json',

  /** Canonical Zenodo DOIs (Phase 1) */
  dois: {
    lps1: '10.5281/zenodo.18646886',
    genesis: '10.5281/zenodo.18729652',
  },

  donkeysLibraryUrl: 'https://donkeys.xxxiii.io/',
};

/** @deprecated Use SOVEREIGN_CONFIG */
export const STORM_CONFIG = SOVEREIGN_CONFIG;
