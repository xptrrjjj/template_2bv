'use server'

/**
 * SOLID Principle: Single Responsibility
 * TeamTailor Utility Actions - handles cross-domain operations
 */

import { 
  getAllClients,
  ClientOption
} from '@/lib/integrations/teamtailor';

// ===== UTILITY ACTIONS =====

// Only implement utilities that work with existing implementations
export async function syncClientData(): Promise<{
  clients: ClientOption[];
}> {
  try {
    const clients = await getAllClients();
    return { clients };
  } catch (error) {
    console.error('Server Action: syncClientData failed:', error);
    throw new Error('Failed to sync client data');
  }
}

export async function fetchClientStats(): Promise<{
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
}> {
  try {
    const clients = await getAllClients();
    
    return {
      totalClients: clients.length,
      activeClients: clients.filter(client => client.status === 'active').length,
      inactiveClients: clients.filter(client => client.status === 'inactive').length,
    };
  } catch (error) {
    console.error('Server Action: fetchClientStats failed:', error);
    throw new Error('Failed to fetch client statistics');
  }
}

// TODO: Implement when other operations are ready
/*
export async function syncAllData(): Promise<{
  clients: ClientOption[];
  jobs: JobOption[];
  candidates: CandidateOption[];
  customFields: CustomFieldOption[];
}> {
  try {
    const [clients, jobs, candidates, customFields] = await Promise.all([
      getAllClients(),
      getAllJobs(),
      getAllCandidates(),
      getAllCustomFields()
    ]);
    
    return { clients, jobs, candidates, customFields };
  } catch (error) {
    console.error('Server Action: syncAllData failed:', error);
    throw new Error('Failed to sync all TeamTailor data');
  }
}

export async function fetchDashboardStats(): Promise<{
  totalClients: number;
  totalJobs: number;
  totalCandidates: number;
  activeJobs: number;
  publishedJobs: number;
  hiredCandidates: number;
  sourcedCandidates: number;
}> {
  try {
    const [clients, jobs, candidates, publishedJobs, hiredCandidates, sourcedCandidates] = await Promise.all([
      getAllClients(),
      getAllJobs(),
      getAllCandidates(),
      getJobsByStatus('published'),
      getHiredCandidates(),
      getSourcedCandidates()
    ]);

    const activeJobs = jobs.filter((job: JobOption) => job.status === 'published' || job.status === 'draft').length;
    
    return {
      totalClients: clients.length,
      totalJobs: jobs.length,
      totalCandidates: candidates.length,
      activeJobs,
      publishedJobs: publishedJobs.length,
      hiredCandidates: hiredCandidates.length,
      sourcedCandidates: sourcedCandidates.length,
    };
  } catch (error) {
    console.error('Server Action: fetchDashboardStats failed:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}
*/