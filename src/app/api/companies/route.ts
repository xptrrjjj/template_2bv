import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchCustomFieldOptionsByFieldId,
  fetchAllLocations,
  fetchAllCustomFieldOptions
} from '@/app/actions/teamtailor';
import { apiClient } from '@/services/api';

const COMPANIES_CUSTOM_FIELD_ID = '83985';
const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_IDENTIFIER || 'antd_recruiter';
const RECORD_TYPE = 'companies';

// GET /api/companies - Fetch merged company data
export async function GET() {
  try {
    // First, let's test if we can get any custom field options at all
    console.log('Testing TeamTailor API with custom field ID:', COMPANIES_CUSTOM_FIELD_ID);
    
    // Fetch data from both sources in parallel
    const [datastoreResponse, ttCompanies, ttLocations, allCustomFieldOptions] = await Promise.allSettled([
      apiClient.getRecords(APP_IDENTIFIER, { app_id: RECORD_TYPE }),
      fetchCustomFieldOptionsByFieldId(COMPANIES_CUSTOM_FIELD_ID),
      fetchAllLocations(),
      fetchAllCustomFieldOptions() // Test getting all options
    ]);
    
    // Log the all custom field options result
    if (allCustomFieldOptions.status === 'fulfilled') {
      console.log('All custom field options found:', allCustomFieldOptions.value.length);
      console.log('Sample options:', allCustomFieldOptions.value.slice(0, 3));
    } else {
      console.log('All custom field options error:', allCustomFieldOptions.reason);
    }

    // Handle datastore results
    let datastoreCompanies: Record<string, unknown>[] = [];
    if (datastoreResponse.status === 'fulfilled' && datastoreResponse.value.status === 'success') {
      datastoreCompanies = (datastoreResponse.value.data as Record<string, unknown>[]) || [];
      console.log('Datastore companies found:', datastoreCompanies.length);
    } else {
      console.log('Datastore error:', datastoreResponse.status === 'fulfilled' ? datastoreResponse.value : datastoreResponse.reason);
    }

    // Handle TeamTailor company options results
    let ttCompanyOptions: unknown[] = [];
    if (ttCompanies.status === 'fulfilled') {
      ttCompanyOptions = ttCompanies.value as unknown[];
      console.log('TeamTailor company options found:', ttCompanyOptions.length);
    } else {
      console.log('TeamTailor company options error:', ttCompanies.reason);
    }

    // Handle TeamTailor locations results
    let ttLocationOptions: unknown[] = [];
    if (ttLocations.status === 'fulfilled') {
      ttLocationOptions = ttLocations.value as unknown[];
      console.log('TeamTailor locations found:', ttLocationOptions.length);
    } else {
      console.log('TeamTailor locations error:', ttLocations.reason);
    }

    // Merge the data
    const merged = [];
    
    // Create lookup maps
    const datastoreMap = new Map<string, Record<string, unknown>>();
    datastoreCompanies.forEach((c) => {
      datastoreMap.set(c.teamtailor_option_id as string, c);
    });
    
    const ttMap = new Map<string, unknown>();
    ttCompanyOptions.forEach((tt) => {
      const ttRecord = tt as Record<string, unknown>;
      ttMap.set(ttRecord.id as string, tt);
    });

    // 1. Process datastore records (guaranteed TT mapping)
    for (const dsRecord of datastoreCompanies) {
      const ttRecord = ttMap.get(dsRecord.teamtailor_option_id as string) as Record<string, unknown> | undefined;
      merged.push({
        ...dsRecord,
        company_name: (ttRecord?.value as string) || (dsRecord.teamtailor_option_id as string) || '[MISSING IN TT]',
        sync_status: 'synced',
        tt_created_at: ttRecord?.createdAt as string,
        tt_updated_at: ttRecord?.updatedAt as string
      });
    }
    
    // 2. Process orphaned TT records (missing in datastore)
    for (const [ttId, ttRecord] of ttMap) {
      if (!datastoreMap.has(ttId)) {
        const ttRecordObj = ttRecord as Record<string, unknown>;
        merged.push({
          company_id: '', // No datastore record
          teamtailor_option_id: ttId,
          company_name: ttRecordObj.value as string,
          industry: '',
          contact_name: '',
          source: '',
          teamtailor_location_id: '',
          location_name: '',
          sync_status: 'missing',
          created_at: '',
          updated_at: '',
          tt_created_at: ttRecordObj.createdAt as string,
          tt_updated_at: ttRecordObj.updatedAt as string
        });
      }
    }
    
    // Sort by company name
    merged.sort((a, b) => (a.company_name as string).localeCompare(b.company_name as string));

    return NextResponse.json({
      companies: merged,
      locations: ttLocationOptions,
      status: 'success'
    });

  } catch (error) {
    console.error('Error in companies API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch companies',
      status: 'error'
    }, { status: 500 });
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.company_name || !body.industry || !body.contact_name || !body.source || !body.teamtailor_location_id) {
      return NextResponse.json({
        error: 'Missing required fields',
        status: 'error'
      }, { status: 400 });
    }

    // This would be implemented with the actual server actions
    // For now, return a success response
    return NextResponse.json({
      message: 'Company creation endpoint ready',
      status: 'success'
    });

  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create company',
      status: 'error'
    }, { status: 500 });
  }
}