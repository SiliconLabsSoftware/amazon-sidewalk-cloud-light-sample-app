/***************************************************************************//**
 * @file
 * @brief WebSocket client with auth, reconnect, keepalive, and message handlers.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: LicenseRef-MSLA
 *
 * The licensor of this software is Silicon Laboratories Inc. Your use of this
 * software is governed by the terms of the Silicon Labs Master Software License
 * Agreement (MSLA) available at
 * www.silabs.com/about-us/legal/master-software-license-agreement
 * By installing, copying or otherwise using this software, you agree to the
 * terms of the MSLA.
 *
 ******************************************************************************/
import type { WsKeepaliveMessage, WsMessage } from "./apiTypes";

const WSS_URL = import.meta.env.VITE_WSS_URL as string;

// API Gateway WebSocket idle timeout is 10 min, keepalive before that
const KEEPALIVE_INTERVAL_MS = 9 * 60 * 1000;
// After this long without a user-initiated send, stop pinging and let the
// connection drop so abandoned tabs don't hold a socket open forever
const MAX_INACTIVITY_MS = 24 * 60 * 60 * 1000;

/* Types */

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
type MessageHandler = (message: WsMessage) => void;
type StateChangeHandler = (state: ConnectionState) => void;
type ErrorHandler = (error: Event | Error) => void;

/* WebSocket API Class */

export class WebSocketApi {
  private password: string;
  private ws: WebSocket | null = null;
  private state: ConnectionState = "disconnected";
  private messageHandlers: Set<MessageHandler> = new Set();
  private stateChangeHandlers: Set<StateChangeHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private keepaliveTimer: ReturnType<typeof setTimeout> | undefined;
  private lastActivityAt = 0;

  constructor(password: string) {
    this.password = password;
  }

  /**
   * Get the current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws && (this.state === "connecting" || this.state === "connected")) {
      return;
    }

    this.setState("connecting");

    try {
      const url = new URL(WSS_URL);
      url.searchParams.set("authorization", `Bearer ${this.password}`);
      this.ws = new WebSocket(url.toString());

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      this.setState("error");
      this.notifyError(error instanceof Error ? error : new Error("Connection failed"));
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    this.stopKeepalive();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState("disconnected");
  }

  /**
   * Send a message to the server
   */
  send(message: WsMessage): void {
    if (!this.ws || this.state !== "connected") {
      throw new Error("WebSocket is not connected");
    }
    this.lastActivityAt = Date.now();
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Subscribe to incoming messages
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  /**
   * Subscribe to errors
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.stateChangeHandlers.forEach((handler) => handler(state));
  }

  private notifyError(error: Event | Error): void {
    this.errorHandlers.forEach((handler) => handler(error));
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.setState("connected");
    this.startKeepalive();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WsMessage;
      this.messageHandlers.forEach((handler) => handler(message));
    } catch {
      console.error("Failed to parse WebSocket message:", event.data);
    }
  }

  private handleError(event: Event): void {
    this.setState("error");
    this.notifyError(event);
  }

  private handleClose(): void {
    this.ws = null;
    this.stopKeepalive();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => this.connect(), delay);
    } else {
      this.setState("disconnected");
    }
  }

  private startKeepalive(): void {
    this.stopKeepalive();
    this.lastActivityAt = Date.now();
    this.keepaliveTimer = setTimeout(this.sendKeepalive, KEEPALIVE_INTERVAL_MS);
  }

  private stopKeepalive(): void {
    if (this.keepaliveTimer !== undefined) {
      clearTimeout(this.keepaliveTimer);
      this.keepaliveTimer = undefined;
    }
  }

  private sendKeepalive = (): void => {
    if (!this.ws || this.state !== "connected") {
      return;
    }
    // Abandoned-tab guard: close the connection (and suppress reconnect) if
    // the user hasn't done anything in a long time, so we don't hold a socket
    // open forever. Calling connect() again will revive it.
    if (Date.now() - this.lastActivityAt > MAX_INACTIVITY_MS) {
      this.disconnect();
      return;
    }
    try {
      const message: WsKeepaliveMessage = {
        type: "keepalive",
        at: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("WebSocket keepalive send failed:", error);
    }
    this.keepaliveTimer = setTimeout(this.sendKeepalive, KEEPALIVE_INTERVAL_MS);
  };
}

/**
 * Create a WebSocket API instance
 */
export function createWebSocketApi(password: string): WebSocketApi {
  return new WebSocketApi(password);
}
