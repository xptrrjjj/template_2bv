import { NextResponse } from 'next/server';
import { fetchAllLocations, fetchAllCustomFields } from '@/app/actions/teamtailor';

// Test endpoint to verify TeamTailor API connectivity
export async function GET() {
  try {
    console.log('Testing basic TeamTailor API connectivity...');
    
    // Test both custom fields and locations
    const [customFieldsResult, locationsResult] = await Promise.allSettled([
      fetchAllCustomFields(),
      fetchAllLocations()
    ]);
    
    interface TestResponse {
      teamtailor_test: {
        timestamp: string;
      };
      custom_fields?: {
        status: string;
        count?: number;
        sample?: unknown[];
        error?: string;
      };
      locations?: {
        status: string;
        count?: number;
        sample?: unknown[];
        error?: string;
      };
    }
    
    const response: TestResponse = {
      teamtailor_test: {
        timestamp: new Date().toISOString()
      }
    };
    
    // Test custom fields
    if (customFieldsResult.status === 'fulfilled') {
      response.custom_fields = {
        status: 'success',
        count: customFieldsResult.value.length,
        sample: customFieldsResult.value.slice(0, 5).map((cf: { id: string; name: string; fieldType: string; resourceType: string }) => ({
          id: cf.id,
          name: cf.name,
          fieldType: cf.fieldType,
          resourceType: cf.resourceType
        }))
      };
      console.log('Custom fields found:', customFieldsResult.value.length);
    } else {
      response.custom_fields = {
        status: 'error',
        error: customFieldsResult.reason?.message || 'Unknown error'
      };
      console.log('Custom fields error:', customFieldsResult.reason);
    }
    
    // Test locations
    if (locationsResult.status === 'fulfilled') {
      response.locations = {
        status: 'success',
        count: locationsResult.value.length,
        sample: locationsResult.value.slice(0, 5).map((loc: { id: string; name: string; city?: string; country?: string }) => ({
          id: loc.id,
          name: loc.name,
          city: loc.city,
          country: loc.country
        }))
      };
      console.log('Locations found:', locationsResult.value.length);
    } else {
      response.locations = {
        status: 'error',
        error: locationsResult.reason?.message || 'Unknown error'
      };
      console.log('Locations error:', locationsResult.reason);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}