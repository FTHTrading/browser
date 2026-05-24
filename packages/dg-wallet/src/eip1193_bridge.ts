/**
 * EIP-1193 bridge adapter.
 *
 * Wraps any installed EIP-1193 provider (MetaMask, Rabby, OKX, Coinbase
 * Wallet) so the DG Browser shell can present a unified Wallet panel.
 *
 * The bridge does NOT proxy the system wallet's UI. We still raise the
 * DG sign-request drawer first (so the user sees a consistent prompt
 * and per-domain permission state) and only forward to the underlying
 * provider after the user confirms.
 */

import type {
  Address,
  SignOutcome,
  SignRequest,
  WalletAccount,
  WalletAdapter,
} from "./types.js";

/**
 * Minimal EIP-1193 provider type. Avoids pulling in a heavy library;
 * matches every wallet in the wild.
 */
export interface EIP1193Provider {
  request<T = unknown>(args: { method: string; params?: unknown[] | object }): Promise<T>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export interface EIP1193BridgeOptions {
  /** Locator for the system provider. Default: () => globalThis.ethereum. */
  locateProvider?: () => EIP1193Provider | undefined;
  /** Drawer presenter, same contract as dg_native. */
  presentSignRequest: (req: SignRequest) => Promise<SignOutcome>;
}

export class EIP1193Wallet implements WalletAdapter {
  readonly kind = "eip1193" as const;
  private readonly presentSignRequest: EIP1193BridgeOptions["presentSignRequest"];
  private readonly locate: () => EIP1193Provider | undefined;
  private activeAddress: Address | null = null;

  constructor(opts: EIP1193BridgeOptions) {
    this.presentSignRequest = opts.presentSignRequest;
    this.locate = opts.locateProvider ?? (() => (globalThis as unknown as { ethereum?: EIP1193Provider }).ethereum);
  }

  private provider(): EIP1193Provider {
    const p = this.locate();
    if (!p) {
      throw new Error(
        "EIP1193Wallet: no provider found. Install MetaMask, Rabby, or any " +
          "EIP-1193-compatible wallet, or use the DG-native account instead.",
      );
    }
    return p;
  }

  async current(): Promise<WalletAccount | null> {
    if (this.activeAddress) {
      return {
        id: this.activeAddress,
        kind: "eip1193",
        address: this.activeAddress,
        active: true,
      };
    }
    const list = await this.list();
    return list[0] ?? null;
  }

  async list(): Promise<WalletAccount[]> {
    let accounts: Address[];
    try {
      accounts = await this.provider().request<Address[]>({ method: "eth_accounts" });
    } catch {
      accounts = [];
    }
    if (accounts.length === 0) return [];
    if (!this.activeAddress) this.activeAddress = accounts[0]!;
    return accounts.map((addr, i) => ({
      id: addr,
      kind: "eip1193" as const,
      address: addr,
      label: i === 0 ? "External wallet" : `External wallet ${i + 1}`,
      active: addr === this.activeAddress,
    }));
  }

  async select(accountId: string): Promise<WalletAccount> {
    const list = await this.list();
    const next = list.find((a) => a.id === accountId);
    if (!next) throw new Error(`EIP1193Wallet: unknown account ${accountId}`);
    this.activeAddress = next.address;
    return { ...next, active: true };
  }

  /**
   * Trigger the DG drawer; if approved, forward to the underlying
   * provider's request() so the system wallet (MetaMask, etc.) does
   * the actual signing. We never see the user's key material.
   */
  async sign(request: SignRequest): Promise<SignOutcome> {
    const outcome = await this.presentSignRequest(request);
    if (!outcome.ok) return outcome;
    try {
      const result = await this.provider().request<`0x${string}`>({
        method: request.method,
        params: request.params as unknown[],
      });
      return {
        ok: true,
        data: { result, signed_at: new Date().toISOString() },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "signature failed";
      return { ok: false, data: { reason: "user_rejected", message } };
    }
  }

  /**
   * Request the wallet to expose at least one account (the "Connect"
   * affordance). Idempotent — repeat calls return the existing list.
   */
  async connect(): Promise<WalletAccount[]> {
    try {
      const accounts = await this.provider().request<Address[]>({ method: "eth_requestAccounts" });
      if (accounts.length > 0) this.activeAddress = accounts[0]!;
    } catch {}
    return this.list();
  }
}
