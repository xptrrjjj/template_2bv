'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, Typography, App } from 'antd';
import { SearchOutlined, ClearOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { apiClient } from '@/services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface TestResult {
  operation: string;
  timestamp: string;
  request: unknown;
  response: unknown;
  status: 'success' | 'error';
  error?: string;
}

interface DatastoreRetrieveFormProps {
  onResult: (result: TestResult) => void;
}

const retrieveTemplates = {
  all_records: {
    identifier: 'recruitment_tool',
    filters: {}
  },
  by_status: {
    identifier: 'recruitment_tool',
    filters: {
      status: 'active'
    }
  },
  by_position: {
    identifier: 'recruitment_tool',
    filters: {
      position: 'Senior Developer'
    }
  },
  by_record_id: {
    identifier: 'recruitment_tool',
    filters: {
      record_id: 'candidate_001'
    }
  },
  multiple_filters: {
    identifier: 'recruitment_tool',
    filters: {
      status: 'active',
      experience_years: 5
    }
  }
};

export const DatastoreRetrieveForm: React.FC<DatastoreRetrieveFormProps> = ({ onResult }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { notification } = App.useApp();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const requestData = {
        identifier: values.identifier,
        filters: values.filters ? JSON.parse(values.filters) : {}
      };

      const response = await apiClient.datastoreRetrieve(requestData);
      
      onResult({
        operation: 'RETRIEVE Operation',
        timestamp: new Date().toISOString(),
        request: requestData,
        response,
        status: 'success'
      });

      notification.success({
        message: 'Retrieve Successful',
        description: `Found ${response.data?.length || 0} records`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      onResult({
        operation: 'RETRIEVE Operation',
        timestamp: new Date().toISOString(),
        request: {
          identifier: values.identifier,
          filters: values.filters
        },
        response: null,
        status: 'error',
        error: errorMessage
      });

      notification.error({
        message: 'Retrieve Failed',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (templateKey: keyof typeof retrieveTemplates) => {
    const template = retrieveTemplates[templateKey];
    form.setFieldsValue({
      identifier: template.identifier,
      filters: JSON.stringify(template.filters, null, 2)
    });
  };

  const clearForm = () => {
    form.resetFields();
  };

  return (
    <Card
      title={
        <Space>
          <SearchOutlined style={{ color: '#667eea' }} />
          <Text strong style={{ fontSize: '16px', color: '#1a202c' }}>
            Datastore Retrieve
          </Text>
        </Space>
      }
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          identifier: 'recruitment_tool',
          filters: '{}'
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label={<Text strong style={{ color: '#1a202c' }}>Identifier</Text>}
          name="identifier"
          rules={[{ required: true, message: 'Please enter identifier' }]}
        >
          <Input placeholder="e.g., recruitment_tool" />
        </Form.Item>

        <Form.Item
          label={<Text strong style={{ color: '#1a202c' }}>Filters (JSON)</Text>}
          name="filters"
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                try {
                  JSON.parse(value);
                  return Promise.resolve();
                } catch {
                  return Promise.reject(new Error('Invalid JSON format'));
                }
              }
            }
          ]}
          help="Leave empty {} to retrieve all records"
        >
          <TextArea
            rows={10}
            placeholder='Enter JSON filters... e.g., { "status": "active" }'
            style={{ fontFamily: 'monospace', fontSize: '13px' }}
          />
        </Form.Item>

        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text strong style={{ color: '#1a202c', marginBottom: '8px', display: 'block' }}>
              Quick Templates:
            </Text>
            <Space wrap>
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => loadTemplate('all_records')}
              >
                All Records
              </Button>
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => loadTemplate('by_status')}
              >
                By Status
              </Button>
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => loadTemplate('by_position')}
              >
                By Position
              </Button>
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => loadTemplate('by_record_id')}
              >
                By Record ID
              </Button>
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={() => loadTemplate('multiple_filters')}
              >
                Multiple Filters
              </Button>
            </Space>
          </div>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button icon={<ClearOutlined />} onClick={clearForm}>
              Clear
            </Button>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              htmlType="submit"
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none'
              }}
            >
              Retrieve
            </Button>
          </Space>
        </Space>
      </Form>
    </Card>
  );
};