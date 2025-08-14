import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllClients, 
  createClient, 
  updateClient,
  deleteClient,
  ClientPayload 
} from '../../../../../lib/integrations/teamtailor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build request options from search params
    const options: Record<string, unknown> = {};
    
    // Handle filtering
    const status = searchParams.get('status');
    const name = searchParams.get('name');
    const externalId = searchParams.get('external_id');
    
    if (status || name || externalId) {
      options.filter = {};
      const filter = options.filter as Record<string, unknown>;
      if (status) filter.status = status;
      if (name) filter.name = name;
      if (externalId) filter['external-id'] = externalId;
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

    const clients = await getAllClients(options);
    
    return NextResponse.json({
      success: true,
      data: clients,
      count: clients.length
    });
  } catch (error) {
    console.error('GET /api/teamtailor/clients error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch clients',
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
    if (!body.name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          message: 'Client name is required'
        },
        { status: 400 }
      );
    }
    
    const clientData: ClientPayload = {
      name: body.name,
      ...(body.external_id && { externalId: body.external_id }),
      ...(body.status && { status: body.status }),
      ...(body.description && { description: body.description }),
      ...(body.website && { website: body.website }),
      ...(body.industry && { industry: body.industry }),
      ...(body.size && { size: body.size }),
    };
    
    const client = await createClient(clientData);
    
    return NextResponse.json({
      success: true,
      data: client
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/teamtailor/clients error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create client',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle individual client operations
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          message: 'Client ID is required'
        },
        { status: 400 }
      );
    }
    
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
    console.error('PATCH /api/teamtailor/clients error:', error);
    
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          message: 'Client ID is required'
        },
        { status: 400 }
      );
    }
    
    await deleteClient(id);
    
    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /api/teamtailor/clients error:', error);
    
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