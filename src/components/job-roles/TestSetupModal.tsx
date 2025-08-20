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
  InputNumber,
  Input,
  Select,
  Card,
  Checkbox,
  Typography,
  Divider,
  Empty,
  Spin,
} from 'antd';
import {
  ExperimentOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  StarOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { 
  JobRoleWithStats, 
  TestSetupData, 
  TestConfiguration
} from '@/types/job-roles';
import { testingService } from '@/services/testing';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

interface TestSetupModalProps {
  role: JobRoleWithStats;
  visible: boolean;
  onClose: () => void;
  onSave: (data: TestSetupData) => void;
  loading?: boolean;
}

/**
 * TestSetupModal Component
 * 
 * Allows configuration of TestDome tests for job roles
 * Follows SOLID principles and integrates with TestDome platform
 */
const TestSetupModal: React.FC<TestSetupModalProps> = ({
  role,
  visible,
  onClose,
  onSave,
  loading = false
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('configuration');
  const [availableTests, setAvailableTests] = useState<TestConfiguration[]>([]);
  const [selectedTests, setSelectedTests] = useState<TestConfiguration[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<'testdome' | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Initialize form with existing data
  useEffect(() => {
    if (role.test_setup && visible) {
      const data = role.test_setup;
      
      form.setFieldsValue({
        tests_required: data.tests_required,
        test_instructions: data.test_instructions,
        test_deadline_days: data.test_deadline_days || 7,
        send_test_immediately: data.send_test_immediately || false,
        require_all_tests: data.require_all_tests || false,
        auto_screen_failures: data.auto_screen_failures || false,
        test_coordinator: data.test_coordinator || '',
        custom_test_requirements: data.custom_test_requirements || '',
      });
      
      setSelectedTests(data.selected_tests || []);
    } else if (visible) {
      // Initialize with defaults for new test setup
      form.setFieldsValue({
        tests_required: true,
        test_deadline_days: 7,
        send_test_immediately: true,
        require_all_tests: false,
        auto_screen_failures: false,
      });
      setSelectedTests([]);
    }
  }, [role.test_setup, visible, form]);

  // Load available tests when modal opens
  useEffect(() => {
    if (visible) {
      loadAvailableTests();
    }
  }, [visible]);

  const loadAvailableTests = async () => {
    setTestsLoading(true);
    try {
      const tests = await testingService.getAllAvailableTests();
      setAvailableTests(tests);
      if (tests.length === 0) {
        message.warning('No tests available from TestDome. Please check your API configuration.');
      }
    } catch (error) {
      console.error('Error loading tests:', error);
      message.error(`Failed to load TestDome tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailableTests([]);
    } finally {
      setTestsLoading(false);
    }
  };

  const handleTestSelect = (test: TestConfiguration) => {
    const isSelected = selectedTests.some(t => t.test_id === test.test_id);
    if (isSelected) {
      setSelectedTests(prev => prev.filter(t => t.test_id !== test.test_id));
    } else {
      setSelectedTests(prev => [...prev, { ...test, test_order: prev.length + 1 }]);
    }
  };

  const handleTestToggleMandatory = (testId: string) => {
    setSelectedTests(prev => 
      prev.map(test => 
        test.test_id === testId 
          ? { ...test, is_mandatory: !test.is_mandatory }
          : test
      )
    );
  };

  const filteredTests = availableTests.filter(test => {
    const matchesSearch = searchQuery === '' || 
      test.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.skills_assessed.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesProvider = filterProvider === 'all' || filterProvider === 'testdome'; // All tests are from TestDome now
    const matchesDifficulty = filterDifficulty === 'all' || test.difficulty_level === filterDifficulty;
    
    return matchesSearch && matchesProvider && matchesDifficulty;
  });

  const handleSubmit = async (values: any) => {
    try {
      if (values.tests_required && selectedTests.length === 0) {
        message.error('Please select at least one test or disable tests requirement');
        setActiveTab('tests');
        return;
      }

      const testSetupData: TestSetupData = {
        tests_required: values.tests_required,
        selected_tests: selectedTests,
        test_instructions: values.test_instructions,
        test_deadline_days: values.test_deadline_days,
        send_test_immediately: values.send_test_immediately,
        require_all_tests: values.require_all_tests,
        auto_screen_failures: values.auto_screen_failures,
        test_coordinator: values.test_coordinator,
        custom_test_requirements: values.custom_test_requirements,
        completion_metadata: {
          configured_at: new Date().toISOString(),
          configured_by: 'current-user', // TODO: Get actual user
          configuration_notes: `Configured ${selectedTests.length} tests`
        }
      };

      onSave(testSetupData);
      message.success('Test setup completed successfully!');
    } catch (error) {
      console.error('Error saving test setup:', error);
      message.error('Failed to save test setup');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      case 'expert': return 'purple';
      default: return 'default';
    }
  };

  const getTestTypeColor = (testType: string) => {
    switch (testType) {
      case 'programming': return 'blue';
      case 'knowledge': return 'green';
      case 'multiple-choice': return 'orange';
      case 'open-ended': return 'purple';
      default: return 'default';
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ExperimentOutlined />
          <span>Test Setup: {role.title}</span>
          <Tag color="warning">Test Setup Stage</Tag>
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
          Complete Test Setup
        </Button>
      ]}
      styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
    >
      <Alert
        message="Test Setup Configuration"
        description="Configure TestDome assessments that candidates will need to complete. At least one test must be selected to progress to the next stage."
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
              key: 'configuration',
              label: (
                <span>
                  <BookOutlined />
                  General Configuration
                </span>
              ),
              children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Card title="Test Requirements" size="small">
                    <Form.Item 
                      name="tests_required" 
                      valuePropName="checked"
                      style={{ marginBottom: 16 }}
                    >
                      <Switch 
                        checkedChildren="Tests Required" 
                        unCheckedChildren="No Tests"
                      />
                    </Form.Item>
                    
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.tests_required !== currentValues.tests_required
                      }
                    >
                      {({ getFieldValue }) =>
                        getFieldValue('tests_required') ? (
                          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <Form.Item
                              name="test_deadline_days"
                              label="Test Deadline (Days from Application)"
                              rules={[{ required: true, message: 'Please set a deadline' }]}
                            >
                              <InputNumber 
                                min={1} 
                                max={30} 
                                addonAfter="days"
                                placeholder="7"
                              />
                            </Form.Item>

                            <Form.Item name="send_test_immediately" valuePropName="checked">
                              <Switch checkedChildren="Send Immediately" unCheckedChildren="Manual Send" />
                            </Form.Item>

                            <Form.Item name="require_all_tests" valuePropName="checked">
                              <Switch checkedChildren="All Tests Required" unCheckedChildren="Any Test Pass" />
                            </Form.Item>

                            <Form.Item name="auto_screen_failures" valuePropName="checked">
                              <Switch checkedChildren="Auto-reject Failures" unCheckedChildren="Manual Review" />
                            </Form.Item>
                          </Space>
                        ) : null
                      }
                    </Form.Item>
                  </Card>

                  <Card title="Additional Configuration" size="small">
                    <Form.Item
                      name="test_coordinator"
                      label="Test Coordinator"
                    >
                      <Input placeholder="Person responsible for managing tests" />
                    </Form.Item>

                    <Form.Item
                      name="test_instructions"
                      label="Instructions for Candidates"
                    >
                      <TextArea 
                        rows={3}
                        placeholder="Any specific instructions for candidates taking the tests..."
                      />
                    </Form.Item>

                    <Form.Item
                      name="custom_test_requirements"
                      label="Custom Requirements"
                    >
                      <TextArea 
                        rows={2}
                        placeholder="Any additional testing requirements or notes..."
                      />
                    </Form.Item>
                  </Card>
                </Space>
              )
            },
            {
              key: 'tests',
              label: (
                <span>
                  <ExperimentOutlined />
                  Select Tests ({selectedTests.length})
                </span>
              ),
              children: (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* Selected Tests */}
                  {selectedTests.length > 0 && (
                    <Card 
                      title={`Selected Tests (${selectedTests.length})`}
                      size="small"
                      extra={
                        <Button 
                          type="link" 
                          onClick={() => setSelectedTests([])}
                          size="small"
                        >
                          Clear All
                        </Button>
                      }
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {selectedTests.map((test, index) => (
                          <Card key={test.test_id} size="small" style={{ backgroundColor: '#f9f9f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <Space direction="vertical" size="small">
                                  <div>
                                    <Text strong>{test.test_name}</Text>
                                    <Space style={{ marginLeft: 8 }}>
                                      <Tag color="blue">
                                        TESTDOME
                                      </Tag>
                                      {test.test_type && (
                                        <Tag color={getTestTypeColor(test.test_type)}>
                                          {test.test_type.toUpperCase()}
                                        </Tag>
                                      )}
                                      <Tag color={getDifficultyColor(test.difficulty_level || 'intermediate')}>
                                        {test.difficulty_level || 'Intermediate'}
                                      </Tag>
                                      {test.duration_minutes && (
                                        <Tag icon={<ClockCircleOutlined />}>
                                          {test.duration_minutes}m
                                        </Tag>
                                      )}
                                    </Space>
                                  </div>
                                  {test.description && (
                                    <Paragraph 
                                      style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}
                                      ellipsis={{ rows: 1, expandable: true, symbol: 'more' }}
                                    >
                                      {test.description}
                                    </Paragraph>
                                  )}
                                  <div>
                                    {test.skills_assessed.map(skill => (
                                      <Tag key={skill}>{skill}</Tag>
                                    ))}
                                  </div>
                                </Space>
                              </div>
                              <Space direction="vertical" align="end">
                                <Button 
                                  type="text" 
                                  danger
                                  size="small"
                                  onClick={() => handleTestSelect(test)}
                                >
                                  Remove
                                </Button>
                                <Checkbox
                                  checked={test.is_mandatory}
                                  onChange={() => handleTestToggleMandatory(test.test_id)}
                                >
                                  <Text style={{ fontSize: '12px' }}>Mandatory</Text>
                                </Checkbox>
                              </Space>
                            </div>
                          </Card>
                        ))}
                      </Space>
                    </Card>
                  )}

                  {/* Search and Filters */}
                  <Card title="Available Tests" size="small">
                    <Space style={{ marginBottom: 16, width: '100%' }} wrap>
                      <Input
                        placeholder="Search tests by name or skills..."
                        prefix={<SearchOutlined />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: 300 }}
                      />
                      <Select
                        value={filterProvider}
                        onChange={setFilterProvider}
                        style={{ width: 120 }}
                      >
                        <Option value="all">All Tests</Option>
                        <Option value="testdome">TestDome</Option>
                      </Select>
                      <Select
                        value={filterDifficulty}
                        onChange={setFilterDifficulty}
                        style={{ width: 120 }}
                      >
                        <Option value="all">All Levels</Option>
                        <Option value="beginner">Beginner</Option>
                        <Option value="intermediate">Intermediate</Option>
                        <Option value="advanced">Advanced</Option>
                        <Option value="expert">Expert</Option>
                      </Select>
                    </Space>

                    <Divider style={{ margin: '16px 0' }} />

                    {testsLoading ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Spin size="large" />
                      </div>
                    ) : filteredTests.length === 0 ? (
                      <Empty 
                        description={
                          availableTests.length === 0 
                            ? "No tests available from TestDome API. Please check your API key configuration."
                            : "No tests match your search criteria"
                        }
                        style={{ padding: '40px' }}
                      />
                    ) : (
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          {filteredTests.map((test) => {
                            const isSelected = selectedTests.some(t => t.test_id === test.test_id);
                            return (
                              <Card 
                                key={test.test_id} 
                                size="small"
                                style={{ 
                                  cursor: 'pointer',
                                  border: isSelected ? '2px solid #1890ff' : undefined,
                                  backgroundColor: isSelected ? '#f6ffed' : undefined
                                }}
                                onClick={() => handleTestSelect(test)}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ flex: 1 }}>
                                    <Space direction="vertical" size="small">
                                      <div>
                                        <Text strong>{test.test_name}</Text>
                                        <Space style={{ marginLeft: 8 }}>
                                          <Tag color="blue">
                                            TESTDOME
                                          </Tag>
                                          {test.test_type && (
                                            <Tag color={getTestTypeColor(test.test_type)}>
                                              {test.test_type.toUpperCase()}
                                            </Tag>
                                          )}
                                          <Tag color={getDifficultyColor(test.difficulty_level || 'intermediate')}>
                                            {test.difficulty_level || 'Intermediate'}
                                          </Tag>
                                          {test.duration_minutes && (
                                            <Tag icon={<ClockCircleOutlined />}>
                                              {test.duration_minutes}m
                                            </Tag>
                                          )}
                                        </Space>
                                      </div>
                                      {test.description && (
                                        <Paragraph 
                                          style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}
                                          ellipsis={{ rows: 1, expandable: true, symbol: 'more' }}
                                        >
                                          {test.description}
                                        </Paragraph>
                                      )}
                                      <div>
                                        {test.skills_assessed.map(skill => (
                                          <Tag key={skill}>{skill}</Tag>
                                        ))}
                                      </div>
                                    </Space>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: 16 }}>
                                    {isSelected ? (
                                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                                    ) : (
                                      <Button type="primary" size="small">
                                        Select
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </Space>
                      </div>
                    )}
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

export default TestSetupModal;