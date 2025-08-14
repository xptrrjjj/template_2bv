import React from 'react';
import { Space, Button, Tooltip } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { JobRoleWithStats, JobRoleStatus } from '@/types/job-roles';
import { 
  canStartDataCollection, 
  isInDataCollection,
  canStartTestSetup,
  isInTestSetup,
  canProgressStatus,
  getNextStatus,
  getStatusActionLabel
} from '../utils/statusUtils';

interface JobRoleActionsProps {
  role: JobRoleWithStats;
  onView: (role: JobRoleWithStats) => void;
  onEdit: (role: JobRoleWithStats) => void;
  onDelete: (role: JobRoleWithStats) => void;
  onDataCollection: (role: JobRoleWithStats) => void;
  onTestSetup: (role: JobRoleWithStats) => void;
  onStatusChange: (role: JobRoleWithStats, newStatus: JobRoleStatus) => void;
}

/**
 * JobRoleActions Component
 * 
 * Handles all action buttons for job roles in the table
 * Follows Single Responsibility Principle - only manages action button logic
 * Uses composition and dependency inversion for testability
 */
const JobRoleActions: React.FC<JobRoleActionsProps> = ({
  role,
  onView,
  onEdit,
  onDelete,
  onDataCollection,
  onTestSetup,
  onStatusChange,
}) => {
  const handleStatusProgression = () => {
    const nextStatus = getNextStatus(role.status);
    if (nextStatus && nextStatus !== role.status) {
      onStatusChange(role, nextStatus);
    }
  };

  const canProgress = canProgressStatus(role.status, role);

  const handleDeleteWithConfirmation = () => {
    onDelete(role);
  };

  return (
    <Space>
      {/* View Details Action */}
      <Tooltip title="View Details">
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => onView(role)}
        />
      </Tooltip>

      {/* Data Collection Actions */}
      {canStartDataCollection(role.status) && (
        <Tooltip title="Start Data Collection">
          <Button
            type="text"
            icon={<SettingOutlined />}
            size="small"
            onClick={() => onDataCollection(role)}
            style={{ color: '#1890ff' }}
          />
        </Tooltip>
      )}

      {isInDataCollection(role.status) && (
        <Tooltip title="Continue Data Collection">
          <Button
            type="text"
            icon={<SettingOutlined />}
            size="small"
            onClick={() => onDataCollection(role)}
            style={{ color: '#52c41a' }}
          />
        </Tooltip>
      )}

      {/* Test Setup Actions */}
      {canStartTestSetup(role.status) && (
        <Tooltip title="Setup Tests">
          <Button
            type="text"
            icon={<ExperimentOutlined />}
            size="small"
            onClick={() => onTestSetup(role)}
            style={{ color: '#faad14' }}
          />
        </Tooltip>
      )}

      {isInTestSetup(role.status) && (
        <Tooltip title="Continue Test Setup">
          <Button
            type="text"
            icon={<ExperimentOutlined />}
            size="small"
            onClick={() => onTestSetup(role)}
            style={{ color: '#fa8c16' }}
          />
        </Tooltip>
      )}

      {/* Status Progression Action */}
      {canProgress && (
        <Tooltip title={getStatusActionLabel(role.status)}>
          <Button
            type="text"
            icon={<ArrowRightOutlined />}
            size="small"
            onClick={handleStatusProgression}
            style={{ color: '#fa8c16' }}
          />
        </Tooltip>
      )}

      {/* Edit Action */}
      <Tooltip title="Edit Role">
        <Button
          type="text"
          icon={<EditOutlined />}
          size="small"
          onClick={() => onEdit(role)}
        />
      </Tooltip>

      {/* Delete Action */}
      <Tooltip title="Delete Role">
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={handleDeleteWithConfirmation}
        />
      </Tooltip>
    </Space>
  );
};

export default JobRoleActions;