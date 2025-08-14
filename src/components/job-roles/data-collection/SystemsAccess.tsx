'use client';

import React from 'react';
import { Form, Input, Select, Button, Row, Col, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MICROSOFT_APPS = [
  'Word', 'Excel', 'PowerPoint', 'Outlook', 'Teams', 'OneDrive', 
  'SharePoint', 'OneNote', 'Power BI', 'Project', 'Visio'
];

interface SystemsAccessProps {
  microsoftApps: string[];
  additionalTools: string[];
  onMicrosoftAppsChange: (apps: string[]) => void;
  onAdditionalToolsChange: (tools: string[]) => void;
}

/**
 * SystemsAccess Component
 * 
 * Handles systems and access requirements configuration
 * Follows Single Responsibility Principle - only manages systems/access setup
 */
const SystemsAccess: React.FC<SystemsAccessProps> = ({
  microsoftApps,
  additionalTools,
  onMicrosoftAppsChange,
  onAdditionalToolsChange,
}) => {
  const updateTool = (index: number, value?: string) => {
    if (value !== undefined) {
      const newTools = [...additionalTools];
      newTools[index] = value;
      onAdditionalToolsChange(newTools);
    } else {
      // Remove item
      onAdditionalToolsChange(additionalTools.filter((_, i) => i !== index));
    }
  };

  const addTool = () => {
    onAdditionalToolsChange([...additionalTools, '']);
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="device_provided"
            label="Device Provided"
            rules={[{ required: true, message: 'Please specify if device is provided' }]}
          >
            <Select placeholder="Select option">
              <Option value="yes">Yes</Option>
              <Option value="no">No</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="microsoft_365_required"
            label="Microsoft 365 License Required"
            rules={[{ required: true, message: 'Please specify if M365 is required' }]}
          >
            <Select placeholder="Select option">
              <Option value="yes">Yes</Option>
              <Option value="no">No</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Microsoft 365 Apps Required">
        <Select
          mode="multiple"
          placeholder="Select required Microsoft apps"
          value={microsoftApps}
          onChange={onMicrosoftAppsChange}
          style={{ width: '100%' }}
        >
          {MICROSOFT_APPS.map(app => (
            <Option key={app} value={app}>{app}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="sharepoint_requirements"
        label="SharePoint Site Access Requirements"
      >
        <TextArea rows={3} placeholder="Describe specific SharePoint access requirements..." />
      </Form.Item>

      <div style={{ marginBottom: '16px' }}>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Additional Tools or Software Required</Text>
        {additionalTools.map((tool, index) => (
          <div key={index} style={{ display: 'flex', marginBottom: '8px' }}>
            <Input
              value={tool}
              onChange={(e) => updateTool(index, e.target.value)}
              placeholder="Enter tool/software name"
              style={{ marginRight: '8px' }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => updateTool(index)}
            />
          </div>
        ))}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addTool}
        >
          Add Tool/Software
        </Button>
      </div>
    </div>
  );
};

export default SystemsAccess;