# Comet UX Benchmark — Perplexity Agentic Browser (2025–2026)

**Document version:** 1.0  
**Date:** 2026-05-24  
**Purpose:** Competitive UX benchmark for Sovereign Browser  
**Parent:** [01-PRODUCT-CANON.md](./01-PRODUCT-CANON.md)

---

## Executive summary

Perplexity Comet is the **category-defining agentic browser** as of mid-2026: Chromium shell + Perplexity answer engine + right-side **Sidecar** assistant. Unykorn should **steal the layout grammar and agent transparency patterns**, then **beat Comet on sovereignty, security, corpus search, and creator monetization**.

---

## UI anatomy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [◀ ▶ ↻]  │  Smart omnibox (URL + natural language query)     │ ⚡ Assistant │
├──────────┴───────────────────────────────────────────────────┴──────────────┤
│ Tab bar — horizontal; hover = AI preview summary                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  LEFT RAIL (optional)     MAIN VIEWPORT              RIGHT SIDECAR 360px    │
│  History / Discover       Web page OR answer         Chat + step trace      │
├─────────────────────────────────────────────────────────────────────────────┤
│ NEW TAB: centered search + draggable widgets (clock, weather, notes)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**UX implication:** Sidecar independently deployable; browser chrome stays minimal. Sovereign Browser mirrors **browse chrome vs agent WebUI separation** in `packages/sidecar-ui/`.

---

## Steal this (12 patterns)

1. Right Sidecar as primary agent surface
2. Smart omnibox — unified search + navigate + agent command
3. SSE streaming chat + parallel automation channel
4. `@tab` context syntax
5. Step trace UI inline
6. New tab as personal command center
7. Tab hover AI previews
8. Split view for compare workflows
9. Domain blacklist for agent
10. Model picker in panel
11. Explicit approval gate before irreversible actions
12. One-click extension/bookmark import onboarding

---

## Beat this (Unykorn advantages)

| Gap | Sovereign win |
|-----|---------------|
| Cloud-only search | **Local corpus first** (1,831 manifest docs) |
| No namespace | **SNP omnibox** |
| No provenance | **LPS-1 / Donkeys** verify |
| No micropayments | **x402 + ATP receipts** |
| Single-agent cloud | **OpenClaw multi-agent mesh** |
| Closed white-label | **Client-branded installers** |
| Privacy / retention | **Local gateway option** |
| Security afterthought | **Policy-first agent** (law.unykorn) |

---

## Security benchmark — Zenity PleaseFix (2025–2026)

| Attack | Unykorn beat strategy |
|--------|----------------------|
| `file://` exfil via calendar injection | **Never grant agent file://**; vault sandbox |
| 1Password takeover via agent | **Agent never touches password managers** |
| Hidden MCP extensions | **No hidden extensions**; signed manifest |
| Indirect prompt injection | **law.unykorn policy** + approval gates |
| Zero-click autonomy | **Receipt-first UX** — cost + policy + x402 before execute |

**Positioning:** Comet fixed specific paths after Zenity; Sovereign ships **sovereignty-by-design**.

---

## References

- [The Verge — Comet hands-on](https://www.theverge.com/news/709025/perplexity-comet-ai-browser-chrome-competitor)
- [Zenity — PleaseFix / PerplexedBrowser](https://zenity.io/research/pleasefix-vulnerabilities)
- [Zenity — Comet reversing story](https://labs.zenity.io/p/perplexity-comet-a-reversing-story)

---

*Last updated: 2026-05-24*
