import { describe, it, expect } from 'vitest';
import middleware from '../../middleware';
import { NextRequest } from 'next/server';

describe('Middleware Trader Rewrite', () => {
    it('should rewrite / on trader host to /trader', async () => {
        // Explicitly set Host header to match middleware logic
        const req = new NextRequest('https://trader.slimyai.xyz/', {
            headers: { host: 'trader.slimyai.xyz' }
        });
        const res = await middleware(req);
        expect(res.headers.get('x-middleware-rewrite')).toBe('https://trader.slimyai.xyz/trader');
    });

    it('should NOT doubly rewrite /trader on trader host', async () => {
        const req = new NextRequest('https://trader.slimyai.xyz/trader', {
            headers: { host: 'trader.slimyai.xyz' }
        });
        const res = await middleware(req);
        expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    });
});
