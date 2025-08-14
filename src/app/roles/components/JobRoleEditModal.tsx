import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  InputNumber,
  Switch,
  Divider,
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import {
  JobRoleWithStats,
  CreateJobRoleForm,
  JOB_LEVELS,
  COMMON_DEPARTMENTS,
  EMPLOYMENT_TYPES,
  CURRENCIES,
} from '@/types/job-roles';

const { TextArea } = Input;
const { Option } = Select;

interface JobRoleEditModalProps {
  visible: boolean;
  role: JobRoleWithStats | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateJobRoleForm) => Promise<void>;
  initialFormData?: Partial<CreateJobRoleForm> & {
    requirements?: string | string[];
    preferred_qualifications?: string | string[];
    responsibilities?: string | string[];
  };
}

/**
 * JobRoleEditModal Component
 * 
 * Dedicated modal for editing existing job roles
 * Follows Single Responsibility Principle - only handles job role editing form
 * Uses controlled component pattern for better testability
 */
const JobRoleEditModal: React.FC<JobRoleEditModalProps> = ({
  visible,
  role,
  loading = false,
  onClose,
  onSubmit,
  initialFormData,
}) => {
  const [form] = Form.useForm();

  // Initialize form when role changes
  useEffect(() => {
    if (role && visible && initialFormData) {
      form.setFieldsValue(initialFormData);
    }
  }, [role, visible, initialFormData, form]);

  const handleSubmit = async (values: CreateJobRoleForm) => {
    try {
      // Transform textarea values back to arrays
      const transformedValues: CreateJobRoleForm = {
        ...values,
        requirements: Array.isArray(values.requirements) 
          ? values.requirements
          : (values.requirements as string).split('\n').filter((r: string) => r.trim()),
        preferred_qualifications: Array.isArray(values.preferred_qualifications)
          ? values.preferred_qualifications
          : (values.preferred_qualifications as string).split('\n').filter((r: string) => r.trim()),
        responsibilities: Array.isArray(values.responsibilities)
          ? values.responsibilities
          : (values.responsibilities as string).split('\n').filter((r: string) => r.trim()),
      };

      await onSubmit(transformedValues);
      handleClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Edit form submission error:', error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const defaultInitialValues = {
    currency: 'USD',
    employment_type: 'full-time',
    level: 'mid',
    openings_count: 1,
    is_priority: false,
    publish_to_teamtailor: false,
    requirements: [],
    preferred_qualifications: [],
    responsibilities: []
  };

  return (
    <Modal
      title={
        <Space>
          <EditOutlined />
          <span>Edit Job Role</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={defaultInitialValues}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="title"
              label="Job Title"
              rules={[{ required: true, message: 'Please enter job title' }]}
            >
              <Input placeholder="e.g., Senior Software Engineer" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="department"
              label="Department"
              rules={[{ required: true, message: 'Please select department' }]}
            >
              <Select placeholder="Select department" showSearch>
                {COMMON_DEPARTMENTS.map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="level"
              label="Level"
              rules={[{ required: true, message: 'Please select level' }]}
            >
              <Select placeholder="Select level">
                {JOB_LEVELS.map(level => (
                  <Option key={level.value} value={level.value}>{level.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="employment_type"
              label="Employment Type"
              rules={[{ required: true, message: 'Please select employment type' }]}
            >
              <Select placeholder="Select employment type">
                {EMPLOYMENT_TYPES.map(type => (
                  <Option key={type.value} value={type.value}>{type.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Please enter location' }]}
            >
              <Input placeholder="e.g., New York, NY or Remote" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Job Description"
          rules={[{ required: true, message: 'Please enter job description' }]}
        >
          <TextArea 
            rows={4} 
            placeholder="Detailed description of the role, company, and what we're looking for..."
          />
        </Form.Item>

        <Form.Item
          name="requirements"
          label="Requirements"
          rules={[{ required: true, message: 'Please enter at least one requirement' }]}
          getValueFromEvent={(e) => e.target.value.split('\n').filter((r: string) => r.trim())}
          getValueProps={(value) => ({ value: Array.isArray(value) ? value.join('\n') : (value || '') })}
        >
          <TextArea 
            rows={4} 
            placeholder="Enter each requirement on a new line:&#10;• 5+ years of software development experience&#10;• Proficiency in React and TypeScript&#10;• Experience with modern CI/CD practices"
          />
        </Form.Item>

        <Form.Item
          name="preferred_qualifications"
          label="Preferred Qualifications (Optional)"
          getValueFromEvent={(e) => e.target.value.split('\n').filter((r: string) => r.trim())}
          getValueProps={(value) => ({ value: Array.isArray(value) ? value.join('\n') : (value || '') })}
        >
          <TextArea 
            rows={3} 
            placeholder="Enter each preferred qualification on a new line:&#10;• Experience with cloud platforms (AWS/GCP)&#10;• Leadership experience"
          />
        </Form.Item>

        <Form.Item
          name="responsibilities"
          label="Key Responsibilities"
          rules={[{ required: true, message: 'Please enter at least one responsibility' }]}
          getValueFromEvent={(e) => e.target.value.split('\n').filter((r: string) => r.trim())}
          getValueProps={(value) => ({ value: Array.isArray(value) ? value.join('\n') : (value || '') })}
        >
          <TextArea 
            rows={4} 
            placeholder="Enter each responsibility on a new line:&#10;• Design and develop scalable web applications&#10;• Collaborate with cross-functional teams&#10;• Mentor junior developers"
          />
        </Form.Item>

        <Divider>Compensation & Details</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="currency" label="Currency">
              <Select>
                {CURRENCIES.map(currency => (
                  <Option key={currency.value} value={currency.value}>{currency.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="salary_range_min" label="Minimum Salary">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="50000"
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="salary_range_max" label="Maximum Salary">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="80000"
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="openings_count"
              label="Number of Openings"
              rules={[{ required: true, message: 'Please enter number of openings' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={99}
                placeholder="1"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="is_priority" label="Priority Role" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="publish_to_teamtailor" label="Publish to TeamTailor" valuePropName="checked">
          <Switch />
        </Form.Item>

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <Space>
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Job Role
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default JobRoleEditModal;