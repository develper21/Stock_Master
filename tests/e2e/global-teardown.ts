import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  // Clean up test data, close connections, etc.
  // This runs after all tests have completed
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;
