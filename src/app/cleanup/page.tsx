'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  Table, 
  Divider, 
  Spin,
  Tag,
  Modal
} from 'antd';
import { 
  DeleteOutlined, 
  SearchOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { apiClient } from '@/services/api';

const { Title, Text, Paragraph } = Typography;

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

export default function CleanupPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
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
  
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    Modal.confirm({
      title: 'Confirm Duplicate Cleanup',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <Paragraph>
            This will permanently delete <strong>{analysis?.summary.recordsToDelete}</strong> duplicate records.
          </Paragraph>
          <Paragraph>
            • <strong>{analysis?.summary.recordsToKeep}</strong> records will be kept
          </Paragraph>
          <Paragraph>
            • <strong>{analysis?.summary.duplicateGroupsFound}</strong> companies have duplicates
          </Paragraph>
          <Paragraph type="warning">
            <WarningOutlined /> This action cannot be undone!
          </Paragraph>
        </div>
      ),
      okText: 'Delete Duplicates',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: executeCleanup,
    });
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

  const duplicateColumns = [
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (name: string) => <strong>{name}</strong>
    },
    {
      title: 'TeamTailor ID',
      dataIndex: 'teamtailor_option_id',
      key: 'teamtailor_option_id',
      render: (id: string) => <Text code>{id}</Text>
    },
    {
      title: 'Total Records',
      dataIndex: 'duplicateCount',
      key: 'duplicateCount',
      render: (count: number) => (
        <Tag color={count > 2 ? 'red' : 'orange'}>{count}</Tag>
      )
    },
    {
      title: 'Keep Record (Oldest)',
      key: 'keepRecord',
      render: (record: DuplicateGroup) => (
        <div>
          <Text code>{record.keepRecord.record_id}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(record.keepRecord.created_at).toLocaleString()}
          </Text>
        </div>
      )
    },
    {
      title: 'Will Delete',
      key: 'deleteRecords',
      render: (record: DuplicateGroup) => (
        <Text type="danger">{record.deleteRecords.length} records</Text>
      )
    }
  ];

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Card
          style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
          styles={{ body: { padding: '32px' } }}
        >
          <Title level={2}>
            <DeleteOutlined style={{ color: '#ff4d4f', marginRight: '12px' }} />
            Datastore Cleanup Utility
          </Title>
          
          <Alert
            message="Warning: Data Cleanup Tool"
            description="This tool identifies and removes duplicate company records from the datastore. Always analyze first before cleaning up. Deleted records cannot be recovered."
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Space size="middle">
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={analyzeData}
              loading={loading}
              disabled={loading}
            >
              Analyze Duplicates
            </Button>
            
            {analysis && analysis.summary.duplicateGroupsFound > 0 && (
              <Button 
                type="primary" 
                danger
                icon={<DeleteOutlined />}
                onClick={performCleanup}
                loading={loading}
                disabled={loading}
              >
                Clean Up Duplicates ({analysis.summary.recordsToDelete})
              </Button>
            )}
          </Space>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Loading */}
        {loading && (
          <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Processing datastore records...</Text>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && (
          <Card
            title="Duplicate Analysis Results"
            style={{ marginBottom: '24px' }}
            extra={
              <Tag color={analysis.summary.duplicateGroupsFound > 0 ? 'red' : 'green'}>
                {analysis.summary.duplicateGroupsFound > 0 ? 'Duplicates Found' : 'Clean'}
              </Tag>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
                <Title level={3} style={{ margin: 0, color: '#0369a1' }}>{analysis.summary.totalRecords}</Title>
                <Text>Total Records</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                <Title level={3} style={{ margin: 0, color: '#16a34a' }}>{analysis.summary.uniqueCompanies}</Title>
                <Text>Unique Companies</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                <Title level={3} style={{ margin: 0, color: '#d97706' }}>{analysis.summary.duplicateGroupsFound}</Title>
                <Text>Companies w/ Duplicates</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
                <Title level={3} style={{ margin: 0, color: '#dc2626' }}>{analysis.summary.recordsToDelete}</Title>
                <Text>Records to Delete</Text>
              </div>
            </div>

            {analysis.summary.duplicateGroupsFound > 0 && (
              <>
                <Divider />
                <Title level={4}>Duplicate Groups Found</Title>
                <Table
                  columns={duplicateColumns}
                  dataSource={analysis.analysis.duplicateGroups}
                  rowKey="teamtailor_option_id"
                  pagination={{ pageSize: 10 }}
                  size="middle"
                />
              </>
            )}

            {analysis.summary.duplicateGroupsFound === 0 && (
              <Alert
                message="No Duplicates Found"
                description="Your datastore is clean! No duplicate company records were found."
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
          </Card>
        )}

        {/* Cleanup Results */}
        {cleanupResult && (
          <Card
            title="Cleanup Results"
            style={{ marginBottom: '24px' }}
            extra={
              <Tag color="green">
                <CheckCircleOutlined /> Completed
              </Tag>
            }
          >
            <Alert
              message="Cleanup Successful"
              description={cleanupResult.message}
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                <Title level={3} style={{ margin: 0, color: '#16a34a' }}>{cleanupResult.summary.recordsDeleted}</Title>
                <Text>Records Deleted</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
                <Title level={3} style={{ margin: 0, color: '#0369a1' }}>{cleanupResult.summary.recordsKept}</Title>
                <Text>Records Kept</Text>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                <Title level={3} style={{ margin: 0, color: '#d97706' }}>{cleanupResult.summary.duplicateGroupsProcessed}</Title>
                <Text>Companies Processed</Text>
              </div>
              {cleanupResult.summary.deletionsFailed > 0 && (
                <div style={{ textAlign: 'center', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
                  <Title level={3} style={{ margin: 0, color: '#dc2626' }}>{cleanupResult.summary.deletionsFailed}</Title>
                  <Text>Failed Deletions</Text>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}