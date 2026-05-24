# Module spec — DG Wallet

**Package:** `packages/dg-wallet`
**Contract version:** 0.1.0 — 2026-05-24
**Status:** locked

The DG Wallet is the only identity layer the rest of the browser talks to. It carries two adapter implementations behind a single `WalletAdapter` interface.

---

## 1. Two adapters, one contract

| Adapter | Stores | Talks to | Used for |
| --- | --- | --- | --- |
| `DGNativeWallet` | BIP-39 seed encrypted in the OS keychain | A Rust signing backend exposed via the shell's IPC channel | The primary DG-branded account. Survives uninstall + reinstall via BIP-39. |
| `EIP1193Wallet` | Nothing — defers to the system wallet (MetaMask, Rabby, OKX) | `window.ethereum` (or its native shim in Chromium) | A user already living in a wallet they trust. We are not asking them to move. |

Both implement `WalletAdapter` from `packages/dg-wallet/src/types.ts`:

```ts
interface WalletAdapter {
  current(): Promise<WalletAccount | null>;
  list(): Promise<WalletAccount[]>;
  select(accountId: string): Promise<WalletAccount>;
  sign(request: SignRequest): Promise<SignOutcome>;
}
```

## 2. Sign-request drawer (the only sign UI)

Every `eth_signTypedData_v4`, `personal_sign`, `eth_sign`, and `eth_sendTransaction` from any tab in the browser raises the DG drawer first, regardless of which adapter signs. The drawer is rendered by the shell — never by the adapter — so the visual contract is identical for native and external accounts.

The drawer shows, in this order:

1. The origin (`https://app.uniswap.org`).
2. The account that will sign, address + label, with a switcher to other accounts.
3. The decoded message or transaction (raw bytes available behind a disclosure triangle).
4. Per-origin permission summary (granted methods, spend cap).
5. Approve / Reject buttons.

Approve calls the adapter's `sign(...)`. Reject resolves the outcome as `{ ok: false, data: { reason: "user_rejected" } }`.

## 3. Permissions

Storage: encrypted SQLite, schema `dg_permissions(origin TEXT PRIMARY KEY, granted_json TEXT, spend_cap_24h REAL, updated_at TEXT)`.

Granted methods are an explicit allow-list per `(origin, method)` tuple. There is no implicit "permanent connection." The user can grant a method until next-prompt, until-revoked, or for the next 24h. Defaults are conservative — first prompt for any unfamiliar `(origin, method)`.

Spend cap: hard limit on `eth_sendTransaction` per origin per 24h, denominated in the network's native coin. Exceeding the cap forces a manual approval even if the method is granted.

Optional D1 mirror: `sha256(permissions.toCanonicalJSON())` posted to `https://api.digitalgiant.xyz/api/wallet/permissions_digest` for cross-device convenience. **Never the ACL itself.**

## 4. Signer wiring (M2)

The TypeScript adapter does **not** hold the seed at any point. The shell:

1. Reads the encrypted seed blob from the OS keychain via the platform API (Keychain Services / DPAPI / libsecret).
2. Hands it to the Rust signing backend over a Unix domain socket dedicated to signing (separate from the agent IPC socket).
3. The Rust backend derives the requested key, signs the request, and returns the signature.
4. The seed never crosses into the V8 heap.

`DGNativeOptions.signer` is the JS-side stub for this dance. M2 wires it to call into the native IPC channel from the React drawer.

## 5. Networks

Initial set, hard-coded in M2:

| Network | Chain id | Default RPC |
| --- | --- | --- |
| Ethereum mainnet | `0x1` | Cloudflare public RPC |
| Polygon | `0x89` | Polygon RPC |
| Base | `0x2105` | Base RPC |

Admin pack can override each RPC + add custom networks. **No RPC traffic goes through DG infrastructure by default.** The user's reads are private to them.

## 6. Acceptance criteria for M2

- Both adapters expose `current()` / `list()` / `select()` / `sign()`.
- A real test page can request `eth_sendTransaction` and see the DG drawer.
- Approving with the DG-native account signs via the Rust backend; the resulting tx hash matches an independent ecrecover.
- Approving with the EIP-1193 adapter delegates to MetaMask and returns its signature unmodified.
- A revoked permission raises the drawer on the next call from that origin.

## 7. Out of scope

- Hardware wallets (Ledger, Trezor) — M5.
- Token transfer UI (send / receive) — M3, depends on the x402 module landing first.
- Token price display — never as a default (it's a privacy leak); admin pack can opt in.
- WalletConnect v2 — M5.
