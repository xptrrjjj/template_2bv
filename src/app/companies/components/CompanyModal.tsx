'use client';

import React, { useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space,
  Typography 
} from 'antd';
import { MergedCompany, CreateCompanyForm, COMPANY_SOURCES } from '@/types/company';

const { Text } = Typography;
const { Option } = Select;

interface LocationOption {
  id: string;
  name: string;
  city?: string;
  country?: string;
}

interface CompanyModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  company?: MergedCompany;
  locations: LocationOption[];
  onCancel: () => void;
  onSuccess: (data: CreateCompanyForm) => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  visible,
  mode,
  company,
  locations,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();

  // Initialize form with company data when editing
  useEffect(() => {
    if (visible && mode === 'edit' && company) {
      form.setFieldsValue({
        company_name: company.company_name,
        industry: company.industry,
        website: company.website,
        contact_name: company.contact_name,
        source: company.source,
        teamtailor_location_id: company.teamtailor_location_id,
      });
    } else if (visible && mode === 'create') {
      form.resetFields();
    }
  }, [visible, mode, company, form]);

  // Handle form submission
  const handleSubmit = async (values: {
    company_name: string;
    industry: string;
    website?: string;
    contact_name: string;
    source: string;
    teamtailor_location_id: string;
  }) => {
    // Find the selected location to get the display name
    const selectedLocation = locations.find(loc => loc.id === values.teamtailor_location_id);
    
    const formData: CreateCompanyForm = {
      company_name: values.company_name,
      industry: values.industry,
      website: values.website || '',
      contact_name: values.contact_name,
      source: values.source,
      teamtailor_location_id: values.teamtailor_location_id,
      location_name: selectedLocation?.name || '',
    };

    onSuccess(formData);
  };

  // Handle cancel
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const title = mode === 'create' ? 'Add New Company' : 'Edit Company';

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: '24px' }}
      >
        {/* Company Name */}
        <Form.Item
          label="Company Name"
          name="company_name"
          rules={[
            { required: true, message: 'Company name is required' },
            { max: 100, message: 'Company name must be less than 100 characters' }
          ]}
          extra={mode === 'edit' ? "Changes will update TeamTailor" : "Will be stored in TeamTailor"}
        >
          <Input placeholder="Enter company name" />
        </Form.Item>

        {/* Industry */}
        <Form.Item
          label="Industry"
          name="industry"
          rules={[
            { required: true, message: 'Industry is required' },
            { max: 100, message: 'Industry must be less than 100 characters' }
          ]}
          extra="Stored in datastore only"
        >
          <Input placeholder="e.g., Technology, Healthcare, Finance" />
        </Form.Item>

        {/* Location */}
        <Form.Item
          label="Location"
          name="teamtailor_location_id"
          rules={[{ required: true, message: 'Location is required' }]}
          extra="TeamTailor location reference"
        >
          <Select
            placeholder="Select location"
            showSearch
            filterOption={(input, option) =>
              option && option.children ? 
                option.children.toString().toLowerCase().includes(input.toLowerCase()) :
                false
            }
            loading={locations.length === 0}
          >
            {locations.map(location => (
              <Option key={location.id} value={location.id}>
                {location.name}
                {location.city && `, ${location.city}`}
                {location.country && ` (${location.country})`}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Contact Name */}
        <Form.Item
          label="Contact Name"
          name="contact_name"
          rules={[
            { required: true, message: 'Contact name is required' },
            { max: 100, message: 'Contact name must be less than 100 characters' }
          ]}
          extra="Primary contact person (datastore only)"
        >
          <Input placeholder="Primary contact person" />
        </Form.Item>

        {/* Source */}
        <Form.Item
          label="Source"
          name="source"
          rules={[{ required: true, message: 'Source is required' }]}
          extra="How you found this company (datastore only)"
        >
          <Select placeholder="How did you find this company?">
            {COMPANY_SOURCES.map(source => (
              <Option key={source} value={source}>
                {source}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Website */}
        <Form.Item
          label="Website"
          name="website"
          rules={[
            { type: 'url', message: 'Please enter a valid URL' },
            { max: 200, message: 'Website URL must be less than 200 characters' }
          ]}
          extra="Company website (optional, datastore only)"
        >
          <Input placeholder="https://company.com" />
        </Form.Item>

        {/* Form Actions */}
        <Form.Item style={{ marginBottom: 0, marginTop: '32px' }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {mode === 'create' ? 'Create Company' : 'Update Company'}
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Data Storage Info */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '8px',
        }}
      >
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>Data Storage:</strong><br />
          • Company Name: Stored in TeamTailor (source of truth)<br />
          • Location: Reference to TeamTailor location<br />
          • Other fields: Stored in datastore only
        </Text>
      </div>
    </Modal>
  );
};