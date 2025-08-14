// SOLID Principle: Single Responsibility - Filtering component
import React, { useState } from 'react';
import {
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Typography
} from 'antd';
import { 
  ClearOutlined,
  SearchOutlined 
} from '@ant-design/icons';
import {
  JOB_LEVELS,
  JOB_ROLE_STATUSES,
  COMMON_DEPARTMENTS,
  EMPLOYMENT_TYPES
} from '@/types/job-roles';
import type { JobRoleFilters } from '@/services/jobRoles/interfaces';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

interface JobRolesFiltersProps {
  onFiltersChange: (filters: JobRoleFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
  resultsCount?: number;
}

export const JobRolesFilters: React.FC<JobRolesFiltersProps> = ({
  onFiltersChange,
  onClearFilters,
  loading = false,
  resultsCount = 0
}) => {
  const [localFilters, setLocalFilters] = useState<JobRoleFilters>({});

  const handleFilterChange = (key: keyof JobRoleFilters, value: any) => {
    const newFilters = { ...localFilters };
    
    if (value === undefined || value === null || value === '' || value === 'all') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={24} md={12} lg={8} xl={6}>
          <Search
            placeholder="Search roles, skills, departments..."
            allowClear
            value={localFilters.search_query}
            onChange={(e) => handleFilterChange('search_query', e.target.value)}
            style={{ width: '100%' }}
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          />
        </Col>
        
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <Select
            placeholder="Department"
            value={localFilters.department || 'all'}
            onChange={(value) => handleFilterChange('department', value)}
            style={{ width: '100%' }}
            size="middle"
          >
            <Option value="all">All Departments</Option>
            {COMMON_DEPARTMENTS.map(dept => (
              <Option key={dept} value={dept}>{dept}</Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <Select
            placeholder="Status"
            value={localFilters.status || 'all'}
            onChange={(value) => handleFilterChange('status', value)}
            style={{ width: '100%' }}
            size="middle"
          >
            <Option value="all">All Statuses</Option>
            {JOB_ROLE_STATUSES.map(status => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <Select
            placeholder="Level"
            value={localFilters.level || 'all'}
            onChange={(value) => handleFilterChange('level', value)}
            style={{ width: '100%' }}
            size="middle"
          >
            <Option value="all">All Levels</Option>
            {JOB_LEVELS.map(level => (
              <Option key={level.value} value={level.value}>
                {level.label}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={12} sm={8} md={6} lg={4} xl={3}>
          <Select
            placeholder="Employment"
            value={localFilters.employment_type || 'all'}
            onChange={(value) => handleFilterChange('employment_type', value)}
            style={{ width: '100%' }}
            size="middle"
          >
            <Option value="all">All Types</Option>
            {EMPLOYMENT_TYPES.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={24} md={12} lg={8} xl={6}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              {hasActiveFilters && (
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                  size="middle"
                  type="text"
                >
                  Clear Filters
                </Button>
              )}
            </Space>
            
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {resultsCount} {resultsCount === 1 ? 'role' : 'roles'} found
              </Text>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};