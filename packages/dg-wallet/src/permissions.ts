/**
 * Per-domain permission ledger.
 *
 * Lives in the encrypted-at-rest local store (SQLite on the desktop
 * shell; IndexedDB in the web playground). Signed digests of this
 * ledger MAY be mirrored to the DG Worker for cross-device convenience;
 * the underlying ACL is never shipped raw.
 */

import type { DomainPermission, SignRequest } from "./types.js";

export interface PermissionStore {
  get(origin: string): Promise<DomainPermission | null>;
  set(perm: DomainPermission): Promise<void>;
  list(): Promise<DomainPermission[]>;
  remove(origin: string): Promise<void>;
}

/**
 * Check whether `request` is auto-approvable for `origin`. Returns true
 * only if the origin has been explicitly granted the method AND has not
 * exceeded its 24h spend cap (for tx-sending methods).
 */
export async function isAutoApproved(
  store: PermissionStore,
  request: SignRequest,
  spent24h: number,
): Promise<boolean> {
  const perm = await store.get(request.origin);
  if (!perm) return false;
  if (!perm.granted.includes(request.method)) return false;
  if (request.method === "eth_sendTransaction") {
    if (perm.spend_cap_24h <= 0) return false;
    if (spent24h >= perm.spend_cap_24h) return false;
  }
  return true;
}

/**
 * In-memory implementation. Suitable for tests and the web playground.
 * Desktop uses a SQLite-backed implementation in `packages/shell-cef`.
 */
export class InMemoryPermissionStore implements PermissionStore {
  private readonly inner = new Map<string, DomainPermission>();

  async get(origin: string): Promise<DomainPermission | null> {
    return this.inner.get(origin) ?? null;
  }

  async set(perm: DomainPermission): Promise<void> {
    this.inner.set(perm.origin, perm);
  }

  async list(): Promise<DomainPermission[]> {
    return [...this.inner.values()];
  }

  async remove(origin: string): Promise<void> {
    this.inner.delete(origin);
  }
}
