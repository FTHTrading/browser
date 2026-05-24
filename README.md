# Sovereign Browser

[![Phase](https://img.shields.io/badge/Phase-M1%20Alpha-orange?style=for-the-badge)](docs/08-ROADMAP.md)
[![Engine](https://img.shields.io/badge/Engine-CEF%20Primary-blue?style=for-the-badge)](docs/02-ENGINE-DECISION.md)
[![Search](https://img.shields.io/badge/Search-Corpus--First-green?style=for-the-badge)](docs/03-UX-VISION.md)
[![Agent](https://img.shields.io/badge/Agent-OpenClaw%20%2B%20DONK-purple?style=for-the-badge)](packages/agent-bridge/)

**The installable, white-label agentic browser for creators and Web3 businesses** — SNP namespace identity, OpenClaw multi-agent delegation, x402 pay-per-action, LPS-1 provenance, and DOI research RAG built in. Competes with Chrome, Brave, Arc, and Perplexity Comet on **sovereignty**, not just chat.

**Product home:** [unykorn.ai](https://unykorn.ai) · **Entity:** FTH Trading / Unykorn Labs

---

## Table of contents

### 🟣 Product

| Document | Description |
|----------|-------------|
| [docs/00-TABLE-OF-CONTENTS.md](docs/00-TABLE-OF-CONTENTS.md) | Color-coded full index |
| [docs/01-PRODUCT-CANON.md](docs/01-PRODUCT-CANON.md) | Source of truth — what we ship |
| [BUSINESS_GOALS.md](BUSINESS_GOALS.md) | Revenue tiers, FTH 4-layer stack |
| [REQUIREMENTS.md](REQUIREMENTS.md) | FR / NFR / SEC / CMP requirements |

### 🔵 Engineering

| Document | Package |
|----------|---------|
| [docs/02-ENGINE-DECISION.md](docs/02-ENGINE-DECISION.md) | CEF · Electron · Chromium fork |
| [docs/08-ROADMAP.md](docs/08-ROADMAP.md) | M1–M4 milestones |
| [packages/shell-cef/](packages/shell-cef/) | Primary browser shell |
| [packages/shell-electron/](packages/shell-electron/) | Fallback spike |
| [packages/sidecar-ui/](packages/sidecar-ui/) | React agent side panel |
| [packages/agent-bridge/](packages/agent-bridge/) | OpenClaw + Browser Use |
| [packages/extension/](packages/extension/) | ⚠️ Dev prototype only |

### 🟢 UX & GTM

| Document | Description |
|----------|-------------|
| [docs/03-UX-VISION.md](docs/03-UX-VISION.md) | Three-screen story, private search |
| [docs/04-COMET-BENCHMARK.md](docs/04-COMET-BENCHMARK.md) | Comet competitive benchmark |
| [docs/05-GTM-CLIENT.md](docs/05-GTM-CLIENT.md) | Client tiers, sales motion |

### 🔴 Legal & Security

| Document | Description |
|----------|-------------|
| [TRADEMARKS.md](TRADEMARKS.md) | Sovereign Browser™, Unykorn®, SNP™, LPS-1™, DONK™ |
| [LEGAL_PROTECTIONS.md](LEGAL_PROTECTIONS.md) | IP, SLA framework, export awareness |
| [docs/06-SECURITY.md](docs/06-SECURITY.md) | Approval gates, Zenity lessons |
| [docs/07-COMPLIANCE-CITES.md](docs/07-COMPLIANCE-CITES.md) | Zenodo DOIs, Basel/ISO awareness |
| [LICENSE](LICENSE) | BSL 1.1 + commercial terms |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |

---

## Architecture

```mermaid
flowchart TB
    subgraph Browser["Sovereign Browser (client install)"]
        CEF[CEF / Electron shell]
        OMN[Omnibox + tabs]
        SID[Sidecar UI — DONK]
    end

    subgraph Agent["Agent plane"]
        OC[OpenClaw gateway]
        BU[Browser Use + CDP]
        DONK[DONK mesh]
    end

    subgraph Unykorn["Unykorn control plane"]
        SNP[SNP namespaces]
        X402[x402 paid.unykorn.org]
        LAW[law.unykorn policies]
        CORPUS[Corpus RAG 1831 docs]
    end

    subgraph Trust["Trust layer"]
        LPS[LPS-1 provenance]
        DOI[Zenodo DOIs]
        ATP[Apostle Chain ATP]
    end

    CEF --> OMN
    CEF --> SID
    SID --> OC
    OC --> BU
    OC --> DONK
    OMN --> CORPUS
    OMN --> SNP
    SID --> X402
    X402 --> ATP
    SID --> LPS
    CORPUS --> DOI
    OC --> LAW
```

**Control plane:** ~170 FTHTrading repos · 151 operator sites · OpenClaw agent fleet · Cloudflare edge (hail/law/x402).

**Not the browser:** [storm.unykorn.org](https://storm.unykorn.org) is Storm Ops HUD — operator deck only.

---

## Quick start (developers)

### Prerequisites

- Windows 11 or macOS 14+
- OpenClaw gateway on `http://127.0.0.1:18789` (operator stack)
- Chromium-based browser for extension dev prototype

### 1. Clone

```powershell
git clone https://github.com/FTHTrading/browser.git
cd browser
```

### 2. Extension dev prototype (not ship path)

```powershell
# Verify gateway
curl http://127.0.0.1:18789/health

# Chrome → chrome://extensions → Load unpacked → packages/extension/
```

Edit `packages/extension/config.js` for your local gateway URL.

### 3. Next engineering (M1)

See [docs/08-ROADMAP.md](docs/08-ROADMAP.md) — start **CEF spike** in `packages/shell-cef/`.

---

## Monetization tiers

| Tier | Price | Buyer |
|------|-------|-------|
| **Creator Studio** | $49–149/mo | Authors, creators |
| **Business** | $499–2k/mo | Web3 teams, agencies (white-label) |
| **Enterprise** | Custom | Regulated / air-gapped |

Plus x402 action fees · namespace fees · marketplace rev share. Details: [BUSINESS_GOALS.md](BUSINESS_GOALS.md).

---

## Research citations

| DOI | Subject |
|-----|---------|
| [10.5281/zenodo.18646886](https://doi.org/10.5281/zenodo.18646886) | LPS-1 literary provenance |
| [10.5281/zenodo.18729652](https://doi.org/10.5281/zenodo.18729652) | Genesis Protocol proof index |

Corpus: **2,998 harvested · 1,831 manifest** documents for local RAG.

---

## Repo structure

```
browser/
├── README.md                 # This file
├── LICENSE                   # BSL 1.1
├── TRADEMARKS.md
├── BUSINESS_GOALS.md
├── LEGAL_PROTECTIONS.md
├── REQUIREMENTS.md
├── docs/                     # Canon + engineering docs
├── packages/
│   ├── shell-cef/            # Primary engine (M1)
│   ├── shell-electron/       # Fallback
│   ├── sidecar-ui/           # React side panel
│   ├── agent-bridge/         # OpenClaw + Browser Use
│   └── extension/            # Dev prototype ONLY
└── .github/                  # Issue + PR templates
```

---

## License

Source code: [Business Source License 1.1](LICENSE) — production and white-label require [commercial license](LICENSE#commercial-licensing).

Third-party components (Chromium, CEF, etc.) retain their original licenses.

---

<p align="center">
  <sub>
    Sovereign Browser™ · Unykorn® · DONK™ · SNP™ · LPS-1™<br>
    Copyright © 2026 FTH Trading. Chromium® is a trademark of Google LLC.<br>
    This product is not Google Chrome.
  </sub>
</p>
