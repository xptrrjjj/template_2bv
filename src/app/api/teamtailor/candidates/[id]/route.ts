import { NextRequest, NextResponse } from 'next/server';
import { 
  getCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidateApplications,
  CandidatePayload 
} from '../../../../../../lib/integrations/teamtailor';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if requesting applications
    const getApplications = searchParams.get('applications');
    if (getApplications === 'true') {
      const applications = await getCandidateApplications(id);
      return NextResponse.json({
        success: true,
        data: applications,
        count: applications.length
      });
    }
    
    // Handle include parameter
    const include = searchParams.get('include');
    const options = include ? { include: include.split(',') } : undefined;
    
    const candidate = await getCandidate(id, options);
    
    return NextResponse.json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error(`GET /api/teamtailor/candidates/${id} error:`, error);
    
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch candidate',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    
    const updateData: Partial<CandidatePayload> = {};
    if (body.first_name !== undefined) updateData.firstName = body.first_name;
    if (body.last_name !== undefined) updateData.lastName = body.last_name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.pitch !== undefined) updateData.pitch = body.pitch;
    if (body.external_id !== undefined) updateData.externalId = body.external_id;
    if (body.sourced !== undefined) updateData.sourced = body.sourced;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.linkedin_url !== undefined) updateData.linkedinUrl = body.linkedin_url;
    if (body.facebook_url !== undefined) updateData.facebookUrl = body.facebook_url;
    if (body.twitter_url !== undefined) updateData.twitterUrl = body.twitter_url;
    if (body.location_ids !== undefined) updateData.locationIds = body.location_ids;
    
    const candidate = await updateCandidate(id, updateData);
    
    return NextResponse.json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error(`PATCH /api/teamtailor/candidates/${id} error:`, error);
    
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update candidate',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteCandidate(id);
    
    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully'
    });
  } catch (error) {
    console.error(`DELETE /api/teamtailor/candidates/${id} error:`, error);
    
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete candidate',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status }
    );
  }
}