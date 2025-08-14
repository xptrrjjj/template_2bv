'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '@/services/api';
import {
  createNewCustomFieldOption,
  updateExistingCustomFieldOption
} from '@/app/actions/teamtailor';
import type { 
  CompanyRecord, 
  MergedCompany, 
  CreateCompanyForm 
} from '@/types/company';

// Local interfaces to avoid import issues
interface LocationOption {
  id: string;
  name: string;
  city?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}


// Constants
const COMPANIES_CUSTOM_FIELD_ID = '83985'; // TeamTailor custom field ID for companies
const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_IDENTIFIER || 'antd_recruiter';
const RECORD_TYPE = 'companies';

// Migration helper function
const migrateOldCompanyRecords = async (oldRecords: DatastoreCompany[]): Promise<void> => {
  try {
    const migrationPromises = oldRecords.map(async (oldRecord) => {
      try {
        // Create new record with proper structure
        const migratedRecord: CompanyRecord = {
          // Required datastore fields
          app_id: RECORD_TYPE, // 'companies' - data type identifier
          record_id: oldRecord.company_id as string || uuidv4(),
          
          // Preserve existing company data
          company_id: oldRecord.company_id as string,
          teamtailor_option_id: oldRecord.teamtailor_option_id as string,
          industry: oldRecord.industry as string || '',
          website: oldRecord.website as string || '',
          contact_name: oldRecord.contact_name as string || '',
          source: oldRecord.source as string || 'Legacy Data',
          teamtailor_location_id: oldRecord.teamtailor_location_id as string || '',
          location_name: oldRecord.location_name as string || '',
          created_at: oldRecord.created_at as string || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Create the new record
        await apiClient.createRecord(APP_IDENTIFIER, migratedRecord);
        
        // Delete the old record if it has a different structure
        if (!oldRecord.app_id || oldRecord.app_id !== RECORD_TYPE) {
          try {
            const recordIdToDelete = oldRecord.record_id as string || oldRecord.company_id as string;
            if (recordIdToDelete) {
              await apiClient.deleteRecord(APP_IDENTIFIER, recordIdToDelete);
            }
          } catch (deleteError) {
            // Don't fail the migration if delete fails
          }
        }
      } catch (error) {
        // Don't fail the entire migration for one record
      }
    });
    
    // Wait for all migrations to complete
    await Promise.allSettled(migrationPromises);
  } catch (error) {
    // Don't throw - allow the app to continue with whatever records are available
  }
};

// Client-side data merging function
interface TeamTailorCompany {
  id: string;
  attributes?: {
    value?: string;
  };
}

interface DatastoreCompany {
  teamtailor_option_id?: string;
  [key: string]: unknown;
}

const mergeCompanyData = (ttCompanies: TeamTailorCompany[], datastoreCompanies: DatastoreCompany[]): MergedCompany[] => {
  const merged: MergedCompany[] = [];
  
  // Create lookup maps
  const datastoreMap = new Map<string, DatastoreCompany>();
  datastoreCompanies.forEach((c) => {
    if (c.teamtailor_option_id && typeof c.teamtailor_option_id === 'string') {
      datastoreMap.set(c.teamtailor_option_id, c);
    }
  });
  
  const ttMap = new Map<string, TeamTailorCompany>();
  ttCompanies.forEach((tt) => {
    ttMap.set(tt.id, tt);
  });

  // 1. Process datastore records (guaranteed TT mapping)
  for (const dsRecord of datastoreCompanies) {
    const ttOptionId = dsRecord.teamtailor_option_id as string;
    if (ttOptionId) {
      const ttRecord = ttMap.get(ttOptionId);
      merged.push({
        ...dsRecord,
        company_name: ttRecord?.attributes?.value || ttOptionId || '[MISSING IN TT]',
        sync_status: 'synced',
        tt_created_at: ttRecord ? new Date().toISOString() : undefined,
        tt_updated_at: ttRecord ? new Date().toISOString() : undefined
      } as MergedCompany);
    }
  }
  
  // 2. Process orphaned TT records (missing in datastore)
  for (const [ttId, ttRecord] of ttMap) {
    if (!datastoreMap.has(ttId)) {
      merged.push({
        company_id: '', // No datastore record
        teamtailor_option_id: ttId,
        company_name: ttRecord.attributes?.value || '',
        industry: '',
        contact_name: '',
        source: '',
        website: '',
        teamtailor_location_id: '',
        location_name: '',
        sync_status: 'missing',
        created_at: '',
        updated_at: '',
        tt_created_at: new Date().toISOString(),
        tt_updated_at: new Date().toISOString(),
        app_id: RECORD_TYPE,
        record_id: ''
      } as MergedCompany);
    }
  }
  
  // Sort by company name
  merged.sort((a, b) => (a.company_name || '').localeCompare(b.company_name || ''));
  
  return merged;
};

interface UseCompaniesReturn {
  companies: MergedCompany[];
  locations: LocationOption[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  createCompany: (data: CreateCompanyForm) => Promise<void>;
  updateCompany: (companyId: string, data: Partial<CreateCompanyForm>) => Promise<void>;
  syncMissingCompany: (company: MergedCompany) => Promise<void>;
  bulkSyncMissingCompanies: () => Promise<void>;
}

export const useCompanies = (): UseCompaniesReturn => {
  const [companies, setCompanies] = useState<MergedCompany[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all companies data - hybrid approach with client-side datastore calls
  const fetchCompaniesData = async (): Promise<{
    companies: MergedCompany[];
    locations: LocationOption[];
  }> => {
    try {
      // Fetch TeamTailor data from server-side API (no auth needed)
      const ttResponse = await fetch('/api/companies-teamtailor-only');
      if (!ttResponse.ok) {
        throw new Error(`TeamTailor API error: ${ttResponse.status}`);
      }
      const ttData = await ttResponse.json();
      
      if (ttData.status === 'error') {
        throw new Error(ttData.error || 'Failed to fetch TeamTailor data');
      }
      
      // Fetch datastore data client-side (has auth token)
      // Try new structure first, then fallback to old structure for backward compatibility
      let datastoreCompanies: DatastoreCompany[] = [];
      
      // New structure query
      const newStructureResponse = await apiClient.getRecords(APP_IDENTIFIER, { app_id: RECORD_TYPE });
      if (newStructureResponse.status === 'success' && newStructureResponse.data) {
        datastoreCompanies = newStructureResponse.data as DatastoreCompany[];
      }
      
      // If no results with new structure, try old structure (backward compatibility)
      if (datastoreCompanies.length === 0) {
        const oldStructureResponse = await apiClient.getRecords(APP_IDENTIFIER);
        if (oldStructureResponse.status === 'success' && oldStructureResponse.data) {
          // Filter for company records from old structure (they should have company_id and teamtailor_option_id)
          const allRecords = oldStructureResponse.data as DatastoreCompany[];
          const oldCompanies = allRecords.filter(record => 
            record.company_id && record.teamtailor_option_id
          );
          
          // Migrate old records to new structure automatically
          if (oldCompanies.length > 0) {
            await migrateOldCompanyRecords(oldCompanies);
            
            // Fetch the newly migrated records
            const migratedResponse = await apiClient.getRecords(APP_IDENTIFIER, { app_id: RECORD_TYPE });
            if (migratedResponse.status === 'success' && migratedResponse.data) {
              datastoreCompanies = migratedResponse.data as DatastoreCompany[];
            }
          }
        }
      }
      
      // Merge the data client-side
      const mergedCompanies = mergeCompanyData(ttData.companies || [], datastoreCompanies);
      
      return {
        companies: mergedCompanies,
        locations: ttData.locations || []
      };
    } catch (error) {
      console.error('Error fetching companies data:', error);
      throw error;
    }
  };

  // Fetch and set companies data
  const fetchAndSetCompanies = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const { companies: mergedData, locations: ttLocations } = await fetchCompaniesData();
      setCompanies(mergedData);
      setLocations(ttLocations);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch company data';
      setError(errorMessage);
      console.error('Error in fetchAndSetCompanies:', error);
    }
  }, []);

  // Refresh data
  const refreshData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await fetchAndSetCompanies();
    } finally {
      setLoading(false);
    }
  }, [fetchAndSetCompanies]);

  // Create new company
  const createCompany = useCallback(async (data: CreateCompanyForm): Promise<void> => {
    try {
      // Step 1: Create in TeamTailor (company name)
      const ttResponse = await createNewCustomFieldOption({
        value: data.company_name,
        customFieldId: COMPANIES_CUSTOM_FIELD_ID
      });
      const teamtailorOptionId = ttResponse.id;

      // Step 2: Create in Datastore
      const companyId = uuidv4();
      const companyRecord: CompanyRecord = {
        // Required datastore fields
        app_id: RECORD_TYPE, // 'companies' - data type identifier
        record_id: companyId,
        
        // Company-specific fields
        company_id: companyId,
        teamtailor_option_id: teamtailorOptionId,
        industry: data.industry,
        website: data.website || '',
        contact_name: data.contact_name,
        source: data.source,
        teamtailor_location_id: data.teamtailor_location_id,
        location_name: data.location_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await apiClient.createRecord(APP_IDENTIFIER, companyRecord);
      
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to create company in datastore');
      }

      // Refresh data to show the new company
      await fetchAndSetCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }, [fetchAndSetCompanies]);

  // Update existing company
  const updateCompany = useCallback(async (
    companyId: string, 
    data: Partial<CreateCompanyForm>
  ): Promise<void> => {
    try {
      const company = companies.find(c => c.company_id === companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // If company name changed: Update TT first
      if (data.company_name && data.company_name !== company.company_name) {
        await updateExistingCustomFieldOption(company.teamtailor_option_id, {
          value: data.company_name,
          customFieldId: COMPANIES_CUSTOM_FIELD_ID
        });
      }

      // Update Datastore (all fields including name for consistency)
      const datastoreUpdates: Partial<CompanyRecord> = {
        // Required identifiers
        app_id: RECORD_TYPE, // 'companies' - data type identifier
        record_id: company.record_id || company.company_id,
        company_id: companyId,
        updated_at: new Date().toISOString(),
        ...data
      };

      const response = await apiClient.updateRecord(APP_IDENTIFIER, datastoreUpdates);
      
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to update company');
      }

      // Refresh data to show updates
      await fetchAndSetCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }, [companies, fetchAndSetCompanies]);

  // Sync missing company (create datastore record for TT-only company)
  const syncMissingCompany = useCallback(async (ttCompany: MergedCompany, skipRefresh = false): Promise<void> => {
    try {
      const companyId = uuidv4();
      const defaultRecord: CompanyRecord = {
        // Required datastore fields
        app_id: RECORD_TYPE, // 'companies' - data type identifier  
        record_id: companyId,
        
        // Company-specific fields
        company_id: companyId,
        teamtailor_option_id: ttCompany.teamtailor_option_id,
        industry: '', // User must fill
        website: '',
        contact_name: '', // User must fill  
        source: 'TeamTailor Sync', // Default value
        teamtailor_location_id: '', // User must select
        location_name: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await apiClient.createRecord(APP_IDENTIFIER, defaultRecord);
      
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to sync company');
      }

      // Only refresh data if not in bulk mode
      if (!skipRefresh) {
        await fetchAndSetCompanies();
      }
    } catch (error) {
      console.error('Error syncing missing company:', error);
      throw error;
    }
  }, [fetchAndSetCompanies]);

  // Bulk sync missing companies
  const bulkSyncMissingCompanies = useCallback(async (): Promise<void> => {
    try {
      const missingCompanies = companies.filter(c => c.sync_status === 'missing');
      
      if (missingCompanies.length === 0) {
        return;
      }

      console.log(`Starting bulk sync for ${missingCompanies.length} companies:`, missingCompanies.map(c => c.company_name));

      // Create promises for all sync operations - skip individual refreshes
      const syncPromises = missingCompanies.map(company => 
        syncMissingCompany(company, true).catch(error => {
          console.error(`Failed to sync company ${company.company_name}:`, error);
          return error;
        })
      );

      // Wait for all to complete
      const results = await Promise.allSettled(syncPromises);
      
      // Count successes and failures
      const successes = results.filter(result => result.status === 'fulfilled' && !(result.value instanceof Error)).length;
      const failures = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value instanceof Error)).length;
      
      console.log(`Bulk sync completed: ${successes} successes, ${failures} failures`);
      
      if (failures > 0 && successes === 0) {
        throw new Error(`All ${failures} companies failed to sync`);
      }

      // Refresh data once at the end to show all changes
      try {
        await fetchAndSetCompanies();
      } catch (refreshError) {
        console.warn('Failed to refresh data after bulk sync, but companies were synced successfully:', refreshError);
        // Don't fail the entire operation if only the refresh fails
      }
      
      if (failures > 0) {
        console.warn(`${failures} companies failed to sync, but ${successes} succeeded`);
      }
    } catch (error) {
      console.error('Error in bulk sync:', error);
      throw error;
    }
  }, [companies, syncMissingCompany, fetchAndSetCompanies]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    companies,
    locations,
    loading,
    error,
    refreshData,
    createCompany,
    updateCompany,
    syncMissingCompany,
    bulkSyncMissingCompanies
  };
};