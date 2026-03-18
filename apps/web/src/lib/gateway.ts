import { GatewayClient } from './gatewayClient';

// ============================================================================
// Environment Configuration
// ============================================================================

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18790';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

// ============================================================================
// Singleton Instance
// ============================================================================

export const gateway = new GatewayClient({
  url: GATEWAY_URL,
  token: GATEWAY_TOKEN,
  reconnectAttempts: 5,
  reconnectDelay: 3000,
});

// ============================================================================
// Convenience Methods
// ============================================================================

export async function connectGateway(): Promise<void> {
  if (!GATEWAY_TOKEN) {
    throw new Error('OPENCLAW_GATEWAY_TOKEN is not set');
  }
  await gateway.connect();
}

export function disconnectGateway(): void {
  gateway.disconnect();
}

export function isGatewayConnected(): boolean {
  return gateway.isConnected();
}

// ============================================================================
// Export Types
// ============================================================================

export { GatewayClient } from './gatewayClient';
export type { GatewayMessage, GatewayClientOptions } from './gatewayClient';
