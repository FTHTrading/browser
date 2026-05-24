/**
 * @unykorn/agent-shell-bridge
 *
 * Wire protocol + Node sidecar implementation for the IPC channel
 * between the native DG Browser shell (CEF / Chromium) and the
 * sandboxed agent runtime (@unykorn/agent-bridge).
 */

export * from "./protocol.js";
export { Sidecar } from "./sidecar.js";
export type { SidecarOptions } from "./sidecar.js";
