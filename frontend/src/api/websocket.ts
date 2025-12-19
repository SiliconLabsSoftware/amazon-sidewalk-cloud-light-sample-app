const WSS_URL = import.meta.env.VITE_WSS_URL as string;

/* Types */

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export interface WebSocketMessage {
  [key: string]: unknown;
}

export type MessageHandler = (message: WebSocketMessage) => void;
export type StateChangeHandler = (state: ConnectionState) => void;
export type ErrorHandler = (error: Event | Error) => void;

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
      url.searchParams.set("authorization", this.password);
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState("disconnected");
  }

  /**
   * Send a message to the server
   */
  send(message: WebSocketMessage): void {
    if (!this.ws || this.state !== "connected") {
      throw new Error("WebSocket is not connected");
    }
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
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
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

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      setTimeout(() => this.connect(), delay);
    } else {
      this.setState("disconnected");
    }
  }
}

/**
 * Create a WebSocket API instance
 */
export function createWebSocketApi(password: string): WebSocketApi {
  return new WebSocketApi(password);
}
