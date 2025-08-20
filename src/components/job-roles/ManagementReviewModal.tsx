'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Button,
  Space,
  Tag,
  App,
  Alert,
  Tabs,
  Switch,
  Input,
  Select,
  Card,
  Checkbox,
  Typography,
  Divider,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Rate,
} from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { 
  JobRoleWithStats, 
  ManagementReviewData
} from '@/types/job-roles';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

interface ManagementReviewModalProps {
  role: JobRoleWithStats;
  visible: boolean;
  onClose: () => void;
  onSave: (data: ManagementReviewData) => void;
  loading?: boolean;
}

/**
 * ManagementReviewModal Component
 * 
 * Allows management to review and approve job roles
 * Follows SOLID principles and integrates with management approval workflow
 */
const ManagementReviewModal: React.FC<ManagementReviewModalProps> = ({
  role,
  visible,
  onClose,
  onSave,
  loading = false
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('review');
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected' | 'requires_changes'>('pending');

  // Initialize form with existing data
  useEffect(() => {
    if (role.management_review && visible) {
      const data = role.management_review;
      
      form.setFieldsValue({
        review_status: data.review_status,
        reviewer_name: data.reviewer_name || '',
        reviewer_email: data.reviewer_email || '',
        review_notes: data.review_notes || '',
        requested_changes: data.requested_changes?.join('\n') || '',
        priority_level: data.priority_level || 'normal',
        estimated_approval_timeline: data.estimated_approval_timeline || '',
        
        // Budget approval
        target_budget_approved: data.approved_budget?.target_budget_approved || false,
        maximum_budget_approved: data.approved_budget?.maximum_budget_approved || false,
        approved_budget_amount: data.approved_budget?.approved_budget_amount,
        budget_approval_notes: data.approved_budget?.budget_approval_notes || '',
        
        // Hiring manager approval
        hiring_manager_approved: data.hiring_manager_approval?.approved || false,
        hiring_manager_name: data.hiring_manager_approval?.hiring_manager_name || '',
        hiring_manager_approval_notes: data.hiring_manager_approval?.approval_notes || '',
        
        // Compliance checklist
        budget_approved: data.compliance_checklist?.budget_approved || false,
        headcount_approved: data.compliance_checklist?.headcount_approved || false,
        department_approval: data.compliance_checklist?.department_approval || false,
        legal_review_needed: data.compliance_checklist?.legal_review_needed || false,
        diversity_requirements_met: data.compliance_checklist?.diversity_requirements_met || false,
      });
      
      setReviewStatus(data.review_status);
    } else if (visible) {
      // Initialize with defaults for new management review
      form.setFieldsValue({
        review_status: 'pending',
        priority_level: 'normal',
        target_budget_approved: false,
        maximum_budget_approved: false,
        hiring_manager_approved: false,
        budget_approved: false,
        headcount_approved: false,
        department_approval: false,
        legal_review_needed: false,
        diversity_requirements_met: false,
      });
      setReviewStatus('pending');
    }
  }, [role.management_review, visible, form]);

  const handleSubmit = async (values: any) => {
    try {
      // Parse requested changes from textarea
      const requestedChanges = values.requested_changes 
        ? values.requested_changes.split('\n').filter((change: string) => change.trim())
        : [];

      const managementReviewData: ManagementReviewData = {
        review_status: values.review_status,
        reviewer_name: values.reviewer_name,
        reviewer_email: values.reviewer_email,
        review_notes: values.review_notes,
        requested_changes: requestedChanges,
        priority_level: values.priority_level,
        estimated_approval_timeline: values.estimated_approval_timeline,
        
        approved_budget: {
          target_budget_approved: values.target_budget_approved,
          maximum_budget_approved: values.maximum_budget_approved,
          approved_budget_amount: values.approved_budget_amount,
          budget_approval_notes: values.budget_approval_notes,
        },
        
        hiring_manager_approval: {
          approved: values.hiring_manager_approved,
          hiring_manager_name: values.hiring_manager_name,
          approval_date: values.hiring_manager_approved ? new Date().toISOString() : undefined,
          approval_notes: values.hiring_manager_approval_notes,
        },
        
        compliance_checklist: {
          budget_approved: values.budget_approved,
          headcount_approved: values.headcount_approved,
          department_approval: values.department_approval,
          legal_review_needed: values.legal_review_needed,
          diversity_requirements_met: values.diversity_requirements_met,
        },
        
        completion_metadata: {
          reviewed_at: new Date().toISOString(),
          reviewed_by: values.reviewer_name || 'current-user',
          review_duration_hours: 1, // Default estimate
          escalation_required: values.review_status === 'requires_changes',
        }
      };

      onSave(managementReviewData);
      message.success('Management review completed successfully!');
    } catch (error) {
      console.error('Error saving management review:', error);
      message.error('Failed to save management review');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'requires_changes': return 'orange';
      case 'pending': return 'blue';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleOutlined />;
      case 'rejected': return <CloseCircleOutlined />;
      case 'requires_changes': return <ExclamationCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      default: return <AuditOutlined />;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <AuditOutlined />
          <span>Management Review: {role.title}</span>
          <Tag color="purple">Management Review Stage</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1400}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          onClick={() => form.submit()}
          loading={loading}
          icon={<CheckCircleOutlined />}
        >
          Complete Management Review
        </Button>
      ]}
      styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
    >
      <Alert
        message="Management Review Process"
        description="Review the job role details, approve budgets, ensure compliance, and provide management approval to proceed to publication."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'review',
              label: (
                <span>
                  <AuditOutlined />
                  Review & Decision
                </span>
              ),
              children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card title="Review Status" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="review_status"
                          label="Review Decision"
                          rules={[{ required: true, message: 'Please select a review decision' }]}
                        >
                          <Select
                            value={reviewStatus}
                            onChange={setReviewStatus}
                            size="large"
                          >
                            <Option value="pending">
                              <Space>
                                <ClockCircleOutlined />
                                Pending Review
                              </Space>
                            </Option>
                            <Option value="approved">
                              <Space>
                                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                Approved
                              </Space>
                            </Option>
                            <Option value="requires_changes">
                              <Space>
                                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                                Requires Changes
                              </Space>
                            </Option>
                            <Option value="rejected">
                              <Space>
                                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                                Rejected
                              </Space>
                            </Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="priority_level"
                          label="Priority Level"
                        >
                          <Select>
                            <Option value="urgent">🔴 Urgent</Option>
                            <Option value="high">🟠 High</Option>
                            <Option value="normal">🟡 Normal</Option>
                            <Option value="low">🟢 Low</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="review_notes"
                      label="Review Notes & Comments"
                    >
                      <TextArea 
                        rows={4}
                        placeholder="Provide detailed feedback, comments, or reasoning for the review decision..."
                      />
                    </Form.Item>

                    {(reviewStatus === 'requires_changes' || reviewStatus === 'rejected') && (
                      <Form.Item
                        name="requested_changes"
                        label="Requested Changes (one per line)"
                        rules={reviewStatus === 'requires_changes' ? [{ required: true, message: 'Please specify required changes' }] : []}
                      >
                        <TextArea 
                          rows={4}
                          placeholder="List specific changes required, one per line..."
                        />
                      </Form.Item>
                    )}

                    <Form.Item
                      name="estimated_approval_timeline"
                      label="Estimated Approval Timeline"
                    >
                      <Input placeholder="e.g., 2-3 business days, 1 week..." />
                    </Form.Item>
                  </Card>

                  <Card title="Reviewer Information" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="reviewer_name"
                          label="Reviewer Name"
                          rules={[{ required: true, message: 'Please enter reviewer name' }]}
                        >
                          <Input prefix={<UserOutlined />} placeholder="Your name" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="reviewer_email"
                          label="Reviewer Email"
                          rules={[
                            { required: true, message: 'Please enter reviewer email' },
                            { type: 'email', message: 'Please enter a valid email' }
                          ]}
                        >
                          <Input placeholder="your.email@company.com" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                </Space>
              )
            },
            {
              key: 'budget',
              label: (
                <span>
                  <DollarOutlined />
                  Budget Approval
                </span>
              ),
              children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card title="Budget Information" size="small">
                    <Row gutter={16}>
                      <Col span={8}>
                        <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '6px' }}>
                          <Text strong>Target Budget</Text>
                          <div style={{ fontSize: '24px', color: '#1890ff' }}>
                            ${role.target_budget_usd?.toLocaleString() || 'Not set'}
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '6px' }}>
                          <Text strong>Maximum Budget</Text>
                          <div style={{ fontSize: '24px', color: '#fa8c16' }}>
                            ${role.maximum_budget_usd?.toLocaleString() || 'Not set'}
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '6px' }}>
                          <Text strong>Resources</Text>
                          <div style={{ fontSize: '24px', color: '#52c41a' }}>
                            {role.number_of_resources || role.openings_count} positions
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  <Card title="Budget Approvals" size="small">
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Form.Item name="target_budget_approved" valuePropName="checked">
                        <Checkbox>
                          <Text strong>Approve Target Budget</Text> 
                          <Text type="secondary"> (${role.target_budget_usd?.toLocaleString() || 'Not set'})</Text>
                        </Checkbox>
                      </Form.Item>

                      <Form.Item name="maximum_budget_approved" valuePropName="checked">
                        <Checkbox>
                          <Text strong>Approve Maximum Budget</Text> 
                          <Text type="secondary"> (${role.maximum_budget_usd?.toLocaleString() || 'Not set'})</Text>
                        </Checkbox>
                      </Form.Item>

                      <Divider style={{ margin: '16px 0' }} />

                      <Form.Item
                        name="approved_budget_amount"
                        label="Final Approved Budget Amount (if different)"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                          placeholder="Enter approved amount..."
                        />
                      </Form.Item>

                      <Form.Item
                        name="budget_approval_notes"
                        label="Budget Approval Notes"
                      >
                        <TextArea 
                          rows={3}
                          placeholder="Any specific notes about budget approval, conditions, or limitations..."
                        />
                      </Form.Item>
                    </Space>
                  </Card>

                  <Card title="Hiring Manager Approval" size="small">
                    <Form.Item name="hiring_manager_approved" valuePropName="checked">
                      <Checkbox>
                        <Text strong>Hiring Manager Approval Obtained</Text>
                      </Checkbox>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.hiring_manager_approved !== currentValues.hiring_manager_approved
                      }
                    >
                      {({ getFieldValue }) =>
                        getFieldValue('hiring_manager_approved') ? (
                          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <Form.Item
                              name="hiring_manager_name"
                              label="Hiring Manager Name"
                              rules={[{ required: true, message: 'Please enter hiring manager name' }]}
                            >
                              <Input placeholder="Name of the hiring manager" />
                            </Form.Item>

                            <Form.Item
                              name="hiring_manager_approval_notes"
                              label="Approval Notes"
                            >
                              <TextArea 
                                rows={2}
                                placeholder="Any notes or conditions from the hiring manager..."
                              />
                            </Form.Item>
                          </Space>
                        ) : null
                      }
                    </Form.Item>
                  </Card>
                </Space>
              )
            },
            {
              key: 'compliance',
              label: (
                <span>
                  <FileTextOutlined />
                  Compliance
                </span>
              ),
              children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card title="Compliance Checklist" size="small">
                    <Alert
                      message="Compliance Requirements"
                      description="Ensure all compliance requirements are met before approving the role for publication."
                      type="warning"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />

                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <Form.Item name="budget_approved" valuePropName="checked">
                        <Checkbox>
                          <Text strong>Budget Approved by Finance Team</Text>
                        </Checkbox>
                      </Form.Item>

                      <Form.Item name="headcount_approved" valuePropName="checked">
                        <Checkbox>
                          <Text strong>Headcount Approved by HR</Text>
                        </Checkbox>
                      </Form.Item>

                      <Form.Item name="department_approval" valuePropName="checked">
                        <Checkbox>
                          <Text strong>Department Head Approval Obtained</Text>
                        </Checkbox>
                      </Form.Item>

                      <Form.Item name="legal_review_needed" valuePropName="checked">
                        <Checkbox>
                          <Text strong>Legal Review Completed (if required)</Text>
                        </Checkbox>
                      </Form.Item>

                      <Form.Item name="diversity_requirements_met" valuePropName="checked">
                        <Checkbox>
                          <Text strong>Diversity & Inclusion Requirements Met</Text>
                        </Checkbox>
                      </Form.Item>
                    </Space>
                  </Card>

                  <Card title="Role Summary" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Paragraph>
                          <Text strong>Title: </Text>
                          <Text>{role.title}</Text>
                        </Paragraph>
                        <Paragraph>
                          <Text strong>Department: </Text>
                          <Text>{role.department}</Text>
                        </Paragraph>
                        <Paragraph>
                          <Text strong>Level: </Text>
                          <Text>{role.level}</Text>
                        </Paragraph>
                        <Paragraph>
                          <Text strong>Employment Type: </Text>
                          <Text>{role.employment_type}</Text>
                        </Paragraph>
                      </Col>
                      <Col span={12}>
                        <Paragraph>
                          <Text strong>Location: </Text>
                          <Text>{role.location}</Text>
                        </Paragraph>
                        <Paragraph>
                          <Text strong>Openings: </Text>
                          <Text>{role.openings_count}</Text>
                        </Paragraph>
                        <Paragraph>
                          <Text strong>Priority: </Text>
                          <Tag color={role.is_priority ? 'red' : 'default'}>
                            {role.is_priority ? 'High Priority' : 'Normal'}
                          </Tag>
                        </Paragraph>
                        <Paragraph>
                          <Text strong>Created: </Text>
                          <Text>{dayjs(role.created_at).format('MMM DD, YYYY')}</Text>
                        </Paragraph>
                      </Col>
                    </Row>
                  </Card>
                </Space>
              )
            }
          ]}
        />
      </Form>
    </Modal>
  );
};

export default ManagementReviewModal;