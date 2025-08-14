import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllJobs, 
  createJob, 
  createJobFromTemplate,
  JobPayload 
} from '../../../../../lib/integrations/teamtailor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build request options from search params
    const options: Record<string, unknown> = {};
    
    // Handle filtering
    const status = searchParams.get('status');
    const departmentId = searchParams.get('department_id');
    const locationId = searchParams.get('location_id');
    const clientId = searchParams.get('client_id');
    const userId = searchParams.get('user_id');
    
    if (status || departmentId || locationId || clientId || userId) {
      options.filter = {};
      const filter = options.filter as Record<string, unknown>;
      if (status) filter.status = status;
      if (departmentId) filter['department-id'] = departmentId;
      if (locationId) filter['location-id'] = locationId;
      if (clientId) filter['client-id'] = clientId;
      if (userId) filter['user-id'] = userId;
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

    const jobs = await getAllJobs(options);
    
    return NextResponse.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('GET /api/teamtailor/jobs error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs',
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
    if (!body.title || !body.body) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          message: 'Job title and body are required'
        },
        { status: 400 }
      );
    }
    
    const jobData: JobPayload = {
      title: body.title,
      body: body.body,
      ...(body.pitch && { pitch: body.pitch }),
      ...(body.status && { status: body.status }),
      ...(body.start_date && { startDate: body.start_date }),
      ...(body.end_date && { endDate: body.end_date }),
      ...(body.external_id && { externalId: body.external_id }),
      ...(body.remote_status && { remoteStatus: body.remote_status }),
      ...(body.salary_currency && { salaryCurrency: body.salary_currency }),
      ...(body.salary_from && { salaryFrom: body.salary_from }),
      ...(body.salary_to && { salaryTo: body.salary_to }),
      ...(body.employment_type && { employmentType: body.employment_type }),
      ...(body.experience_required && { experienceRequired: body.experience_required }),
      ...(body.skills_required && { skillsRequired: body.skills_required }),
      ...(body.department_id && { departmentId: body.department_id }),
      ...(body.location_ids && { locationIds: body.location_ids }),
      ...(body.user_id && { userId: body.user_id }),
      ...(body.client_id && { clientId: body.client_id }),
    };
    
    // Check if creating from template
    const templateId = body.template_id;
    let job;
    
    if (templateId) {
      job = await createJobFromTemplate(templateId, jobData as any);
    } else {
      job = await createJob(jobData as any);
    }
    
    return NextResponse.json({
      success: true,
      data: job
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/teamtailor/jobs error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create job',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}