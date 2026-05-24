# Sovereign Browser — Security Architecture

**Document version:** 1.0  
**Date:** 2026-05-24  
**Status:** Active — sovereignty-by-design  
**Requirements:** [REQUIREMENTS.md](../REQUIREMENTS.md) (SEC-*)

---

## Security principles

1. **Default deny** for privileged actions — approve + x402 before execute
2. **No agent filesystem access** via `file://` — vault sandbox only
3. **No password manager automation** — human-only auth surfaces
4. **Transparent capabilities** — no hidden extensions (Comet/Zenity lesson)
5. **Local-first option** — OpenClaw gateway on LAN; no mandatory cloud exfil
6. **Audit everything** — step trace + x402 receipts + tenant logs

---

## Threat model summary

| Threat | Source | Mitigation |
|--------|--------|------------|
| Indirect prompt injection | Malicious web content | law.unykorn policy + page-trust tiers + compliance agent |
| Zero-click exfil | Calendar/email → agent chain | Approval gates; no autonomous privileged chains |
| `file://` read | Agent navigation | **Hard deny** SEC-002 |
| Credential theft | Agent + password manager | **Hard deny** SEC-003 |
| Hidden MCP/extensions | Supply chain | Signed manifest; user-disableable SEC-004 |
| Cloud data retention | Comet-class architecture | Local gateway default; tenant vault isolation |
| Cross-tenant leak | Multi-tenant platform | Crypto boundaries per client vault |

---

## Privileged action gates

Actions requiring **approval modal + x402 quote** (when metered):

| Action | Gate | Receipt |
|--------|------|---------|
| Web search (agent) | User opt-in + cost display | x402 → ATP |
| Form submit | Approval + policy check | Audit log |
| Download | Approval + domain policy | Audit log |
| Payment / sign | Approval + wallet confirm | ATP receipt |
| SNP publish | Namespace policy | SNP anchor |

**M1 success criterion:** 0 unapproved privileged actions in internal dogfood.

---

## Agent capability manifest

All browser automation capabilities must appear in a **signed, user-visible manifest**:

```json
{
  "capabilities": [
    "cdp.navigate",
    "cdp.read_dom",
    "openclaw.tools.research_corpus_query",
    "x402.quote",
    "x402.settle"
  ],
  "denied": [
    "file.read",
    "file.write",
    "password_manager.autofill",
    "extension.install_silent"
  ]
}
```

Users can disable agent per-site (domain blocklist).

---

## OpenClaw gateway security

| Control | Implementation |
|---------|----------------|
| Bind address | Default `127.0.0.1:18789` — not `0.0.0.0` in dev |
| Auth | Token for tenant relay; mTLS for Enterprise |
| Tool registry | Explicit allowlist; no arbitrary shell |
| AGPL isolation | Skyvern optional cloud-only — not in binary |

---

## Zenity / Comet lessons (2025–2026)

Reference: [04-COMET-BENCHMARK.md](./04-COMET-BENCHMARK.md)

| Comet vulnerability | Sovereign response |
|---------------------|-------------------|
| PerplexedBrowser calendar chain | Never `file://`; explicit file picker for user uploads only |
| 1Password abuse | Agent denylist for extension IDs |
| MCP API hidden extensions | No silent capability updates |
| Cloud chat retention | Local-first; configurable retention per tenant |

---

## Secure development lifecycle

| Phase | Activity |
|-------|----------|
| Design | SEC requirements traceability in PR template |
| Code | Secret scanning; no keys in repo |
| Build | Reproducible builds; signed artifacts |
| Ship | Third-party notices; pen test before Business GA |
| Operate | Incident response SLA for Enterprise |

---

## Reporting

Security vulnerabilities: report privately to FTH Trading — do not open public issues for exploitable findings.

---

*Last updated: 2026-05-24 · Not a penetration test report.*
