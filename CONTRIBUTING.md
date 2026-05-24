# Contributing to Sovereign Browser

**Thank you for contributing to Sovereign Browser™** — the installable agentic browser platform by FTH Trading / Unykorn Labs.

---

## Before you start

1. Read [docs/01-PRODUCT-CANON.md](./docs/01-PRODUCT-CANON.md) — product naming and scope
2. Read [LEGAL_PROTECTIONS.md](./LEGAL_PROTECTIONS.md) — no secrets in PRs
3. Read [TRADEMARKS.md](./TRADEMARKS.md) — branding rules
4. Review [REQUIREMENTS.md](./REQUIREMENTS.md) for P0/P1 priorities

---

## License

By contributing, you agree that your contributions will be licensed under the [Business Source License 1.1](./LICENSE) unless a separate CLA is executed for FTH Trading commercial work.

Production and white-label use require a [commercial license](./LICENSE#commercial-licensing).

---

## Development setup

```powershell
git clone https://github.com/FTHTrading/browser.git
cd browser

# Extension dev prototype (Chrome MV3 — not the ship path)
# Load packages/extension unpacked in chrome://extensions

# Operator stack (separate repo / OpenClaw workspace)
# OpenClaw gateway: http://127.0.0.1:18789
```

See package READMEs:

- `packages/shell-cef/` — primary M1 engine
- `packages/shell-electron/` — fallback spike
- `packages/extension/` — dev prototype only
- `packages/agent-bridge/` — Browser Use + OpenClaw
- `packages/sidecar-ui/` — React side panel target

---

## Branch & PR workflow

1. Fork or branch from `main`
2. Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
3. One concern per PR — keep diffs focused
4. Fill out [PR template](./.github/PULL_REQUEST_TEMPLATE.md)
5. No secrets, wallet keys, or client tenant material

---

## Security

Report vulnerabilities privately to FTH Trading via enterprise security contact — **do not** open public issues for exploitable findings.

---

## Code style

- Match existing patterns in each package
- TypeScript/React for `sidecar-ui` when implemented
- C++/CMake for CEF shell
- Document non-obvious security gates inline

---

## Extension folder policy

`packages/extension/` is **DEV PROTOTYPE ONLY**. Do not describe it as the product in client-facing copy. Native CEF/Electron shell is the ship path.

---

*Sovereign Browser™ · Unykorn® · Copyright © 2026 FTH Trading*
