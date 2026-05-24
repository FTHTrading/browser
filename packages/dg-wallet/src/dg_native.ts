/**
 * DG-native wallet adapter.
 *
 * - BIP-39 seed generated client-side. Encrypted at rest in the OS
 *   keychain (macOS Keychain / Windows DPAPI / Linux libsecret) via the
 *   injected KeychainBackend.
 * - Seed NEVER leaves the device. Not synced. Not mirrored. Not in D1.
 * - Only signed permission digests (sha256 hashes of the per-domain ACL)
 *   are optionally mirrored to the DG Worker for multi-device convenience.
 *
 * This file is the TypeScript contract + glue code. The actual BIP-39
 * derivation and secp256k1 signing are done by a Rust signing backend
 * (compiled to a node addon or WASM) so the seed never sits in JS heap
 * longer than necessary. Wire the backend during M2.
 */

import type {
  Address,
  KeychainBackend,
  SignOutcome,
  SignRequest,
  WalletAccount,
  WalletAdapter,
} from "./types.js";

export interface DGNativeOptions {
  keychain: KeychainBackend;
  /** Storage key inside the keychain. Default: 'dg.wallet.seed'. */
  keychainKey?: string;
  /**
   * Sign-drawer presenter injected by the shell. Shows the request to
   * the user; resolves with the user's choice. The adapter does NOT
   * render UI itself.
   */
  presentSignRequest: (req: SignRequest) => Promise<SignOutcome>;
  /**
   * Hook into the Rust signing backend. Must be wired in M2. The default
   * implementation throws so we cannot accidentally ship without it.
   */
  signer?: {
    derive(seed: string, index: number): Promise<Address>;
    sign(seed: string, index: number, request: SignRequest): Promise<`0x${string}`>;
  };
}

export class DGNativeWallet implements WalletAdapter {
  readonly kind = "dg_native" as const;
  private readonly keychain: KeychainBackend;
  private readonly keychainKey: string;
  private readonly presentSignRequest: DGNativeOptions["presentSignRequest"];
  private readonly signer: DGNativeOptions["signer"] | undefined;

  // Cached account list. The cache holds addresses only — never the seed.
  private accountsCache: WalletAccount[] | null = null;
  private activeId: string | null = null;

  constructor(opts: DGNativeOptions) {
    this.keychain = opts.keychain;
    this.keychainKey = opts.keychainKey ?? "dg.wallet.seed";
    this.presentSignRequest = opts.presentSignRequest;
    this.signer = opts.signer;
  }

  async current(): Promise<WalletAccount | null> {
    const list = await this.list();
    return list.find((a) => a.id === this.activeId) ?? list[0] ?? null;
  }

  async list(): Promise<WalletAccount[]> {
    if (this.accountsCache) return this.accountsCache;
    const seed = await this.keychain.get(this.keychainKey);
    if (!seed) {
      this.accountsCache = [];
      return this.accountsCache;
    }
    if (!this.signer) {
      throw new Error(
        "DGNativeWallet: no signer wired. Pass { signer: { derive, sign } } " +
          "from the Rust backend during shell init. See WALLET_MODULE.md §4.",
      );
    }
    // M2: derive the first 5 accounts (m/44'/60'/0'/0/0..4) lazily.
    const addresses = await Promise.all([0, 1, 2, 3, 4].map((i) => this.signer!.derive(seed, i)));
    this.accountsCache = addresses.map((addr, i) => ({
      id: String(i),
      kind: "dg_native" as const,
      address: addr,
      label: i === 0 ? "Account 1" : `Account ${i + 1}`,
      active: i === 0,
    }));
    this.activeId = "0";
    return this.accountsCache;
  }

  async select(accountId: string): Promise<WalletAccount> {
    const list = await this.list();
    const next = list.find((a) => a.id === accountId);
    if (!next) throw new Error(`DGNativeWallet: unknown account ${accountId}`);
    this.activeId = accountId;
    // Bust the cache so the next list() reports active flags correctly.
    this.accountsCache = list.map((a) => ({ ...a, active: a.id === accountId }));
    return { ...next, active: true };
  }

  async sign(request: SignRequest): Promise<SignOutcome> {
    // 1. Show the user the request via the shell's drawer.
    const outcome = await this.presentSignRequest(request);
    if (!outcome.ok) return outcome;

    // 2. The drawer's promise resolves with the signature it produced. The
    //    drawer is responsible for calling into the Rust signer via the
    //    native IPC channel, so the JS heap never sees the seed. We trust
    //    the outcome the drawer returned; no extra signing here.
    return outcome;
  }
}
