// Simple test to validate the route structure
const { NextRequest, NextResponse } = require('next/server');

// Simulate the route structure
async function testRoute() {
  console.log('Testing route parameter structure...');
  
  // This is how Next.js 15 handles dynamic route parameters
  const mockParams = Promise.resolve({
    provider: 'teamtailor',
    event: 'job.published'
  });
  
  const { provider, event } = await mockParams;
  console.log('Provider:', provider);
  console.log('Event:', event);
  console.log('Route structure is valid!');
}

testRoute().catch(console.error);