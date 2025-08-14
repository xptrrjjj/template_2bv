'use client';

import React, { useState } from 'react';
import { Layout, Table } from 'antd';
import { JobRoleWithStats, DataCollectionData, TestSetupData } from '@/types/job-roles';
import { useJobRoles } from '@/hooks/useJobRoles';
import { jobRoleStatisticsService } from '@/services/jobRoles/index';
import JobRoleWizard from '@/components/job-roles/JobRoleWizard';
import JobRoleDetailsModal from '@/components/job-roles/JobRoleDetailsModal';
import DataCollectionModal from '@/components/job-roles/DataCollectionModal';
import TestSetupModal from '@/components/job-roles/TestSetupModal';
import { JobRolesHeader } from './components/JobRolesHeader';
import { JobRolesFilters } from './components/JobRolesFilters';
import JobRoleEditModal from './components/JobRoleEditModal';
import { useJobRoleTableColumns } from './hooks/useJobRoleTableColumns';
import { useJobRoleOperations } from './hooks/useJobRoleOperations';
import styles from './roles.module.css';

const { Content } = Layout;

/**
 * JobRolesPage - Main page component for job roles management
 * 
 * Refactored to follow SOLID principles:
 * - Single Responsibility: Only handles page layout and modal coordination
 * - Open/Closed: Extensible through dependency injection
 * - Dependency Inversion: Depends on abstractions (hooks/components)
 * 
 * Reduced from 684 lines to ~150 lines by extracting:
 * - Table columns configuration → useJobRoleTableColumns hook
 * - Action buttons → JobRoleActions component  
 * - Edit form → JobRoleEditModal component
 * - CRUD operations → useJobRoleOperations hook
 * - Status logic → statusUtils
 */
export default function JobRolesPage() {
  // Core data and operations
  const {
    filteredJobRoles,
    loading,
    loadJobRoles,
    setFilters,
    clearFilters
  } = useJobRoles();

  const {
    operationLoading,
    handleDeleteJobRole,
    handleStatusChange,
    handleDataCollectionSave,
    handleTestSetupSave,
    handleEditSubmit,
    prepareRoleForEdit,
    prepareRoleForWizard,
  } = useJobRoleOperations();

  // Modal state management
  const [createWizardVisible, setCreateWizardVisible] = useState(false);
  const [editWizardVisible, setEditWizardVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [dataCollectionModalVisible, setDataCollectionModalVisible] = useState(false);
  const [testSetupModalVisible, setTestSetupModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<JobRoleWithStats | null>(null);
  const [statistics, setStatistics] = useState({ totalRoles: 0, activeRoles: 0, draftRoles: 0 });

  // Load statistics
  React.useEffect(() => {
    const loadStatistics = async () => {
      try {
        const stats = await jobRoleStatisticsService.getStatistics();
        setStatistics({
          totalRoles: stats.total_roles,
          activeRoles: stats.active_roles,
          draftRoles: filteredJobRoles.filter(r => r.status === 'draft').length
        });
      } catch (error) {
        console.error('Failed to load statistics:', error);
      }
    };
    
    if (!loading) {
      loadStatistics();
    }
  }, [loading, filteredJobRoles]);

  // Action handlers - delegated to appropriate components/hooks
  const handleView = (role: JobRoleWithStats) => {
    setSelectedRole(role);
    setViewModalVisible(true);
  };

  const handleEdit = (role: JobRoleWithStats) => {
    setSelectedRole(role);
    
    // If role is in draft status, open the wizard for full editing
    if (role.status === 'draft') {
      setEditWizardVisible(true);
    } else {
      // For non-draft roles, use the simple edit modal (limited editing)
      setEditModalVisible(true);
    }
  };

  const handleDataCollection = (role: JobRoleWithStats) => {
    setSelectedRole(role);
    setDataCollectionModalVisible(true);
  };

  const handleTestSetup = (role: JobRoleWithStats) => {
    setSelectedRole(role);
    setTestSetupModalVisible(true);
  };

  const handleDelete = async (role: JobRoleWithStats) => {
    await handleDeleteJobRole(role);
  };

  // Modal event handlers
  const handleWizardComplete = () => {
    setCreateWizardVisible(false);
    loadJobRoles();
  };

  const handleEditWizardComplete = () => {
    setEditWizardVisible(false);
    setSelectedRole(null);
    loadJobRoles();
  };

  const handleEditModalSubmit = async (formData: any) => {
    if (!selectedRole) return;
    
    const success = await handleEditSubmit(selectedRole, formData as any);
    if (success) {
      setEditModalVisible(false);
    }
  };

  const handleDataCollectionModalSave = async (dataCollectionData: DataCollectionData) => {
    if (!selectedRole) return;
    
    const success = await handleDataCollectionSave(selectedRole, dataCollectionData);
    if (success) {
      setDataCollectionModalVisible(false);
    }
  };

  const handleTestSetupModalSave = async (testSetupData: TestSetupData) => {
    if (!selectedRole) return;
    
    const success = await handleTestSetupSave(selectedRole, testSetupData);
    if (success) {
      setTestSetupModalVisible(false);
    }
  };

  // Table columns configuration
  const columns = useJobRoleTableColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onDataCollection: handleDataCollection,
    onTestSetup: handleTestSetup,
    onStatusChange: handleStatusChange,
  });

  return (
    <Layout className={styles.container}>
      <Content className={styles.content}>
        {/* Header with statistics */}
        <div className={`${styles.cardShadow} ${styles.headerCard}`}>
          <JobRolesHeader
            onCreateClick={() => setCreateWizardVisible(true)}
            onRefreshClick={loadJobRoles}
            loading={loading}
            totalRoles={statistics.totalRoles}
            activeRoles={statistics.activeRoles}
            draftRoles={statistics.draftRoles}
          />
        </div>

        {/* Filters */}
        <div className={`${styles.cardShadow} ${styles.filtersCard}`}>
          <JobRolesFilters
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            loading={loading}
            resultsCount={filteredJobRoles.length}
          />
        </div>

        {/* Job Roles Table */}
        <div className={`${styles.cardShadow} ${styles.tableCard}`}>
          <Table
            columns={columns}
            dataSource={filteredJobRoles}
            rowKey="role_id"
            loading={loading || operationLoading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} job roles`
            }}
            scroll={{ x: 1200 }}
            rowClassName={(_, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
          />
        </div>

        {/* Modals */}
        <JobRoleWizard
          visible={createWizardVisible}
          onCancel={() => setCreateWizardVisible(false)}
          onComplete={handleWizardComplete}
        />

        {/* Edit Wizard for draft roles */}
        {selectedRole && selectedRole.status === 'draft' && (
          <JobRoleWizard
            visible={editWizardVisible}
            onCancel={() => {
              setEditWizardVisible(false);
              setSelectedRole(null);
            }}
            onComplete={handleEditWizardComplete}
            editMode={true}
            initialData={prepareRoleForWizard(selectedRole)}
            roleId={selectedRole.role_id}
          />
        )}

        <JobRoleEditModal
          visible={editModalVisible}
          role={selectedRole}
          loading={operationLoading}
          onClose={() => setEditModalVisible(false)}
          onSubmit={handleEditModalSubmit}
          initialFormData={selectedRole ? prepareRoleForEdit(selectedRole) as any : undefined}
        />

        {selectedRole && (
          <>
            <JobRoleDetailsModal
              role={selectedRole}
              visible={viewModalVisible}
              onClose={() => setViewModalVisible(false)}
              onEdit={() => {
                setViewModalVisible(false);
                handleEdit(selectedRole);
              }}
            />

            <DataCollectionModal
              role={selectedRole}
              visible={dataCollectionModalVisible}
              onClose={() => setDataCollectionModalVisible(false)}
              onSave={handleDataCollectionModalSave}
              loading={operationLoading}
            />

            <TestSetupModal
              role={selectedRole}
              visible={testSetupModalVisible}
              onClose={() => setTestSetupModalVisible(false)}
              onSave={handleTestSetupModalSave}
              loading={operationLoading}
            />
          </>
        )}
      </Content>
    </Layout>
  );
}