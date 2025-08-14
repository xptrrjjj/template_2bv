import { NextResponse } from 'next/server';

const COMPANIES_CUSTOM_FIELD_ID = '83985';

// Technology names to filter out from the Client custom field
const TECHNOLOGY_FILTER = [
  'AWS', 'Node.js', 'PostgreSQL', 'React.js', 'TypeScript', 
  'JavaScript', 'Python', 'Java', 'PHP', 'C#', 'Ruby', 'Go',
  'MongoDB', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'Angular',
  'Vue.js', 'Laravel', '.NET', 'Spring', 'Django', 'Flutter'
];

interface TTCompanyOption {
  id: string;
  type: 'custom-field-options';
  attributes: {
    value: string;
  };
}

interface TTLocation {
  id: string;
  type: 'locations';
  attributes: {
    name: string | null;
    city?: string;
    country?: string;
    address?: string;
  };
}

// Simple fetch function for TeamTailor API
async function fetchTeamTailorData<T>(endpoint: string): Promise<T[]> {
  const apiKey = process.env.TEAMTAILOR_API_KEY;
  const headers = {
    'Authorization': `Token token=${apiKey}`,
    'X-Api-Version': '20240404',
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
  };
  
  let allData: T[] = [];
  let nextUrl: string | null = `https://api.teamtailor.com${endpoint}?page[size]=30`;
  
  while (nextUrl) {
    const response: Response = await fetch(nextUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data: { data: T[]; links?: { next?: string } } = await response.json();
    allData = [...allData, ...data.data];
    
    nextUrl = data.links?.next || null;
    
    // Rate limiting delay
    if (nextUrl) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return allData;
}

export async function GET() {
  try {
    console.log('Fetching TeamTailor data only...');
    
    // Fetch TeamTailor data in parallel
    const [ttCompanies, ttLocations] = await Promise.allSettled([
      fetchTeamTailorData<TTCompanyOption>(`/v1/custom-field-selects/${COMPANIES_CUSTOM_FIELD_ID}/custom-field-options`),
      fetchTeamTailorData<TTLocation>('/v1/locations')
    ]);

    // Handle TeamTailor companies
    let ttCompanyOptions: TTCompanyOption[] = [];
    if (ttCompanies.status === 'fulfilled') {
      const allTTOptions = ttCompanies.value;
      // Filter out technology names from the Client custom field
      ttCompanyOptions = allTTOptions.filter(option => 
        !TECHNOLOGY_FILTER.includes(option.attributes.value)
      );
      console.log('TeamTailor companies found:', ttCompanyOptions.length, '(filtered from', allTTOptions.length, 'total)');
    } else {
      console.log('TeamTailor companies error:', ttCompanies.reason);
    }

    // Handle TeamTailor locations
    let ttLocationOptions: TTLocation[] = [];
    if (ttLocations.status === 'fulfilled') {
      ttLocationOptions = ttLocations.value;
      console.log('TeamTailor locations found:', ttLocationOptions.length);
    } else {
      console.log('TeamTailor locations error:', ttLocations.reason);
    }

    // Transform locations for frontend
    const locations = ttLocationOptions.map(loc => ({
      id: loc.id,
      name: loc.attributes.name || loc.attributes.city || 'Unknown Location',
      city: loc.attributes.city,
      country: loc.attributes.country,
      address: loc.attributes.address
    }));

    console.log('TeamTailor-only results:', {
      companies: ttCompanyOptions.length,
      locations: locations.length
    });

    return NextResponse.json({
      companies: ttCompanyOptions,
      locations: locations,
      status: 'success',
      debug: {
        tt_companies: ttCompanyOptions.length,
        tt_companies_filtered_out: (ttCompanies.status === 'fulfilled' ? ttCompanies.value.length : 0) - ttCompanyOptions.length,
        tt_locations: ttLocationOptions.length
      }
    });

  } catch (error) {
    console.error('TeamTailor-only API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch TeamTailor data',
      status: 'error'
    }, { status: 500 });
  }
}