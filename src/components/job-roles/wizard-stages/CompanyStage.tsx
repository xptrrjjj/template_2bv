'use client';

import React, { useState, useEffect } from 'react';
import {
  Form,
  Select,
  Button,
  Typography,
  Space,
  Card,
  Empty,
  Spin,
  Alert,
  App,
} from 'antd';
import {
  PlusOutlined,
  BuildOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { JobRoleWizardData } from '@/types/job-roles';
import { useCompanies } from '@/app/companies/hooks/useCompanies';
import type { MergedCompany } from '@/types/company';

const { Title, Text } = Typography;
const { Option } = Select;

interface CompanyStageProps {
  data: Partial<JobRoleWizardData>;
  onDataChange: (data: Partial<JobRoleWizardData>) => void;
  onValidChange: (valid: boolean) => void;
}

export default function CompanyStage({ data, onDataChange, onValidChange }: CompanyStageProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use the real companies service (DRY principle)
  const { companies, loading, error, refreshData } = useCompanies();
  
  useEffect(() => {
    if (error) {
      message.error(`Failed to load companies: ${error}`);
    }
  }, [error, message]);

  // Set initial form values
  useEffect(() => {
    if (data.company_id) {
      form.setFieldsValue({
        company_id: data.company_id,
      });
    }
  }, [data.company_id, form]);

  const handleCompanySelect = (companyId: string) => {
    const selectedCompany = companies.find(c => c.company_id === companyId);
    if (selectedCompany) {
      const updatedData = {
        company_id: selectedCompany.company_id,
        company_name: selectedCompany.company_name,
      };
      
      onDataChange(updatedData);
      onValidChange(true);
    }
  };

  const handleCreateNewCompany = () => {
    // Open companies page in new tab for creating new company
    window.open('/companies', '_blank');
    message.info('Opening companies page to create a new company. After creating, refresh this page.');
  };

  const filteredCompanies = companies.filter(company =>
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.location_name && company.location_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Update validation when company is selected
  useEffect(() => {
    const isValid = !!data.company_id;
    onValidChange(isValid);
  }, [data.company_id]); // Remove onValidChange from deps to prevent infinite loop

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <BuildOutlined style={{ color: 'white', fontSize: '32px' }} />
        </div>
        
        <Title level={3} style={{ margin: '0 0 8px 0' }}>
          Select Company
        </Title>
        
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Choose the company this job role belongs to
        </Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">Loading companies...</Text>
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(_, allValues) => {
            if (allValues.company_id) {
              handleCompanySelect(allValues.company_id);
            }
          }}
        >
          <Form.Item
            name="company_id"
            label={
              <Space>
                <Text strong>Company</Text>
                <Text type="secondary">({companies.length} companies available)</Text>
              </Space>
            }
            rules={[{ required: true, message: 'Please select a company' }]}
          >
            <Select
              placeholder="Search and select a company..."
              size="large"
              showSearch
              optionFilterProp="children"
              onSearch={setSearchTerm}
              optionLabelProp="label"
              notFoundContent={
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No companies found"
                />
              }
              popupRender={(menu) => (
                <>
                  {menu}
                  <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={handleCreateNewCompany}
                      style={{ width: '100%' }}
                    >
                      Create New Company
                    </Button>
                  </div>
                </>
              )}
            >
              {filteredCompanies.map((company) => (
                <Option 
                  key={company.company_id} 
                  value={company.company_id}
                  label={company.company_name}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{company.company_name}</div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '1px' }}>
                        {company.industry} • {company.location_name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {company.teamtailor_option_id && (
                        <span 
                          style={{
                            background: '#e6f7ff',
                            color: '#1890ff',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            fontSize: '9px',
                            fontWeight: '500'
                          }}
                        >
                          TT
                        </span>
                      )}
                      {company.sync_status === 'synced' && (
                        <span 
                          style={{
                            background: '#f6ffed',
                            color: '#52c41a',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            fontSize: '9px',
                            fontWeight: '500'
                          }}
                        >
                          ✓
                        </span>
                      )}
                      {company.sync_status === 'missing' && (
                        <span style={{ fontSize: '9px', color: '#ff4d4f' }}>⚠</span>
                      )}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {data.company_id && (
            <Card 
              size="small" 
              style={{ 
                background: '#f6ffed', 
                border: '1px solid #b7eb8f',
                marginTop: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BuildOutlined style={{ color: '#52c41a' }} />
                <div>
                  <Text strong style={{ color: '#52c41a' }}>
                    Selected: {data.company_name}
                  </Text>
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Ready to proceed to basic information
                    </Text>
                  </div>
                </div>
                <ArrowRightOutlined style={{ color: '#52c41a', marginLeft: 'auto' }} />
              </div>
            </Card>
          )}
        </Form>
      )}

      {companies.length === 0 && !loading && (
        <Alert
          message="No Companies Available"
          description="You need to create at least one company before creating job roles."
          type="warning"
          showIcon
          action={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateNewCompany}
            >
              Create Company
            </Button>
          }
          style={{ marginTop: '24px' }}
        />
      )}
    </div>
  );
}