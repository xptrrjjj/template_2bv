import { NextRequest, NextResponse } from 'next/server';
import { 
  getClient,
  updateClient,
  deleteClient,
  ClientPayload 
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
    
    // Handle include parameter
    const include = searchParams.get('include');
    const options = include ? { include: include.split(',') } : undefined;
    
    const client = await getClient(id, options);
    
    return NextResponse.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error(`GET /api/teamtailor/clients/${id} error:`, error);
    
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch client',
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
    
    const updateData: Partial<ClientPayload> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.external_id !== undefined) updateData.externalId = body.external_id;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.size !== undefined) updateData.size = body.size;
    
    const client = await updateClient(id, updateData);
    
    return NextResponse.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error(`PATCH /api/teamtailor/clients/${id} error:`, error);
    
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update client',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteClient(id);
    
    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error(`DELETE /api/teamtailor/clients/${id} error:`, error);
    
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete client',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status }
    );
  }
}