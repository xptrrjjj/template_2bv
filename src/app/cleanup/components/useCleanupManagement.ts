"use client";

import { useState } from "react";
import { apiClient } from "@/services/api";

interface CompanyRecord {
  record_id: string;
  company_id: string;
  teamtailor_option_id: string;
  company_name?: string;
  created_at: string;
  [key: string]: unknown;
}

interface DuplicateGroup {
  teamtailor_option_id: string;
  company_name: string;
  records: CompanyRecord[];
  duplicateCount: number;
  keepRecord: CompanyRecord;
  deleteRecords: CompanyRecord[];
}

interface CleanupAnalysis {
  totalRecords: number;
  uniqueCompanies: number;
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
  recordsToDelete: number;
}

interface AnalysisResponse {
  status: string;
  analysis: CleanupAnalysis;
  summary: {
    totalRecords: number;
    uniqueCompanies: number;
    duplicateGroupsFound: number;
    totalDuplicateRecords: number;
    recordsToDelete: number;
    recordsToKeep: number;
  };
}

interface CleanupResult {
  status: string;
  action: string;
  message: string;
  summary: {
    totalRecords: number;
    duplicateGroupsProcessed: number;
    recordsDeleted: number;
    recordsKept: number;
    deletionsFailed: number;
  };
  results: {
    company_name: string;
    deleted_record_id: string;
    deleted_created_at: string;
    status: string;
    error?: string;
  }[];
}

export function useCleanupManagement() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Client-side duplicate analysis
  const analyzeDuplicates = (records: CompanyRecord[]) => {
    // Group records by teamtailor_option_id (the unique identifier for companies)
    const groupedByTTId = new Map<string, CompanyRecord[]>();
    
    records.forEach(record => {
      if (record.teamtailor_option_id) {
        const key = record.teamtailor_option_id;
        if (!groupedByTTId.has(key)) {
          groupedByTTId.set(key, []);
        }
        groupedByTTId.get(key)!.push(record);
      }
    });

    const duplicateGroups: DuplicateGroup[] = [];
    let totalDuplicates = 0;

    // Find groups with more than 1 record (duplicates)
    for (const [ttId, groupRecords] of groupedByTTId) {
      if (groupRecords.length > 1) {
        // Sort by created_at to keep the oldest record (first sync)
        const sortedRecords = [...groupRecords].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const keepRecord = sortedRecords[0]; // Keep oldest
        const deleteRecords = sortedRecords.slice(1); // Delete newer duplicates
        
        duplicateGroups.push({
          teamtailor_option_id: ttId,
          company_name: keepRecord.company_name || keepRecord.teamtailor_option_id || 'Unknown',
          records: groupRecords,
          duplicateCount: groupRecords.length,
          keepRecord,
          deleteRecords
        });

        totalDuplicates += deleteRecords.length;
      }
    }

    return {
      totalRecords: records.length,
      uniqueCompanies: groupedByTTId.size,
      duplicateGroups,
      totalDuplicates,
      recordsToDelete: totalDuplicates
    };
  };

  const analyzeData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch records directly from client-side (has auth tokens)
      const response = await apiClient.getRecords('companies');
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to fetch records');
      }

      const records = (response.data || []) as CompanyRecord[];
      console.log(`Found ${records.length} total records for analysis`);

      // Analyze duplicates client-side
      const analysisResult = analyzeDuplicates(records);
      
      setAnalysis({
        status: 'success',
        analysis: analysisResult,
        summary: {
          totalRecords: analysisResult.totalRecords,
          uniqueCompanies: analysisResult.uniqueCompanies,
          duplicateGroupsFound: analysisResult.duplicateGroups.length,
          totalDuplicateRecords: analysisResult.totalDuplicates,
          recordsToDelete: analysisResult.recordsToDelete,
          recordsToKeep: analysisResult.totalRecords - analysisResult.recordsToDelete
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze data');
    } finally {
      setLoading(false);
    }
  };

  const performCleanup = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmCleanup = () => {
    setShowConfirmDialog(false);
    executeCleanup();
  };

  const handleCancelCleanup = () => {
    setShowConfirmDialog(false);
  };

  const executeCleanup = async () => {
    if (!analysis) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Starting cleanup process...');
      
      const deletionResults = [];
      let successfulDeletions = 0;
      let failedDeletions = 0;

      for (const group of analysis.analysis.duplicateGroups) {
        console.log(`Processing duplicates for company: ${group.company_name}`);
        console.log(`Keeping record: ${group.keepRecord.record_id} (created: ${group.keepRecord.created_at})`);
        
        for (const recordToDelete of group.deleteRecords) {
          try {
            console.log(`Deleting duplicate record: ${recordToDelete.record_id} (created: ${recordToDelete.created_at})`);
            
            await apiClient.deleteRecord('companies', recordToDelete.record_id);
            successfulDeletions++;
            
            deletionResults.push({
              company_name: group.company_name,
              deleted_record_id: recordToDelete.record_id,
              deleted_created_at: recordToDelete.created_at,
              status: 'success'
            });
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`Failed to delete record ${recordToDelete.record_id}:`, error);
            failedDeletions++;
            
            deletionResults.push({
              company_name: group.company_name,
              deleted_record_id: recordToDelete.record_id,
              deleted_created_at: recordToDelete.created_at,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      console.log(`Cleanup completed. Successful: ${successfulDeletions}, Failed: ${failedDeletions}`);

      setCleanupResult({
        status: 'success',
        action: 'cleanup',
        message: `Cleanup completed. Deleted ${successfulDeletions} duplicate records, ${failedDeletions} failures.`,
        summary: {
          totalRecords: analysis.summary.totalRecords,
          duplicateGroupsProcessed: analysis.analysis.duplicateGroups.length,
          recordsDeleted: successfulDeletions,
          recordsKept: analysis.summary.totalRecords - successfulDeletions,
          deletionsFailed: failedDeletions
        },
        results: deletionResults
      });
      
      setAnalysis(null); // Clear analysis to force re-analysis
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup duplicates');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    analysis,
    cleanupResult,
    error,
    showConfirmDialog,
    analyzeData,
    performCleanup,
    handleConfirmCleanup,
    handleCancelCleanup,
  };
}