# Legal Protections & IP Framework

**Document version:** 1.0  
**Date:** 2026-05-24  
**Entity:** FTH Trading / Unykorn Labs  
**Status:** Engineering + procurement guidance — **not legal advice**

---

## Scope

This document describes how Sovereign Browser protects intellectual property, handles compliance awareness, and structures client obligations. **Consult qualified counsel** before first commercial ship, export, or regulated deployment.

---

## Intellectual property

| Asset class | Protection approach |
|-------------|---------------------|
| **Product canon & docs** | Copyright © 2026 FTH Trading; BSL 1.1 on code (see [LICENSE](./LICENSE)) |
| **Trademarks** | See [TRADEMARKS.md](./TRADEMARKS.md) — Sovereign Browser™, Unykorn®, SNP™, LPS-1™, DONK™ |
| **Trade secrets** | Operator stack configs, tenant vault keys, SNP root material, client policy packs — **never in git** |
| **Patents / prior art** | Research corpus includes protocol specs; patent strategy out of scope for this repo — flag in enterprise data room |
| **Client deliverables** | Separate commercial license per tenant; white-label assets under NDA |

---

## Repository security rules

### Never commit

- Private keys, seed phrases, API tokens, `.env` files
- Wallet ledgers, OneDrive-separated credential exports
- Client tenant vault material or SNP root private keys
- Production OpenClaw gateway auth secrets
- Code signing certificates (`.p12`, `.pfx`)

### Required practices

- Pre-commit review for accidental path leaks (`C:/Users/`, `OneDrive`, `wallet`)
- AGPL components (e.g. Skyvern) **excluded from default binary** — optional isolated cloud service only
- All agent capabilities in **signed manifest** — no hidden extensions (Comet/Zenity lesson)
- Audit trail for privileged actions via x402 receipts + OpenClaw logs

---

## Chromium / CEF compliance

| Requirement | Action |
|-------------|--------|
| BSD-3 + LGPL/MPL notices | Ship `about:credits` / `about:license` in every build |
| No Google Chrome branding | `is_chrome_branded=false`; own icons and name |
| Widevine / DRM | Separate Google agreement if needed — not MVP |
| Safe Browsing / Google sync | Disabled or replaced with Unykorn/SNP equivalents |

**Executive summary:** You may build and sell on Chromium/CEF under permissive licenses with your own brand and required OSS notices.

---

## Export control awareness

Browser software embedding cryptography (TLS, wallet signing) may be subject to export regulations (e.g. EAR). Before international distribution:

- Document encryption use in product spec
- Engage counsel for classification and export filing if required
- Enterprise air-gapped builds may have different obligations

---

## Data processing & client SLA framework

| Topic | Framework |
|-------|-----------|
| **Tenant isolation** | Client vault crypto boundaries; no cross-tenant corpus egress |
| **Cloud vs local** | Local OpenClaw gateway default for sensitive tiers; optional tenant relay |
| **Retention** | No default cloud chat retention on client corpus; configurable audit logs |
| **Subprocessors** | Listed in enterprise DPA — Cloudflare Workers, optional LLM providers |
| **Incident response** | 24h notification for Enterprise; severity matrix in client SLA appendix |
| **Availability** | Business: 99.5% control plane; Enterprise: negotiated SLO |

### SLA tiers (indicative)

| Tier | Support | Uptime target |
|------|---------|---------------|
| Creator Studio | Community + email | Best effort |
| Business | Business hours, 48h P1 | 99.5% |
| Enterprise | 24/7 P1, named CSM | 99.9% + air-gap option |

---

## Compliance awareness (not legal advice)

Sovereign Browser integrates **policy routing** via `law.unykorn` with awareness of:

| Framework | Browser relevance |
|-----------|-------------------|
| **Basel III / operational risk** | Audit trails, approval gates, agent action logging |
| **ISO 27001** | Security controls roadmap for Enterprise tier |
| **SOC 2 Type II** | Phase 3 target for control plane |
| **GDPR / CCPA** | Tenant data isolation, deletion workflows, DPA |
| **FinCEN / MSB** | x402/ATP flows — client responsible for money transmission licensing where applicable |

**Disclaimer:** Policy packs assist routing and documentation; they do **not** constitute legal compliance certification.

---

## Agent security posture (sovereignty-by-design)

| Control | Implementation |
|---------|----------------|
| No `file://` agent access | Hard deny; vault sandbox + explicit file picker only |
| No password manager automation | Human-only auth surfaces |
| Approval before privileged actions | Pay, submit, download, sign — x402 quote first |
| Domain policy | `law.unykorn` + user blocklist |
| Indirect prompt injection | Page-trust tiers + compliance agent review |

See [docs/06-SECURITY.md](./docs/06-SECURITY.md).

---

## Research & proof citations

Canonical published research (cite in data room, not as legal opinion):

| DOI | Subject |
|-----|---------|
| [10.5281/zenodo.18646886](https://doi.org/10.5281/zenodo.18646886) | LPS-1 literary provenance standard |
| [10.5281/zenodo.18729652](https://doi.org/10.5281/zenodo.18729652) | Genesis Protocol / deterministic proof index |

**Corpus:** 2,998 harvested documents · 1,831 in manifest (`CORPUS_MANIFEST.json` reference architecture).

**Genesis proof index:** Agent replies citing corpus hits must link DOI + local path where applicable.

---

## Disclaimers

```text
SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.
This repository and its documentation do not constitute legal, financial,
or compliance advice. Regulatory applicability varies by jurisdiction
and client use case. Contact FTH Trading for commercial licensing.
```

---

## Procurement data room checklist

- [ ] LICENSE + commercial terms summary
- [ ] TRADEMARKS.md
- [ ] Third-party notices package (Chromium/CEF/Electron)
- [ ] Tenant vault isolation diagram
- [ ] AGPL exclusion statement
- [ ] Security one-pager (approval gates + x402 receipt sample)
- [ ] SOC2 / ISO roadmap slide (Enterprise)
- [ ] Zenodo DOI references

---

*Last updated: 2026-05-24*
