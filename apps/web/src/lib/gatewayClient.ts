import WebSocket from 'ws';

// ============================================================================
// Types
// ============================================================================

export interface GatewayMessage {
  id?: string;
  type: 'req' | 'res' | 'event' | 'connect' | 'hello-ok' | 'hello-error';
  role?: 'operator' | 'agent' | 'worker';
  minProtocol?: number;
  maxProtocol?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  name?: string;
  data?: unknown;
  event?: string;
  payload?: Record<string, unknown>;
  ok?: boolean;
  client?: Record<string, unknown>;
  scopes?: string[];
  caps?: string[];
  commands?: string[];
  permissions?: Record<string, boolean>;
  auth?: Record<string, unknown>;
  locale?: string;
  userAgent?: string;
  device?: Record<string, unknown>;
}

export interface GatewayClientOptions {
  url: string;
  token: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

// ============================================================================
// GatewayClient Class
// ============================================================================

export class GatewayClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private reconnectAttempts: number;
  private reconnectDelay: number;
  private pendingRequests: Map<string, { resolve: (value: GatewayMessage) => void; reject: (reason: Error) => void }> = new Map();
  private messageId = 0;
  private connected = false;
  private reconnectCount = 0;

  constructor(options: GatewayClientOptions) {
    this.url = options.url;
    this.token = options.token;
    this.reconnectAttempts = options.reconnectAttempts ?? 5;
    this.reconnectDelay = options.reconnectDelay ?? 3000;
  }

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[Gateway] Connecting to ${this.url}...`);

      this.ws = new WebSocket(this.url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      this.ws.on('open', () => {
        console.log('[Gateway] WebSocket connected');
        this.connected = true;
        this.reconnectCount = 0;
        // Don't send handshake immediately - wait for challenge
        this.handshakePending = true;
        this.handshakeSent = false;
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message: GatewayMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('[Gateway] Failed to parse message:', error);
        }
      });

      this.ws.on('close', (code, reason) => {
        console.log(`[Gateway] Connection closed: ${code} - ${reason}`);
        this.connected = false;
        this.attemptReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('[Gateway] WebSocket error:', error.message);
        if (!this.connected) {
          reject(error);
        }
      });
    });
  }

  private handshakePending = false;
  private handshakeSent = false;
  private handshakeComplete = false;

  private sendHandshake(): void {
    // Only send once per connection
    if (this.handshakeSent) {
      console.log('[Gateway] Handshake already sent, skipping');
      return;
    }
    this.handshakeSent = true;
    // First, send connect request with proper params
    const handshake: GatewayMessage = {
      id: this.generateId(),
      type: 'req',
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'cli',
          version: '1.0.0',
          platform: 'linux',
          mode: 'cli'
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        caps: [],
        commands: [],
        permissions: {},
        auth: { token: this.token },
        locale: 'en-US',
        userAgent: 'openclaw-cli/1.0.0'
      }
    };

    console.log('[Gateway] Sending connect request:', handshake);
    this.send(handshake);
  }

  private handleMessage(message: GatewayMessage): void {
    console.log('[Gateway] Received:', message.type, message.method || message.event || message.id);

    // Handle connect challenge (pre-handshake) - wait for this before sending connect
    if (message.type === 'event' && message.event === 'connect.challenge') {
      console.log('[Gateway] Received challenge, sending connect...');
      this.sendHandshake();
      return;
    }
    
    // If we get a response before sending handshake, it might be an early rejection
    if (!this.handshakeSent && message.type === 'res') {
      console.log('[Gateway] Got response before handshake, ignoring');
      return;
    }

    // Handle handshake response
    if (message.type === 'res' && message.ok === true && message.payload?.type === 'hello-ok') {
      console.log('[Gateway] Handshake successful!');
      this.handshakeComplete = true;
      return;
    }
    
    // Handle hello-error
    if (message.type === 'res' && message.ok === false) {
      console.error('[Gateway] Handshake failed:', message.error || message);
      return;
    }

    // Handle responses to pending requests
    if (message.type === 'res' && message.id && this.pendingRequests.has(message.id)) {
      const { resolve } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);
      resolve(message);
      return;
    }

    // Handle events (notifications)
    if (message.type === 'event') {
      console.log('[Gateway] Event received:', message.name, message.data);
      return;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectCount >= this.reconnectAttempts) {
      console.error('[Gateway] Max reconnection attempts reached');
      return;
    }

    this.reconnectCount++;
    this.handshakeSent = false; // Reset handshake flag
    console.log(`[Gateway] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectCount}/${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[Gateway] Reconnection failed:', error.message);
      });
    }, this.reconnectDelay);
  }

  // --------------------------------------------------------------------------
  // Request/Response
  // --------------------------------------------------------------------------

  async call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.connected || !this.ws) {
      throw new Error('Gateway not connected');
    }
    
    // Wait for handshake to complete
    if (!this.handshakeComplete) {
      console.log('[Gateway] Waiting for handshake to complete...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!this.handshakeComplete) {
        throw new Error('Handshake not complete');
      }
    }

    const id = this.generateId();
    const request: GatewayMessage = {
      id,
      type: 'req',
      method,
      params,
    };

    console.log(`[Gateway] Calling ${method}...`);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${method} (${id}) timed out`));
        }
      }, 30000);

      this.pendingRequests.set(id, {
        resolve: (message: GatewayMessage) => {
          clearTimeout(timeout);
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.result as T);
          }
        },
        reject,
      });

      this.send(request);
    });
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  private send(message: GatewayMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('[Gateway] Cannot send - not connected');
    }
  }

  private generateId(): string {
    return `req-${Date.now()}-${++this.messageId}`;
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isGatewayMessage(obj: unknown): obj is GatewayMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    ['req', 'res', 'event'].includes((obj as GatewayMessage).type)
  );
}
