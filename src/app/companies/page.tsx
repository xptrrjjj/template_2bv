'use client';

import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  notification, 
  Tag, 
  Card,
  Typography,
  Row,
  Col,
  Input,
  Select,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  SyncOutlined,
  BuildOutlined,
  EditOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { CompanyModal } from './components/CompanyModal';
import { useCompanies } from './hooks/useCompanies';
import { MergedCompany } from '@/types/company';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function CompaniesPage() {
  const {
    companies,
    locations,
    loading,
    refreshData,
    createCompany,
    updateCompany,
    syncMissingCompany,
    bulkSyncMissingCompanies
  } = useCompanies();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCompany, setSelectedCompany] = useState<MergedCompany | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'synced' | 'missing'>('all');

  // Filter companies based on search and status
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchTerm || 
      company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || company.sync_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const missingCompaniesCount = companies.filter(c => c.sync_status === 'missing').length;

  // Handle create company
  const handleCreate = () => {
    setModalMode('create');
    setSelectedCompany(undefined);
    setIsModalVisible(true);
  };

  // Handle edit company
  const handleEdit = (company: MergedCompany) => {
    setModalMode('edit');
    setSelectedCompany(company);
    setIsModalVisible(true);
  };

  // Handle sync single missing company
  const handleSync = async (company: MergedCompany) => {
    try {
      await syncMissingCompany(company);
      notification.success({
        message: 'Company Synced',
        description: `${company.company_name} has been added to the datastore.`
      });
    } catch (error) {
      notification.error({
        message: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync company'
      });
    }
  };

  // Handle bulk sync
  const handleBulkSync = async () => {
    if (missingCompaniesCount === 0) {
      notification.info({
        message: 'Nothing to Sync',
        description: 'All companies are already synced.'
      });
      return;
    }

    Modal.confirm({
      title: 'Bulk Sync Companies',
      content: `This will create datastore records for ${missingCompaniesCount} missing companies. Continue?`,
      onOk: async () => {
        try {
          await bulkSyncMissingCompanies();
          notification.success({
            message: 'Bulk Sync Complete',
            description: `${missingCompaniesCount} companies synced successfully.`
          });
        } catch {
          notification.error({
            message: 'Bulk Sync Failed',
            description: 'Some companies could not be synced. Please try individual sync.'
          });
        }
      }
    });
  };

  // Table columns
  const columns: ColumnType<MergedCompany>[] = [
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      sorter: (a, b) => a.company_name.localeCompare(b.company_name),
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.sync_status === 'missing' && (
            <Tag color="orange">Missing in Datastore</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Industry',
      dataIndex: 'industry',
      key: 'industry',
      render: (industry) => industry || <Text type="secondary">-</Text>
    },
    {
      title: 'Location',
      dataIndex: 'location_name',
      key: 'location_name',
      render: (location) => location || <Text type="secondary">-</Text>
    },
    {
      title: 'Contact Name',
      dataIndex: 'contact_name',
      key: 'contact_name',
      render: (contact) => contact || <Text type="secondary">-</Text>
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source) => source || <Text type="secondary">-</Text>
    },
    {
      title: 'Website',
      dataIndex: 'website',
      key: 'website',
      render: (website) => 
        website ? (
          <a href={website} target="_blank" rel="noopener noreferrer">
            {website}
          </a>
        ) : (
          <Text type="secondary">-</Text>
        )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.sync_status === 'synced' ? (
            <Button 
              type="link" 
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          ) : (
            <Button 
              type="primary" 
              size="small"
              icon={<SyncOutlined />}
              onClick={() => handleSync(record)}
            >
              Sync
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
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
          <Row justify="space-between" align="middle">
            <Col>
              <Space align="center" size={16}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BuildOutlined style={{ color: 'white', fontSize: '24px' }} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: '#1a202c' }}>
                    Companies
                  </Title>
                  <Text type="secondary">
                    Manage companies with TeamTailor integration
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refreshData}
                  loading={loading}
                  disabled={loading}
                >
                  Refresh
                </Button>
                {missingCompaniesCount > 0 && (
                  <Button
                    type="default"
                    icon={<SyncOutlined />}
                    onClick={handleBulkSync}
                    disabled={loading}
                  >
                    Sync Missing ({missingCompaniesCount})
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  disabled={loading}
                >
                  Add Company
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card
          style={{
            marginBottom: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
          styles={{ body: { padding: '20px' } }}
        >
          <Row gutter={16} align="middle">
            <Col flex="1">
              <Search
                placeholder="Search companies..."
                allowClear
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', maxWidth: '400px' }}
              />
            </Col>
            <Col>
              <Space>
                <Text>Status:</Text>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 140 }}
                >
                  <Option value="all">All Companies</Option>
                  <Option value="synced">Synced Only</Option>
                  <Option value="missing">Missing Only</Option>
                </Select>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Companies Table */}
        <Card
          style={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={columns}
            dataSource={filteredCompanies}
            rowKey={(record) => {
              const key = record.record_id || record.company_id || `${record.teamtailor_option_id || 'unknown'}-${record.created_at || 'no-date'}`;
              return String(key);
            }}
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} companies`,
            }}
            scroll={{ x: 1000 }}
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          />
        </Card>

        {/* Company Modal */}
        <CompanyModal
          visible={isModalVisible}
          mode={modalMode}
          company={selectedCompany}
          locations={locations}
          onCancel={() => setIsModalVisible(false)}
          onSuccess={async (data) => {
            setIsModalVisible(false);
            try {
              if (modalMode === 'create') {
                await createCompany(data);
                notification.success({
                  message: 'Company Created',
                  description: `${data.company_name} has been successfully created.`
                });
              } else if (selectedCompany) {
                await updateCompany(selectedCompany.company_id, data);
                notification.success({
                  message: 'Company Updated',
                  description: 'Changes have been saved successfully.'
                });
              }
            } catch (error) {
              notification.error({
                message: modalMode === 'create' ? 'Creation Failed' : 'Update Failed',
                description: error instanceof Error ? error.message : 'Please try again'
              });
            }
          }}
        />
      </div>
    </div>
  );
}