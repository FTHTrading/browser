# Sovereign Browser — Compliance & Research Citations

**Document version:** 1.0  
**Date:** 2026-05-24  
**Status:** Reference framework — **not legal advice**

---

## Purpose

This document catalogs regulatory **awareness**, published research citations, and open-source compliance obligations for Sovereign Browser engineering and enterprise procurement. It does **not** constitute legal, tax, or compliance certification.

---

## Published research (Zenodo DOI)

| DOI | Title / subject | Browser use |
|-----|-----------------|-------------|
| [10.5281/zenodo.18646886](https://doi.org/10.5281/zenodo.18646886) | **LPS-1** — Literary Provenance Standard | Creator verify badges, paragraph-level provenance in side panel |
| [10.5281/zenodo.18729652](https://doi.org/10.5281/zenodo.18729652) | **Genesis Protocol** — deterministic proof index | Enterprise simulation citations; agent research cards |

### Citation format (agent replies)

```text
[LPS-1] FTH Trading. (2026). Literary Provenance Standard v1.
  https://doi.org/10.5281/zenodo.18646886

[Genesis] FTH Trading. (2026). Genesis Protocol Proof Index.
  https://doi.org/10.5281/zenodo.18729652
```

---

## Research corpus (CORPUS_MANIFEST)

| Metric | Count | Notes |
|--------|-------|-------|
| Harvest total | **2,998** | Full workspace harvest |
| Manifest count | **1,831** | Indexed for RAG |
| Categories | research 41 · infra 602 · legal 256 · ops 68 · product 579 · protocol 285 | Reference architecture |

**Integration:** OpenClaw tool `research_corpus_query` → corpus-first omnibox search. DOI field on applicable documents.

**Genesis proof index approach:** Agent replies citing corpus hits must include DOI (when present) + local document path + LPS-1 badge if provenance-verified.

---

## Open-source license obligations

| Component | License | Obligation |
|-----------|---------|------------|
| Chromium / CEF | BSD-3 + LGPL/MPL | Ship `about:credits`; aggregate LICENSE files |
| Electron (fallback) | MIT | Include copyright notice |
| Browser Use | MIT | Include copyright notice |
| Playwright | Apache-2.0 | Include copyright notice |
| React (sidecar-ui) | MIT | Include copyright notice |

**Excluded from default binary:** Skyvern (AGPL) — optional isolated cloud service with separate legal review.

**Chromium branding:** Do not use Google Chrome trademarks. See [02-ENGINE-DECISION.md](./02-ENGINE-DECISION.md).

---

## Regulatory framework awareness

| Framework | Relevance | Browser control |
|-----------|-----------|-----------------|
| **Basel III / OpRisk** | Financial institution clients | Audit trails, approval gates, agent logging |
| **ISO 27001** | Enterprise security programs | Control mapping roadmap Phase 3 |
| **SOC 2 Type II** | SaaS control plane | Target for tenant billing gateway |
| **GDPR** | EU users / tenants | Data isolation, deletion workflows, DPA |
| **CCPA** | California users | Privacy disclosures, opt-out flows |
| **FinCEN / MSB** | x402/ATP money flows | Client responsible for licensing; platform provides receipts only |
| **Export control (EAR)** | Cryptography in TLS/wallets | Counsel review before international ship |

### law.unykorn policy packs

Jurisdiction-aware routing templates — assist documentation and gating; **not** a substitute for licensed compliance review.

---

## FTH Trading control plane references

| System | URL | Role |
|--------|-----|------|
| unykorn.ai | https://unykorn.ai | Product home |
| paid.unykorn.org | https://paid.unykorn.org | x402 facilitator |
| law.unykorn.org | https://law.unykorn.org | Policy router |
| x402.unykorn.org | https://x402.unykorn.org | Payment network |
| ram.unykorn.org | https://ram.unykorn.org | RAMM proofs |
| storm.unykorn.org | https://storm.unykorn.org | Ops HUD (not browser) |

**Registry:** ~170 FTHTrading GitHub repos · 151 websites in master registry.

---

## Data processing summary (procurement)

| Data type | Location | Retention |
|-----------|----------|-----------|
| Client corpus slice | Tenant vault | Per contract |
| Agent audit logs | Tenant + optional cloud | Configurable |
| x402 receipts | Apostle Chain + tenant export | Immutable receipts |
| Public DOI layer | Shared read-only index | Permanent (Zenodo) |

---

## Disclaimer

```text
This document provides engineering and sales reference material only.
Regulatory applicability varies by jurisdiction, industry, and client use case.
Consult qualified legal and compliance professionals before production deployment
in regulated environments.
```

---

*Last updated: 2026-05-24*
