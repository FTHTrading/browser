# Business Goals — Sovereign Browser Platform

**Document version:** 1.0  
**Date:** 2026-05-24  
**Product:** Sovereign Browser  
**Entity:** FTH Trading / Unykorn Labs

---

## Mission

Ship the **installable, white-label agentic browser** that creators and Web3 businesses own — with namespace identity, provenance, compliance, and pay-per-action built in, not bolted on.

**Product home:** [unykorn.ai](https://unykorn.ai)  
**Canonical repo:** [github.com/FTHTrading/browser](https://github.com/FTHTrading/browser)

---

## FTH 4-layer stack alignment

```mermaid
flowchart TB
    subgraph L1["Layer 1 — Truth"]
        RAMM[RAMM proofs]
        DOI[Zenodo DOI corpus]
        LPS[LPS-1 provenance]
    end

    subgraph L2["Layer 2 — TEV"]
        GEN[Genesis simulations]
        AUD := Protocol standards
    end

    subgraph L3["Layer 3 — Unykorn"]
        SNP[SNP namespaces]
        OC[OpenClaw agents]
        X402[x402 payments]
    end

    subgraph L4["Layer 4 — Revenue"]
        SUB[Subscriptions]
        ACT[Action fees]
        MKT[Marketplace]
    end

    L1 --> L2 --> L3 --> L4
    BR[Sovereign Browser] --> L3
    BR --> L1
    BR --> L4
```

| Layer | Unykorn assets | Browser surface |
|-------|----------------|-----------------|
| **Truth** | RAMM, DOI corpus (1,831 manifest / 2,998 harvest), LPS-1 | Citation cards, provenance badges, corpus-first search |
| **TEV** | Genesis Protocol deterministic sims | Enterprise what-if before autonomous commerce |
| **Unykorn** | SNP, OpenClaw, x402, law.unykorn | Omnibox, side panel, wallet, policy gates |
| **Revenue** | Subscriptions, ATP, marketplace | Tier billing, receipts, skill rev share |

**Control plane:** ~170 FTHTrading repos, OpenClaw agent fleet, Cloudflare edge (hail/law/x402).

---

## Revenue tiers

| Tier | Monthly (indicative) | Buyer | Deliverable |
|------|---------------------|-------|-------------|
| **Creator Studio** | $49–149 | Authors, creators | Branded/co-brand install, namespace, LPS-1, x402 skills |
| **Business** | $499–2k | Web3 teams, agencies | Full white-label installer, dedicated tenant, team agents |
| **Enterprise** | Custom ($5k+) | Regulated / air-gapped | Private build, on-prem gateway, custom SNP root |

### Usage fees (all tiers)

- **x402 platform fee** on privileged actions (pay, submit, sign, download)
- **Namespace registration** / premium SNP paths
- **Marketplace 0–30%** on third-party agent skills

---

## Year 1 revenue targets (conservative)

| Stream | Y1 target | Notes |
|--------|-----------|-------|
| Subscriptions | $120k ARR | 20 Creator + 5 Business |
| x402 fees | $40k | Privileged action volume |
| Namespace / setup | $30k | Enterprise one-time |
| Marketplace | $20k | Skills rev share |
| **Total** | **~$210k ARR** | Requires 3 design partners by day 90 |

---

## White-label SNP namespaces

| Pattern | Example | Tier |
|---------|---------|------|
| Shared root | `creator.unykorn` | Creator Studio |
| Client subdomain | `agency.clientbrand.com` | Business |
| Custom SNP root | `client.root` | Enterprise |

**Revenue:** namespace registration fees + ongoing policy pack updates + installer channel maintenance.

---

## Ideal customer profiles

| Segment | Pain | Sovereign offer |
|---------|------|-----------------|
| Content creators | AI scrapes work; no proof of origin | LPS-1 + Creator Studio + DOI corpus RAG |
| Web3 / NFT projects | Wallet + dapp friction | SNP + x402 native + Apostle receipts |
| Agencies | Clients want "our browser" | White-label build pipeline + rev share |
| Regulated fintech / RWA | Can't use cloud Comet | Enterprise: law.unykorn + air-gapped gateway |
| Research / media | Hallucinated citations | 1,831-doc manifest RAG + mandatory citation cards |

---

## Competitive positioning

| vs | Sovereign win |
|----|---------------|
| Chrome + extensions | Native SNP + x402 + LPS-1 |
| Perplexity Comet | Policy gates + local gateway + no default cloud retention |
| Brave Leo | Multi-agent mesh + creator economy |
| Arc | White-label + tenant vaults |
| Enterprise RPA | Browser-native agents + compliance |

---

## 90-day GTM milestones

| Window | Goal |
|--------|------|
| Week 1–4 | 3–5 design partners (creator, Web3 studio, agency) — Founding client 50% off Y1 |
| Week 5–8 | Demo: omnibox → agent → Zenodo DOI → LPS-1 → x402 receipt |
| Week 9–12 | First agency white-label `creator.clientbrand.com` build; pricing on `systems.unykorn.org` |

---

## Success metrics (platform)

| Metric | M1 (90d) | M2 (180d) |
|--------|----------|-----------|
| Signed installers shipped | Win + Mac alpha | White-label pipeline |
| Design partners closed | 3 | 8 |
| Unapproved privileged actions | 0 | 0 |
| Corpus search p95 | <200ms local | SNP omnibox live |
| ARR run-rate | Pilot contracts | $210k path visible |

---

*See [docs/05-GTM-CLIENT.md](./docs/05-GTM-CLIENT.md) for full sales motion and collateral checklist.*
