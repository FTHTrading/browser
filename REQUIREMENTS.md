# Requirements — Sovereign Browser (SR-Level)

**Document version:** 1.0  
**Date:** 2026-05-24  
**Status:** Authoritative product requirements  
**Parent:** [docs/01-PRODUCT-CANON.md](./docs/01-PRODUCT-CANON.md)

---

## Document conventions

| Priority | Meaning |
|----------|---------|
| **P0** | M1 blocker — must ship in Sovereign Shell Alpha (90d) |
| **P1** | M2 target (180d) |
| **P2** | M3+ / Phase 3+ |

| Type | Tag |
|------|-----|
| Functional | `FR-` |
| Non-functional | `NFR-` |
| Security | `SEC-` |
| Compliance | `CMP-` |

---

## Functional requirements

### Browser shell

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-001 | P0 | Standalone installable browser (Windows + macOS) — not extension-only |
| FR-002 | P0 | Tabbed navigation, omnibox, downloads, standard web rendering |
| FR-003 | P0 | Agent side panel (360px) independent of page navigation |
| FR-004 | P0 | CDP port exposed for Browser Use / Playwright automation |
| FR-005 | P1 | New tab = corpus search + money lanes (`unykorn.ai` parity) |
| FR-006 | P1 | SNP omnibox resolution (`snp:`, `*.unykorn`) |
| FR-007 | P2 | Split view, tab hover AI previews |
| FR-008 | P2 | Mobile WebView companion shell |

### Search & knowledge

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-010 | P0 | Corpus search via OpenClaw `research_corpus_query` |
| FR-011 | P0 | Default search order: Corpus → Namespace → Navigate → Web (opt-in) |
| FR-012 | P0 | DOI citation cards on corpus hits (Zenodo links) |
| FR-013 | P1 | Sub-200ms p95 for local corpus queries |
| FR-014 | P1 | `@tab` context syntax in side panel (Comet parity) |
| FR-015 | P2 | Tenant-private RAG slice + public DOI layer |

### Agents

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-020 | P0 | OpenClaw gateway client (`127.0.0.1:18789` local default) |
| FR-021 | P0 | Browser Use sidecar over CDP |
| FR-022 | P0 | Visible step trace during agent runs |
| FR-023 | P1 | Multi-agent mesh (planner / executor / compliance) |
| FR-024 | P1 | Voice delegation via Nerve (push-to-talk) |
| FR-025 | P2 | Creator skill marketplace with namespace publish |

### Identity & payments

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-030 | P1 | SNP namespace badge in chrome |
| FR-031 | P1 | x402 quote before privileged web search / actions |
| FR-032 | P1 | ATP receipt display in-browser after settlement |
| FR-033 | P2 | Wallet connector for Apostle Chain (chain 7332) |

### Creator & provenance

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-040 | P1 | LPS-1 paragraph-level verify on creator workflows |
| FR-041 | P1 | Donkeys library integration (`donkeys.xxxiii.io`) |
| FR-042 | P2 | Publish flow with provenance anchor |

### White-label

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-050 | P2 | Per-tenant branding asset pack (icon, colors, installer name) |
| FR-051 | P2 | CI pipeline for signed MSIX / dmg per tenant |
| FR-052 | P2 | Optional custom SNP root (Enterprise) |

---

## Non-functional requirements

| ID | Priority | Requirement |
|----|----------|-------------|
| NFR-001 | P0 | p95 plan→first agent action < 8s (local gateway) |
| NFR-002 | P0 | Sidecar open → gateway connected < 2s |
| NFR-003 | P0 | Signed installers (code signing before any external pilot) |
| NFR-004 | P0 | Auto-update channel manifest (even if manual updates in alpha) |
| NFR-005 | P1 | Side panel WebUI loads in < 500ms |
| NFR-006 | P1 | Accessibility: WCAG 2.1 AA target for chrome + side panel |
| NFR-007 | P2 | Memory: competitive with Chromium baseline + <15% Sidecar overhead |

---

## Security requirements

| ID | Priority | Requirement |
|----|----------|-------------|
| SEC-001 | P0 | **Approval gate** before pay / submit / download / sign |
| SEC-002 | P0 | **No agent `file://` access** — ever |
| SEC-003 | P0 | Agent **must not** interact with password managers |
| SEC-004 | P0 | No hidden extensions; all capabilities user-disableable |
| SEC-005 | P0 | x402 settlement required for metered privileged actions |
| SEC-006 | P1 | `law.unykorn` policy routing by domain / action type |
| SEC-007 | P1 | User-controlled domain blocklist for agent |
| SEC-008 | P1 | Audit log export for Enterprise tenants |
| SEC-009 | P2 | Pen test before Business tier GA |

---

## Compliance requirements

| ID | Priority | Requirement |
|----|----------|-------------|
| CMP-001 | P0 | Ship Chromium/CEF third-party notices (`about:credits`) |
| CMP-002 | P0 | No secrets in repository or installer defaults |
| CMP-003 | P1 | Tenant vault isolation documented and enforced |
| CMP-004 | P1 | GDPR deletion workflow for tenant data |
| CMP-005 | P2 | SOC 2 roadmap for control plane (Enterprise sales) |
| CMP-006 | P2 | Export control review before international ship |

---

## Protocol integration requirements

| Protocol | Requirement |
|----------|-------------|
| **SNP** | Namespace resolve before navigation; manifest skill lookup |
| **x402** | Quote → approve → settle via `paid.unykorn.org` |
| **LPS-1** | Verify badge on corpus/creator content; DOI [10.5281/zenodo.18646886](https://doi.org/10.5281/zenodo.18646886) |
| **Genesis** | Citation to [10.5281/zenodo.18729652](https://doi.org/10.5281/zenodo.18729652) for simulation proofs |
| **Apostle ATP** | Receipt chain for on-chain/off-chain settlement |
| **OpenClaw** | Gateway health, tool registry, MCP surface |

---

## Explicit non-goals (M1)

- Chrome Web Store extension as shipped product
- `storm.unykorn.org` packaged as the browser
- Cloud-only agent with mandatory chat retention
- Skyvern AGPL in core binary
- Full SNP omnibox (stub OK)
- x402 wallet UI (stub OK)

---

## Acceptance — M1 "Sovereign Shell Alpha"

- [ ] Signed Windows + macOS installer
- [ ] CEF or Electron shell with native side panel
- [ ] OpenClaw + Browser Use wired
- [ ] Approval modal on privileged actions
- [ ] x402 gate on at least one pay action (stub settlement OK)
- [ ] 10 internal workflows complete
- [ ] 0 unapproved payments
- [ ] License/credits page present

---

*Traceability: requirements map to [docs/08-ROADMAP.md](./docs/08-ROADMAP.md) phases.*
