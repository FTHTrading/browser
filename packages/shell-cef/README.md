# `shell-cef` — DG Browser native shell (M1)

CEF-based native window. M1 target per
[`docs/CHROMIUM_BUILD_PLAN.md`](../../docs/CHROMIUM_BUILD_PLAN.md).

## Status

| Layer | State |
| --- | --- |
| CMake project | scaffold in place |
| Boots a tabbed CEF window | stub, single window, no tabs UI yet |
| CDP exposed on `:9222` | yes, via command-line switch |
| Branding via `-DDG_BRAND_*` | yes |
| White-label theme load from admin-pack | M4 |
| Wallet IPC | M2 |
| Agent IPC | M2 |
| x402 paywall interception | M3 |

## Prerequisites

- CMake ≥ 3.21
- C++20 compiler (Xcode 15+, MSVC 2022, gcc 13+)
- Python 3 (CEF build scripts depend on it)

## CEF binary distribution

CEF binaries are ~1 GB per platform and **not vendored**. Download from
<https://cef-builds.spotifycdn.com/index.html> and extract:

| Platform | Path |
| --- | --- |
| macOS arm64 | `vendor/cef-macosarm64/` |
| Windows x64 | `vendor/cef-windows64/` |
| Linux x64 | `vendor/cef-linux64/` |

Pin to CEF **146.x LTS** (matches the build that ships in Fedora as
`cef-146.0.11`). Newer than 146 may break; older than 146 is unsupported.

## Build

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release \
  -DDG_BRAND_NAME="Digital Giant Browser" \
  -DDG_BRAND_HOME_URL="https://digitalgiant.xyz/browser/"
cmake --build build --config Release -j
```

The resulting binary lives at `build/dg_browser_shell` (macOS/Linux) or
`build\Release\dg_browser_shell.exe` (Windows). On macOS the build
also produces `dg_browser_shell.app` because CEF requires a real bundle.

## White-label override

```bash
cmake -S . -B build-acme -DCMAKE_BUILD_TYPE=Release \
  -DDG_BRAND_NAME="Acme Browser" \
  -DDG_BRAND_HOME_URL="https://acme.com/browser/"
cmake --build build-acme --config Release -j
```

That's the v1 customer pipeline in three flags. M4 replaces this with
the `admin-pack` runtime bundle so theme changes don't need a rebuild.

## Connect from `packages/agent-bridge`

The shell binds CDP on `localhost:9222`. From a Node process:

```ts
import { DigitalGiantClient } from "@unykorn/agent-bridge";
const dg = new DigitalGiantClient();
// + your own Playwright / browser-use client pointed at :9222
```

## Next milestones

- **M2:** wire `dg_client.cpp::OnBeforeBrowse` to the DG Wallet
  sign-request drawer for `eth_sendTransaction` interception.
- **M2:** spawn the sidecar Node process that runs `agent-bridge` and
  speak to it via Cap'n Proto IPC.
- **M3:** add a `CefResourceRequestHandler` that watches for HTTP 402
  + `x-pay-with-x402` and renders the inline pay overlay.

See [`docs/CHROMIUM_BUILD_PLAN.md`](../../docs/CHROMIUM_BUILD_PLAN.md).
