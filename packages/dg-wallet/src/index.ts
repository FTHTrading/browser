/**
 * @unykorn/dg-wallet
 *
 * DG Wallet — dual identity layer for the DG Browser.
 *
 *   Browser shell
 *      │
 *      ├── DGNativeWallet    (BIP-39 in OS keychain, never leaves device)
 *      ├── EIP1193Wallet     (MetaMask / Rabby / OKX / Coinbase, system keystore)
 *      ├── PermissionStore   (per-domain ACL, encrypted-at-rest)
 *      └── presentSignRequest(req) → SignOutcome
 *           (rendered by the shell, never by these adapters)
 */

export { DGNativeWallet } from "./dg_native.js";
export type { DGNativeOptions } from "./dg_native.js";

export { EIP1193Wallet } from "./eip1193_bridge.js";
export type { EIP1193BridgeOptions, EIP1193Provider } from "./eip1193_bridge.js";

export { InMemoryPermissionStore, isAutoApproved } from "./permissions.js";
export type { PermissionStore } from "./permissions.js";

export type {
  Address,
  ChainId,
  DomainPermission,
  Hex,
  KeychainBackend,
  Network,
  SignOutcome,
  SignRejected,
  SignRequest,
  SignResult,
  WalletAccount,
  WalletAdapter,
  WalletKind,
} from "./types.js";
