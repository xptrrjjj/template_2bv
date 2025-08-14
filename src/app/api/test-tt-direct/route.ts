import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.TEAMTAILOR_API_KEY;
    
    // Test the companies custom field options endpoint directly
    const companiesUrl = 'https://api.teamtailor.com/v1/custom-field-selects/83985/custom-field-options?page[size]=5';
    const locationsUrl = 'https://api.teamtailor.com/v1/locations?page[size]=5';
    
    const headers = {
      'Authorization': `Token token=${apiKey}`,
      'X-Api-Version': '20240404',
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
    };
    
    console.log('Testing direct TeamTailor API calls...');
    console.log('Companies URL:', companiesUrl);
    console.log('Locations URL:', locationsUrl);
    
    // Test both endpoints
    const [companiesResult, locationsResult] = await Promise.allSettled([
      fetch(companiesUrl, { headers }),
      fetch(locationsUrl, { headers })
    ]);
    
    interface DirectTestResponse {
      timestamp: string;
      test_urls: {
        companies: string;
        locations: string;
      };
      companies?: {
        status: string;
        count?: number;
        sample?: unknown[];
        has_next?: boolean;
        http_status?: number;
        error?: string;
      };
      locations?: {
        status: string;
        count?: number;
        sample?: unknown[];
        has_next?: boolean;
        http_status?: number;
        error?: string;
      };
    }
    
    const response: DirectTestResponse = {
      timestamp: new Date().toISOString(),
      test_urls: {
        companies: companiesUrl,
        locations: locationsUrl
      }
    };
    
    // Handle companies response
    if (companiesResult.status === 'fulfilled') {
      const status = companiesResult.value.status;
      console.log('Companies API status:', status);
      
      if (status === 200) {
        const data = await companiesResult.value.json();
        response.companies = {
          status: 'success',
          count: data.data?.length || 0,
          sample: data.data?.slice(0, 3) || [],
          has_next: !!data.links?.next
        };
      } else {
        const errorText = await companiesResult.value.text();
        response.companies = {
          status: 'error',
          http_status: status,
          error: errorText
        };
        console.log('Companies API error:', status, errorText);
      }
    } else {
      response.companies = {
        status: 'error',
        error: companiesResult.reason?.message || 'Fetch failed'
      };
    }
    
    // Handle locations response
    if (locationsResult.status === 'fulfilled') {
      const status = locationsResult.value.status;
      console.log('Locations API status:', status);
      
      if (status === 200) {
        const data = await locationsResult.value.json();
        response.locations = {
          status: 'success',
          count: data.data?.length || 0,
          sample: data.data?.slice(0, 3) || [],
          has_next: !!data.links?.next
        };
      } else {
        const errorText = await locationsResult.value.text();
        response.locations = {
          status: 'error',
          http_status: status,
          error: errorText
        };
        console.log('Locations API error:', status, errorText);
      }
    } else {
      response.locations = {
        status: 'error',
        error: locationsResult.reason?.message || 'Fetch failed'
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Direct test error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}