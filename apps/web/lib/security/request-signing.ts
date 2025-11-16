/**
 * Request Signing for Inter-Service Communication
 *
 * Provides HMAC-SHA256 based request signing to verify authenticity
 * of requests between services
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { AuthenticationError } from '../errors';

/**
 * Request signature configuration
 */
interface SignatureConfig {
  secret: string;
  algorithm: 'sha256' | 'sha512';
  timestampToleranceSeconds: number;
  headerName: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SignatureConfig = {
  secret: process.env.REQUEST_SIGNING_SECRET || 'change-me-in-production',
  algorithm: 'sha256',
  timestampToleranceSeconds: 300, // 5 minutes
  headerName: 'x-signature',
};

/**
 * Request Signing Manager
 */
export class RequestSigner {
  private config: SignatureConfig;

  constructor(config?: Partial<SignatureConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.secret === 'change-me-in-production' && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  WARNING: Using default request signing secret in production!');
    }
  }

  /**
   * Generate HMAC signature for request
   */
  private generateSignature(payload: string, timestamp: number): string {
    const message = `${timestamp}.${payload}`;
    const hmac = createHmac(this.config.algorithm, this.config.secret);
    hmac.update(message);
    return hmac.digest('hex');
  }

  /**
   * Create signature header value
   */
  private createSignatureHeader(signature: string, timestamp: number): string {
    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Parse signature header
   */
  private parseSignatureHeader(header: string): { timestamp: number; signature: string } | null {
    try {
      const parts = header.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const signaturePart = parts.find((p) => p.startsWith('v1='));

      if (!timestampPart || !signaturePart) {
        return null;
      }

      const timestamp = parseInt(timestampPart.split('=')[1], 10);
      const signature = signaturePart.split('=')[1];

      if (isNaN(timestamp) || !signature) {
        return null;
      }

      return { timestamp, signature };
    } catch {
      return null;
    }
  }

  /**
   * Compute request payload for signing
   */
  private async computePayload(request: Request): Promise<string> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname + url.search;

    // For requests with body, include body in payload
    let body = '';
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.clone().text();
      } catch {
        // If body can't be read, leave it empty
      }
    }

    return `${method}:${path}:${body}`;
  }

  /**
   * Sign an outgoing request
   */
  async signRequest(request: Request): Promise<Request> {
    const payload = await this.computePayload(request);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(payload, timestamp);
    const signatureHeader = this.createSignatureHeader(signature, timestamp);

    // Clone request and add signature header
    const headers = new Headers(request.headers);
    headers.set(this.config.headerName, signatureHeader);
    headers.set('x-timestamp', timestamp.toString());

    return new Request(request.url, {
      method: request.method,
      headers,
      body: request.body,
      // @ts-expect-error - duplex is not in the types but is required for streaming
      duplex: 'half',
    });
  }

  /**
   * Verify an incoming request
   */
  async verifyRequest(request: Request): Promise<boolean> {
    const signatureHeader = request.headers.get(this.config.headerName);

    if (!signatureHeader) {
      throw new AuthenticationError('Missing request signature', {
        header: this.config.headerName,
      });
    }

    const parsed = this.parseSignatureHeader(signatureHeader);
    if (!parsed) {
      throw new AuthenticationError('Invalid signature format');
    }

    const { timestamp, signature } = parsed;

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - timestamp);

    if (timeDiff > this.config.timestampToleranceSeconds) {
      throw new AuthenticationError('Request timestamp too old or too far in future', {
        timestamp,
        now,
        diff: timeDiff,
        tolerance: this.config.timestampToleranceSeconds,
      });
    }

    // Compute expected signature
    const payload = await this.computePayload(request);
    const expectedSignature = this.generateSignature(payload, timestamp);

    // Timing-safe comparison to prevent timing attacks
    try {
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length) {
        throw new AuthenticationError('Invalid signature');
      }

      const isValid = timingSafeEqual(signatureBuffer, expectedBuffer);

      if (!isValid) {
        throw new AuthenticationError('Invalid signature');
      }

      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Signature verification failed');
    }
  }

  /**
   * Middleware for automatic request verification
   */
  middleware() {
    return async (request: Request) => {
      await this.verifyRequest(request);
    };
  }
}

// Singleton instance
let requestSignerInstance: RequestSigner | null = null;

/**
 * Get request signer instance
 */
export function getRequestSigner(config?: Partial<SignatureConfig>): RequestSigner {
  if (!requestSignerInstance) {
    requestSignerInstance = new RequestSigner(config);
  }
  return requestSignerInstance;
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withRequestSigning<T extends (request: Request, ...args: unknown[]) => Promise<Response>>(
  handler: T,
  config?: Partial<SignatureConfig>
): T {
  return (async (request: Request, ...args: unknown[]) => {
    const signer = getRequestSigner(config);
    await signer.verifyRequest(request);
    return await handler(request, ...args);
  }) as T;
}

/**
 * Sign an outgoing request
 */
export async function signRequest(
  request: Request,
  config?: Partial<SignatureConfig>
): Promise<Request> {
  const signer = getRequestSigner(config);
  return await signer.signRequest(request);
}

/**
 * Verify an incoming request
 */
export async function verifyRequest(
  request: Request,
  config?: Partial<SignatureConfig>
): Promise<boolean> {
  const signer = getRequestSigner(config);
  return await signer.verifyRequest(request);
}

/**
 * Create signed fetch function for inter-service calls
 */
export function createSignedFetch(config?: Partial<SignatureConfig>) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    const signedRequest = await signRequest(request, config);
    return fetch(signedRequest);
  };
}
