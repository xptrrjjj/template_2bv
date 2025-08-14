import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllCandidates, 
  createCandidate,
  CandidatePayload 
} from '../../../../../lib/integrations/teamtailor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build request options from search params
    const options: Record<string, unknown> = {};
    
    // Handle filtering
    const email = searchParams.get('email');
    const externalId = searchParams.get('external_id');
    const tag = searchParams.get('tag');
    const sourced = searchParams.get('sourced');
    const connected = searchParams.get('connected');
    
    if (email || externalId || tag || sourced || connected) {
      options.filter = {};
      const filter = options.filter as Record<string, unknown>;
      if (email) filter.email = email;
      if (externalId) filter['external-id'] = externalId;
      if (tag) filter.tag = tag;
      if (sourced) filter.sourced = sourced === 'true';
      if (connected) filter.connected = connected === 'true';
    }
    
    // Handle include
    const include = searchParams.get('include');
    if (include) {
      options.include = include.split(',');
    }
    
    // Handle sorting
    const sort = searchParams.get('sort');
    if (sort) {
      options.sort = sort;
    }
    
    // Handle page size
    const pageSize = searchParams.get('page_size');
    if (pageSize) {
      options.page = { size: parseInt(pageSize, 10) };
    }

    const candidates = await getAllCandidates(options);
    
    return NextResponse.json({
      success: true,
      data: candidates,
      count: candidates.length
    });
  } catch (error) {
    console.error('GET /api/teamtailor/candidates error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch candidates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          message: 'Candidate email is required'
        },
        { status: 400 }
      );
    }
    
    const candidateData: CandidatePayload = {
      email: body.email,
      ...(body.first_name && { firstName: body.first_name }),
      ...(body.last_name && { lastName: body.last_name }),
      ...(body.phone && { phone: body.phone }),
      ...(body.pitch && { pitch: body.pitch }),
      ...(body.external_id && { externalId: body.external_id }),
      ...(body.sourced !== undefined && { sourced: body.sourced }),
      ...(body.tags && { tags: body.tags }),
      ...(body.linkedin_url && { linkedinUrl: body.linkedin_url }),
      ...(body.facebook_url && { facebookUrl: body.facebook_url }),
      ...(body.twitter_url && { twitterUrl: body.twitter_url }),
      ...(body.location_ids && { locationIds: body.location_ids }),
      ...(body.merge !== undefined && { merge: body.merge }),
    };
    
    const candidate = await createCandidate(candidateData as any);
    
    return NextResponse.json({
      success: true,
      data: candidate
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/teamtailor/candidates error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create candidate',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}