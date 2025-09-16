import { chromium } from '@playwright/test';

/**
 * Global setup for Playwright tests
 */
async function globalSetup() {
  console.log('Starting global setup...');
  
  // Create browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for frontend to be ready
    console.log('Waiting for frontend server...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    console.log('Frontend server is ready');
    
    // Wait for backend to be ready
    console.log('Waiting for backend server...');
    const backendResponse = await page.request.get('http://localhost:5001/api/health', {
      timeout: 60000
    });
    
    if (backendResponse.ok()) {
      console.log('Backend server is ready');
    } else {
      throw new Error(`Backend health check failed: ${backendResponse.status()}`);
    }
    
    // Optional: Seed test data or verify database state
    console.log('Verifying test data...');
    
    // You can add additional setup here like:
    // - Database seeding
    // - Test data cleanup
    // - Environment verification
    
    console.log('Global setup completed successfully');
    
  } catch (error) {
    console.error('ERROR: Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;