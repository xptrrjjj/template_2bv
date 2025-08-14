import { NextRequest, NextResponse } from 'next/server';
import { 
  getCustomField,
  updateCustomField,
  deleteCustomField,
  validateCustomFieldValue,
  CustomFieldPayload 
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
    
    const customField = await getCustomField(id, options);
    
    return NextResponse.json({
      success: true,
      data: customField
    });
  } catch (error) {
    console.error(`GET /api/teamtailor/custom-fields/${id} error:`, error);
    
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch custom field',
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
    
    const updateData: Partial<CustomFieldPayload> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.field_type !== undefined) updateData.fieldType = body.field_type;
    if (body.api_key !== undefined) updateData.apiKey = body.api_key;
    if (body.resource_type !== undefined) updateData.resourceType = body.resource_type;
    if (body.required !== undefined) updateData.required = body.required;
    if (body.options !== undefined) updateData.options = body.options;
    if (body.description !== undefined) updateData.description = body.description;
    
    // Validate field type if provided
    if (body.field_type) {
      const validFieldTypes = ['text', 'textarea', 'number', 'date', 'boolean', 'select', 'multiselect'];
      if (!validFieldTypes.includes(body.field_type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation error',
            message: `Invalid field_type. Must be one of: ${validFieldTypes.join(', ')}`
          },
          { status: 400 }
        );
      }
    }
    
    // Validate resource type if provided
    if (body.resource_type) {
      const validResourceTypes = ['candidates', 'jobs', 'users'];
      if (!validResourceTypes.includes(body.resource_type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation error',
            message: `Invalid resource_type. Must be one of: ${validResourceTypes.join(', ')}`
          },
          { status: 400 }
        );
      }
    }
    
    const customField = await updateCustomField(id, updateData);
    
    return NextResponse.json({
      success: true,
      data: customField
    });
  } catch (error) {
    console.error(`PATCH /api/teamtailor/custom-fields/${id} error:`, error);
    
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update custom field',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteCustomField(id);
    
    return NextResponse.json({
      success: true,
      message: 'Custom field deleted successfully'
    });
  } catch (error) {
    console.error(`DELETE /api/teamtailor/custom-fields/${id} error:`, error);
    
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete custom field',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status }
    );
  }
}

// Special POST endpoint for validation
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    
    // This endpoint is for validating field values
    if (body.action === 'validate') {
      if (body.value === undefined) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation error',
            message: 'Value is required for validation'
          },
          { status: 400 }
        );
      }
      
      // Get the custom field first
      const customField = await getCustomField(id);
      
      if (!customField) {
        return NextResponse.json({
          success: false,
          error: 'Custom field not found'
        }, { status: 404 });
      }
      
      // Validate the value
      const validation = await validateCustomFieldValue(id, body.value);
      
      return NextResponse.json({
        success: true,
        data: {
          valid: validation.valid,
          error: validation.error,
          field: customField,
          value: body.value
        }
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action',
        message: 'Only "validate" action is supported'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(`POST /api/teamtailor/custom-fields/${id} error:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}