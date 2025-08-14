import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllCustomFields, 
  createCustomField,
  CustomFieldPayload 
} from '../../../../../lib/integrations/teamtailor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build request options from search params
    const options: Record<string, unknown> = {};
    
    // Handle filtering
    const resourceType = searchParams.get('resource_type');
    const fieldType = searchParams.get('field_type');
    
    if (resourceType || fieldType) {
      options.filter = {};
      const filter = options.filter as Record<string, unknown>;
      if (resourceType) filter['resource-type'] = resourceType;
      if (fieldType) filter['field-type'] = fieldType;
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

    const customFields = await getAllCustomFields(options);
    
    return NextResponse.json({
      success: true,
      data: customFields,
      count: customFields.length
    });
  } catch (error) {
    console.error('GET /api/teamtailor/custom-fields error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch custom fields',
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
    if (!body.name || !body.field_type || !body.api_key || !body.resource_type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          message: 'Name, field_type, api_key, and resource_type are required'
        },
        { status: 400 }
      );
    }
    
    // Validate field type
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
    
    // Validate resource type
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
    
    const customFieldData: CustomFieldPayload = {
      name: body.name,
      fieldType: body.field_type,
      apiKey: body.api_key,
      resourceType: body.resource_type,
      ...(body.required !== undefined && { required: body.required }),
      ...(body.options && { options: body.options }),
      ...(body.description && { description: body.description }),
    };
    
    const customField = await createCustomField(customFieldData as any);
    
    return NextResponse.json({
      success: true,
      data: customField
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/teamtailor/custom-fields error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create custom field',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}