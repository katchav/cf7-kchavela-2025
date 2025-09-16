/**
 * Global teardown for Playwright tests
 */
async function globalTeardown() {
  console.log('Starting global teardown...');
  
  try {
    // Cleanup tasks can go here:
    // - Clean up test data
    // - Reset database state
    // - Clean up temporary files
    // - Close external connections
    
    // Example cleanup tasks:
    // await cleanupTestData();
    // await resetDatabase();
    // await clearTempFiles();
    
    console.log('Global teardown completed successfully');
    
  } catch (error) {
    console.error('ERROR: Global teardown failed:', error);
    // Don't throw error to avoid failing the test run
  }
}

export default globalTeardown;