import React, { useMemo } from 'react';
import { Space, Tag, Typography, Progress, Tooltip } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { JobRoleWithStats, JobRoleStatus, JOB_ROLE_STATUSES } from '@/types/job-roles';
import JobRoleActions from '../components/JobRoleActions';

const { Text } = Typography;

interface UseJobRoleTableColumnsProps {
  onView: (role: JobRoleWithStats) => void;
  onEdit: (role: JobRoleWithStats) => void;
  onDelete: (role: JobRoleWithStats) => void;
  onDataCollection: (role: JobRoleWithStats) => void;
  onTestSetup: (role: JobRoleWithStats) => void;
  onManagementReview: (role: JobRoleWithStats) => void;
  onStatusChange: (role: JobRoleWithStats, newStatus: JobRoleStatus) => void;
}

/**
 * Custom hook for job role table columns configuration
 * Follows Single Responsibility Principle - only manages table column definitions
 * Uses dependency injection for action handlers
 */
export const useJobRoleTableColumns = ({
  onView,
  onEdit,
  onDelete,
  onDataCollection,
  onTestSetup,
  onManagementReview,
  onStatusChange,
}: UseJobRoleTableColumnsProps): ColumnType<JobRoleWithStats>[] => {
  return useMemo(() => [
    {
      title: 'Job Title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong>{record.title}</Text>
            {record.is_priority && (
              <Tooltip title="Priority Role">
                <StarOutlined style={{ color: '#faad14' }} />
              </Tooltip>
            )}
            {record.published_to_teamtailor && (
              <Tooltip title="Published to TeamTailor">
                <Tag color="blue">TT</Tag>
              </Tooltip>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.department} • {record.level}
          </Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status: JobRoleStatus) => {
        const statusConfig = JOB_ROLE_STATUSES.find(s => s.value === status);
        return (
          <Tag color={statusConfig?.color || 'default'}>
            {statusConfig?.label || status}
          </Tag>
        );
      }
    },
    {
      title: 'Openings',
      key: 'openings',
      sorter: (a, b) => a.openings_count - b.openings_count,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text>{record.filled_count}/{record.openings_count}</Text>
            {record.openings_count > 0 && (
              <Progress
                percent={(record.filled_count / record.openings_count) * 100}
                size="small"
                style={{ width: '60px' }}
                showInfo={false}
              />
            )}
          </div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.applicant_count || 0} applicants
          </Text>
        </Space>
      )
    },
    {
      title: 'Salary Range',
      key: 'salary',
      sorter: (a, b) => (a.salary_range_max || 0) - (b.salary_range_max || 0),
      render: (_, record) => {
        if (!record.salary_range_min && !record.salary_range_max) {
          return <Text type="secondary">Not specified</Text>;
        }
        return (
          <Text>
            {record.currency} {record.salary_range_min?.toLocaleString()}-
            {record.salary_range_max?.toLocaleString()}
          </Text>
        );
      }
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      sorter: (a, b) => a.location.localeCompare(b.location),
    },
    {
      title: 'Days Open',
      dataIndex: 'days_open',
      key: 'days_open',
      sorter: (a, b) => a.days_open - b.days_open,
      render: (days: number) => (
        <Text style={{ 
          color: days > 60 ? '#ff4d4f' : days > 30 ? '#faad14' : '#52c41a' 
        }}>
          {days} days
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <JobRoleActions
          role={record}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onDataCollection={onDataCollection}
          onTestSetup={onTestSetup}
          onManagementReview={onManagementReview}
          onStatusChange={onStatusChange}
        />
      )
    }
  ], [onView, onEdit, onDelete, onDataCollection, onTestSetup, onManagementReview, onStatusChange]);
};