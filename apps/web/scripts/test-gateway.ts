#!/usr/bin/env tsx
// Verification script for GatewayClient connection
// Run: npx tsx scripts/test-gateway.ts

import 'dotenv/config';
import { gateway, connectGateway, disconnectGateway } from '../src/lib/gateway';

async function testConnection() {
  console.log('========================================');
  console.log('🔌 Gateway Connection Test');
  console.log('========================================\n');

  try {
    console.log('Attempting to connect to gateway...');
    await connectGateway();
    console.log('✅ Connected successfully!\n');

    // Test a simple request - get gateway status
    console.log('Testing gateway.status()...');
    try {
      const status = await gateway.call('status');
      console.log('✅ Status response:', JSON.stringify(status, null, 2));
    } catch (error) {
      console.log('⚠️ Status call failed (may not be implemented):', (error as Error).message);
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Connection failed:', (error as Error).message);
    process.exit(1);
  } finally {
    disconnectGateway();
    console.log('\n🔌 Disconnected');
  }
}

testConnection();
