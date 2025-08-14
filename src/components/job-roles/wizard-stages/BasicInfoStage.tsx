'use client';

import React, { useState, memo, useMemo, useCallback } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Typography,
  Button,
  Spin,
  App,
  Modal,
  Space,
} from 'antd';
import {
  InfoCircleOutlined,
  DollarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  JobRoleWizardData,
  COMMON_DEPARTMENTS,
  JOB_LEVELS,
  EMPLOYMENT_TYPES,
  CURRENCIES,
  CONTRACT_DURATIONS,
  TIME_ZONES,
} from '@/types/job-roles';
import { useDepartments } from '@/hooks/useDepartments';
import { useBasicInfoForm } from '@/hooks/useWizardForm';
import WizardStageLayout, { STAGE_GRADIENTS } from '@/components/job-roles/common/WizardStageLayout';
import FormFieldGroup from '@/components/job-roles/common/FormFieldGroup';
import { USDInput, NumberInput } from '@/components/job-roles/common/CurrencyInput';
import { MinimumExperienceInput } from '@/components/job-roles/common/ExperienceInput';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface BasicInfoStageProps {
  data: Partial<JobRoleWizardData>;
  onDataChange: (data: Partial<JobRoleWizardData>) => void;
  onValidChange: (valid: boolean) => void;
}

const BasicInfoStage = memo<BasicInfoStageProps>(function BasicInfoStage({ data, onDataChange, onValidChange }) {
  const { message } = App.useApp();
  const [createDepartmentModal, setCreateDepartmentModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  
  // Use consolidated form hook for state management
  const { form, handleFormChange } = useBasicInfoForm({
    data,
    onDataChange,
    onValidChange,
  });
  
  // Use TeamTailor departments hook
  const { departments, loading: departmentsLoading, error: departmentsError, refreshDepartments, createDepartment } = useDepartments();

  // Memoized department options to prevent re-rendering Select dropdown
  const departmentOptions = useMemo(() => {
    if (!departmentsError && departments.length > 0) {
      return departments.map(dept => (
        <Option key={dept.id} value={dept.id}>{dept.name}</Option>
      ));
    }
    
    // Standard departments fallback
    if (departmentsError || (!departmentsLoading && departments.length === 0)) {
      return COMMON_DEPARTMENTS.map(dept => (
        <Option key={dept} value={dept}>{dept}</Option>
      ));
    }
    
    return [];
  }, [departments, departmentsError, departmentsLoading]);

  // Memoized select placeholder to prevent re-renders
  const departmentPlaceholder = useMemo(() => {
    if (departmentsLoading) return "Loading departments...";
    if (departmentsError) return "Select department (using defaults)";
    return "Select department";
  }, [departmentsLoading, departmentsError]);

  // Memoized currency options
  const currencyOptions = useMemo(() => 
    CURRENCIES.map(currency => (
      <Option key={currency.value} value={currency.value}>
        {currency.label}
      </Option>
    )), []);

  // Memoized job level options
  const jobLevelOptions = useMemo(() =>
    JOB_LEVELS.map(level => (
      <Option key={level.value} value={level.value}>
        {level.label}
      </Option>
    )), []);

  // Memoized employment type options
  const employmentTypeOptions = useMemo(() =>
    EMPLOYMENT_TYPES.map(type => (
      <Option key={type.value} value={type.value}>
        {type.label}
      </Option>
    )), []);

  // Memoized contract duration options
  const contractDurationOptions = useMemo(() =>
    CONTRACT_DURATIONS.map(duration => (
      <Option key={duration.value} value={duration.value}>
        {duration.label}
      </Option>
    )), []);

  // Memoized time zone options
  const timeZoneOptions = useMemo(() =>
    TIME_ZONES.map(tz => (
      <Option key={tz.value} value={tz.value}>
        {tz.label}
      </Option>
    )), []);

  // Handle departments error or empty list (simplified)
  React.useEffect(() => {
    if (departmentsError) {
      console.warn('TeamTailor departments error:', departmentsError);
      // Show fallback message for actual errors only
      if (!departmentsError.toLowerCase().includes('failed') && !departmentsError.toLowerCase().includes('not available')) {
        message.warning('TeamTailor departments unavailable. Using standard list.', 4);
      }
    } else if (!departmentsLoading && departments.length === 0) {
      // TeamTailor is working but no departments exist yet - this is normal for new accounts
      console.log('TeamTailor connected: No departments found. Ready to create first department.');
    }
  }, [departmentsError, departmentsLoading, departments.length, message]);

  // Memoized department creation handler
  const handleCreateDepartment = useCallback(async () => {
    if (!newDepartmentName.trim()) {
      message.error('Please enter a department name');
      return;
    }
    
    try {
      setCreatingDepartment(true);
      const newDept = await createDepartment({ name: newDepartmentName.trim() });
      message.success(`Department "${newDept.name}" created successfully`);
      setCreateDepartmentModal(false);
      setNewDepartmentName('');
      
      // Set the newly created department as selected
      form.setFieldValue('department', newDept.id);
      const updatedData = { ...data, department: newDept.id };
      onDataChange(updatedData);
    } catch (error) {
      console.error('Failed to create department:', error);
      message.error('Failed to create department. Please try again.');
    } finally {
      setCreatingDepartment(false);
    }
  }, [newDepartmentName, createDepartment, message, form, data, onDataChange]);

  // Memoized modal handlers
  const handleModalCancel = useCallback(() => {
    setCreateDepartmentModal(false);
    setNewDepartmentName('');
  }, []);

  const handleNewDepartmentNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewDepartmentName(e.target.value);
  }, []);

  return (
    <WizardStageLayout
      icon={<InfoCircleOutlined />}
      title="Basic Information"
      description="Provide the essential details for this job role"
      gradientColors={STAGE_GRADIENTS.basicInfo}
    >

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
      >
        {/* General Information Section */}
        <FormFieldGroup
          icon={<UserOutlined />}
          title="General Information"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label={
                  <Space>
                    <Text>Department</Text>
                    {departmentsLoading && <Spin size="small" />}
                    {departmentsError && <Text type="secondary" style={{ fontSize: '11px' }}>(Standard)</Text>}
                    {!departmentsLoading && !departmentsError && departments.length === 0 && 
                      <Text type="secondary" style={{ fontSize: '11px' }}>(Empty - Create First)</Text>
                    }
                    {!departmentsLoading && !departmentsError && (
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<ReloadOutlined />} 
                        onClick={refreshDepartments}
                        style={{ padding: 0, height: 'auto' }}
                      />
                    )}
                  </Space>
                }
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select 
                  placeholder={departmentPlaceholder}
                  showSearch
                  loading={departmentsLoading}
                  disabled={departmentsLoading}
                  optionFilterProp="children"
                  popupRender={menu => (
                    <>
                      {menu}
                      {!departmentsError && (
                        <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => setCreateDepartmentModal(true)}
                            style={{ width: '100%' }}
                          >
                            {departments.length === 0 ? 'Create First Department' : 'Create New Department'}
                          </Button>
                        </div>
                      )}
                      {departmentsError && (
                        <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Using standard department list
                          </Text>
                        </div>
                      )}
                    </>
                  )}
                >
                  {departmentOptions}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="company_name"
                label="Client"
                initialValue={data.company_name}
              >
                <Input 
                  disabled 
                  placeholder="Selected company will appear here" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="account_exec"
                label="Account Executive"
              >
                <Input placeholder="Account executive contact details" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date_of_request"
                label="Date of Request"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Select request date"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="desired_start_date"
                label="Desired Start Date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="Select desired start date"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contract_duration"
                label="Contract Duration"
                rules={[{ required: true, message: 'Please select duration' }]}
              >
                <Select placeholder="Select duration">
                  {contractDurationOptions}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </FormFieldGroup>

        {/* Role Requirements Section */}
        <FormFieldGroup
          icon={<EnvironmentOutlined />}
          title="Role Requirements"
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
                name="number_of_resources"
                label="Number of Resources Required"
                rules={[{ required: true, message: 'Please enter number' }]}
              >
                <InputNumber 
                  min={1} 
                  max={99} 
                  style={{ width: '100%' }}
                  placeholder="1"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="level"
                label="Experience Level"
                rules={[{ required: true, message: 'Please select level' }]}
              >
                <Select placeholder="Select level">
                  {jobLevelOptions}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="employment_type"
                label="Employment Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select placeholder="Select type">
                  {employmentTypeOptions}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="desired_minimum_years_experience"
                label="Minimum Years Experience"
                rules={[{ required: true, message: 'Please enter years' }]}
              >
                <MinimumExperienceInput placeholder="3" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="e.g., San Francisco, CA or Remote" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="location_type"
                label="Location Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select>
                  <Option value="remote">Remote</Option>
                  <Option value="hybrid">Hybrid</Option>
                  <Option value="on-site">On-site</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="time_zone"
                label="Time Zone"
              >
                <Select placeholder="Select time zone">
                  {timeZoneOptions}
                </Select>
              </Form.Item>
            </Col>
          </Row>

        </FormFieldGroup>

        {/* Budget & Compensation Section */}
        <FormFieldGroup
          icon={<DollarOutlined />}
          title="Budget & Compensation"
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: 'Please select currency' }]}
              >
                <Select>
                  {currencyOptions}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="target_budget_usd"
                label="Target Budget (USD)"
              >
                <USDInput placeholder="50000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maximum_budget_usd"
                label="Maximum Budget (USD)"
              >
                <USDInput placeholder="80000" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="target_budget_local"
                label="Target Budget (Local)"
              >
                <NumberInput placeholder="Local currency amount" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maximum_budget_local"
                label="Maximum Budget (Local)"
              >
                <NumberInput placeholder="Local currency amount" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="target_rate_usd"
                label="Target Rate (USD)"
              >
                <USDInput placeholder="Hourly/daily rate" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="budget_notes"
            label="Budget Notes"
          >
            <TextArea 
              rows={3}
              placeholder="Additional budget considerations or notes..."
            />
          </Form.Item>
        </FormFieldGroup>
      </Form>

      {/* Create Department Modal */}
      <Modal
        title="Create New Department"
        open={createDepartmentModal}
        onCancel={handleModalCancel}
        onOk={handleCreateDepartment}
        confirmLoading={creatingDepartment}
        okText="Create Department"
      >
        <Form.Item
          label="Department Name"
          required
          style={{ marginBottom: 16 }}
        >
          <Input
            value={newDepartmentName}
            onChange={handleNewDepartmentNameChange}
            placeholder="Enter department name"
            onPressEnter={handleCreateDepartment}
            disabled={creatingDepartment}
            autoFocus
          />
        </Form.Item>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          This will create a new department in TeamTailor that can be used across all job postings.
        </Text>
      </Modal>
    </WizardStageLayout>
  );
});

export default BasicInfoStage;