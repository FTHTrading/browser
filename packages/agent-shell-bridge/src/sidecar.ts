/**
 * Sidecar entry point. Run as: `node sidecar.js <socket-path>`
 *
 * The CEF / Chromium shell spawns this Node process at startup with the
 * Unix domain socket path (or Windows named pipe) as argv[2]. The sidecar
 * binds to it and waits for the shell to connect.
 *
 * Lifecycle:
 *   shell                                sidecar
 *     │── spawn(node sidecar.js /tmp/dg.sock) ──→ │
 *     │                                            │ bind & listen
 *     │── connect(/tmp/dg.sock) ───────────────→  │
 *     │── { "method": "hello" } ───────────────→  │
 *     │ ←── HelloResult ───────────────────────── │
 *     │── { "method": "agent.generate", ... } →   │ (forwards to agent-bridge)
 *     │ ←── DGGenerateResult ─────────────────── │
 *     │  ...                                       │
 *     │── close ─────────────────────────────────→│ exits
 *
 * Stays in this package because the protocol IS this package. The
 * implementation of agent.generate / scaffold / validate / persist
 * delegates to @unykorn/agent-bridge (DigitalGiantClient + ModelRouter).
 */

import { createServer, type Server, type Socket } from "node:net";
import { createInterface } from "node:readline";

import {
  DG_RPC_ERRORS,
  type HelloResult,
  type RpcRequest,
  type RpcResponse,
  type SidecarNotification,
  isFunctionName,
} from "./protocol.js";

export interface SidecarOptions {
  /** Unix socket / Windows named pipe path. */
  socketPath: string;
  /** Build version of the sidecar binary. */
  sidecarVersion: string;
  /** Resolved canonical prompt version, passed through from the Worker. */
  canonicalPromptVersion: string;
  /** Optional local runtime config (Ollama URL + model). */
  localRuntime?: { baseUrl: string; model: string };
  /** Dispatcher injected by the host. The sidecar does not import
   *  @unykorn/agent-bridge directly; the host wires it. Keeps this
   *  package leaf-shaped. */
  dispatch: (method: string, params: unknown) => Promise<unknown>;
}

export class Sidecar {
  private server: Server | null = null;
  private readonly opts: SidecarOptions;
  private clients = new Set<Socket>();

  constructor(opts: SidecarOptions) {
    this.opts = opts;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((socket) => this.attachClient(socket));
      this.server.once("error", reject);
      this.server.listen(this.opts.socketPath, () => resolve());
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const c of this.clients) c.destroy();
      this.clients.clear();
      this.server?.close(() => resolve());
    });
  }

  /** Push a server-initiated notification to every connected client. */
  notify(n: SidecarNotification): void {
    const frame = JSON.stringify({ jsonrpc: "2.0", ...n }) + "\n";
    for (const c of this.clients) c.write(frame);
  }

  private attachClient(socket: Socket) {
    this.clients.add(socket);
    socket.setEncoding("utf8");
    const lines = createInterface({ input: socket });
    lines.on("line", async (line) => {
      if (!line.trim()) return;
      let req: RpcRequest | null = null;
      try {
        req = JSON.parse(line) as RpcRequest;
      } catch {
        // JSON parse error — JSON-RPC §5.1.
        socket.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "parse error" },
          } satisfies RpcResponse) + "\n",
        );
        return;
      }
      const response = await this.dispatch(req);
      socket.write(JSON.stringify(response) + "\n");
    });
    socket.on("close", () => this.clients.delete(socket));
  }

  private async dispatch(req: RpcRequest): Promise<RpcResponse> {
    const respond = <R>(result: R): RpcResponse<R> => ({
      jsonrpc: "2.0",
      id: req.id,
      result,
    });
    const failed = (code: number, message: string, data?: unknown): RpcResponse => ({
      jsonrpc: "2.0",
      id: req.id,
      error: { code, message, ...(data === undefined ? {} : { data }) },
    });

    switch (req.method) {
      case "ping":
        return respond({ now: new Date().toISOString() });
      case "hello": {
        const hello: HelloResult = {
          sidecar_version: this.opts.sidecarVersion,
          agent_bridge_version: this.opts.canonicalPromptVersion,
          canonical_prompt_version: this.opts.canonicalPromptVersion,
          local_runtime: this.opts.localRuntime
            ? { configured: true, base_url: this.opts.localRuntime.baseUrl, model: this.opts.localRuntime.model }
            : { configured: false },
        };
        return respond(hello);
      }
      case "agent.generate":
      case "agent.scaffold":
      case "agent.validate":
      case "agent.persist":
      case "connector.gleif":
      case "connector.mrets":
      case "connector.wregis":
      case "connector.verra":
      case "connector.history": {
        try {
          const result = await this.opts.dispatch(req.method, req.params);
          // light validation on agent.* methods.
          if (
            req.method === "agent.generate" &&
            typeof req.params === "object" &&
            req.params !== null &&
            "function" in (req.params as object) &&
            !isFunctionName((req.params as { function: unknown }).function)
          ) {
            return failed(DG_RPC_ERRORS.UNKNOWN_FUNCTION, "unknown function name");
          }
          return respond(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : "dispatch failed";
          return failed(DG_RPC_ERRORS.VALIDATION_FAILED, message);
        }
      }
      default:
        return failed(-32601, `method not found: ${req.method}`);
    }
  }
}
