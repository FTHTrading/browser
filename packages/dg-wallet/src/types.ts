/**
 * DG Wallet — public type surface.
 *
 * Implementation lives in dg_native.ts (DG-native BIP-39 account) and
 * eip1193_bridge.ts (system wallet via window.ethereum). Both implement
 * the WalletAccount contract below so the rest of the browser does not
 * care which identity layer signed.
 */

export type Address = `0x${string}`;
export type ChainId = `0x${string}`;
export type Hex = `0x${string}`;

export type WalletKind = "dg_native" | "eip1193";

export interface WalletAccount {
  /** Stable id within this wallet kind. For dg_native: derivation index. For eip1193: provider address. */
  id: string;
  kind: WalletKind;
  address: Address;
  /** Optional human label set by the user. */
  label?: string;
  /** Whether this account is currently active (selected for signing). */
  active: boolean;
}

export interface Network {
  chain_id: ChainId;
  name: string;
  rpc_url: string;
  explorer_url?: string;
  /** Symbol of the network's native coin (ETH, MATIC, …). */
  native_symbol: string;
}

export interface SignRequest {
  /** Stable per-request id. */
  id: string;
  /** RFC 3339 timestamp. */
  created_at: string;
  /** Originating page. Never empty. */
  origin: string;
  /** EIP-1193 method that triggered this. */
  method:
    | "personal_sign"
    | "eth_sign"
    | "eth_signTypedData_v4"
    | "eth_sendTransaction";
  /** Raw parameters as the dApp sent them. */
  params: unknown;
  /** Wallet account that will sign if approved. */
  account: WalletAccount;
  /** Network for tx-signing requests. */
  network?: Network;
}

export interface SignResult {
  /** Resulting signature or transaction hash. */
  result: Hex;
  signed_at: string;
}

export interface SignRejected {
  reason: "user_rejected" | "permission_denied" | "no_account" | "network_mismatch";
  message: string;
}

export type SignOutcome = { ok: true; data: SignResult } | { ok: false; data: SignRejected };

export interface DomainPermission {
  origin: string;
  /** EIP-1193 methods this origin is allowed to call without re-prompting. */
  granted: SignRequest["method"][];
  /** Hard cap on spend per 24h, in the network's native coin. 0 = blocked. */
  spend_cap_24h: number;
  /** When this permission was last touched. */
  updated_at: string;
}

export interface KeychainBackend {
  /** Persist a secret under a stable key. */
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
}

/**
 * Contract every wallet (dg_native, eip1193) implements. The browser
 * shell talks to this interface, not the concrete classes.
 */
export interface WalletAdapter {
  readonly kind: WalletKind;
  /** Currently active account, or null if locked / not provisioned. */
  current(): Promise<WalletAccount | null>;
  /** All accounts known to this adapter. */
  list(): Promise<WalletAccount[]>;
  /** Select a different account as active. Returns the new active account. */
  select(accountId: string): Promise<WalletAccount>;
  /** Submit a sign request. The adapter is responsible for raising the
   *  drawer; resolve with the outcome the user chose. */
  sign(request: SignRequest): Promise<SignOutcome>;
}
