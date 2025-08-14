'use client';

import React, { useEffect } from 'react';
import {
  Form,
  Typography,
  Card,
  Row,
  Col,
  Space,
  Tag,
  Switch,
  Divider,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  BuildOutlined,
  InfoCircleOutlined,
  CodeOutlined,
  FileTextOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { 
  JobRoleWizardData, 
  JOB_LEVELS, 
  EMPLOYMENT_TYPES, 
  CURRENCIES,
  CONTRACT_DURATIONS,
  TIME_ZONES,
} from '@/types/job-roles';

const { Title, Text, Paragraph } = Typography;

interface ReviewStageProps {
  data: Partial<JobRoleWizardData>;
  onDataChange: (data: Partial<JobRoleWizardData>) => void;
  onValidChange: (valid: boolean) => void;
}

export default function ReviewStage({ data, onDataChange, onValidChange }: ReviewStageProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      is_priority: data.is_priority || false,
      publish_to_teamtailor: false, // Always false for draft
    });
  }, [data, form]);

  // Always valid since all required data should be filled by now
  useEffect(() => {
    onValidChange(true);
  }, []); // Remove onValidChange from deps - run only once

  const handleFormChange = (changedFields: any, allFields: any) => {
    onDataChange({
      is_priority: allFields.is_priority || false,
      publish_to_teamtailor: false, // Always false for draft
    });
  };

  const formatCurrency = (amount?: number, currency = 'USD') => {
    if (!amount) return 'Not specified';
    const currencyInfo = CURRENCIES.find(c => c.value === currency);
    return `${currencyInfo?.label.split(' ')[1] || '$'}${amount.toLocaleString()}`;
  };

  const getLevelLabel = (level?: string) => {
    return JOB_LEVELS.find(l => l.value === level)?.label || level;
  };

  const getEmploymentTypeLabel = (type?: string) => {
    return EMPLOYMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getContractDurationLabel = (duration?: string) => {
    return CONTRACT_DURATIONS.find(d => d.value === duration)?.label || duration;
  };

  const getTimeZoneLabel = (tz?: string) => {
    return TIME_ZONES.find(t => t.value === tz)?.label || tz;
  };

  // Check if all required data is present
  const hasRequiredData = data.company_id && data.title && data.department && 
                         data.requirements && data.responsibilities && data.description;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #52c41a 0%, #1890ff 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <CheckCircleOutlined style={{ color: 'white', fontSize: '24px' }} />
        </div>
        
        <Title level={3} style={{ margin: '0 0 8px 0' }}>
          Review & Save
        </Title>
        
        <Text type="secondary" style={{ fontSize: '16px' }}>
          Review all the information and save as draft
        </Text>
      </div>

      {!hasRequiredData && (
        <Alert
          message="Missing Required Information"
          description="Please complete all previous steps before proceeding."
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Company Information */}
      <Card 
        size="small" 
        title={
          <Space>
            <BuildOutlined style={{ color: '#52c41a' }} />
            <span>Company</span>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row>
          <Col span={24}>
            <Text strong>{data.company_name}</Text>
            <Tag color="blue" style={{ marginLeft: '8px' }}>
              Selected
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Basic Information */}
      <Card 
        size="small" 
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <span>Basic Information</span>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Job Title</Text>
              <div><Text strong>{data.title}</Text></div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Department</Text>
              <div><Text strong>{data.department}</Text></div>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Level</Text>
              <div><Text strong>{getLevelLabel(data.level)}</Text></div>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Employment Type</Text>
              <div><Text strong>{getEmploymentTypeLabel(data.employment_type)}</Text></div>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Resources Needed</Text>
              <div><Text strong>{data.number_of_resources}</Text></div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Location</Text>
              <div>
                <Text strong>{data.location}</Text>
                <Tag color="green" style={{ marginLeft: '8px' }}>
                  {data.location_type}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Time Zone</Text>
              <div><Text strong>{getTimeZoneLabel(data.time_zone) || 'Not specified'}</Text></div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Budget & Compensation */}
      <Card 
        size="small" 
        title={
          <Space>
            <DollarOutlined style={{ color: '#fa8c16' }} />
            <span>Budget & Compensation</span>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Target Budget (USD)</Text>
              <div><Text strong>{formatCurrency(data.target_budget_usd)}</Text></div>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Maximum Budget (USD)</Text>
              <div><Text strong>{formatCurrency(data.maximum_budget_usd)}</Text></div>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Target Rate (USD)</Text>
              <div><Text strong>{formatCurrency(data.target_rate_usd)}</Text></div>
            </div>
          </Col>
          {data.budget_notes && (
            <Col span={24}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Budget Notes</Text>
                <div><Text>{data.budget_notes}</Text></div>
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* Skills & Requirements */}
      <Card 
        size="small" 
        title={
          <Space>
            <CodeOutlined style={{ color: '#722ed1' }} />
            <span>Skills & Requirements</span>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Required Skills ({data.requirements?.length || 0})</Text>
              <div style={{ marginTop: '4px' }}>
                {data.requirements?.slice(0, 3).map((req, index) => (
                  <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
                    • {req}
                  </div>
                ))}
                {(data.requirements?.length || 0) > 3 && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ... and {(data.requirements?.length || 0) - 3} more
                  </Text>
                )}
              </div>
            </div>
          </Col>
          <Col span={24}>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Key Responsibilities ({data.responsibilities?.length || 0})</Text>
              <div style={{ marginTop: '4px' }}>
                {data.responsibilities?.slice(0, 3).map((resp, index) => (
                  <div key={index} style={{ fontSize: '12px', marginBottom: '2px' }}>
                    • {resp}
                  </div>
                ))}
                {(data.responsibilities?.length || 0) > 3 && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ... and {(data.responsibilities?.length || 0) - 3} more
                  </Text>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Job Description */}
      <Card 
        size="small" 
        title={
          <Space>
            <FileTextOutlined style={{ color: '#fa541c' }} />
            <span>Job Description</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <div 
          style={{ 
            maxHeight: '150px', 
            overflow: 'auto', 
            fontSize: '12px',
            lineHeight: '1.5',
            padding: '8px',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: '4px'
          }}
        >
          <Paragraph ellipsis={{ rows: 6 }}>
            {data.description}
          </Paragraph>
        </div>
        <div style={{ marginTop: '8px', textAlign: 'right' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {data.description?.length || 0} characters
          </Text>
        </div>
      </Card>

      {/* Position Analysis Results */}
      {data.position_analysis && (
        <Card 
          size="small" 
          title={
            <Space>
              <BarChartOutlined style={{ color: '#722ed1' }} />
              <span>AI Position Analysis</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={[16, 16]}>
            {/* Market Rates Summary */}
            {data.position_analysis.marketRates && (
              <Col span={12}>
                <div>
                  <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>Market Rates</Text>
                  <div style={{ fontSize: '11px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary">Philippines: </Text>
                      <Text>${data.position_analysis.marketRates.philippines.openai.min}-${data.position_analysis.marketRates.philippines.openai.max}/hr</Text>
                    </div>
                    <div>
                      <Text type="secondary">USA: </Text>
                      <Text>${data.position_analysis.marketRates.usa.openai.min}-${data.position_analysis.marketRates.usa.openai.max}/hr</Text>
                    </div>
                  </div>
                </div>
              </Col>
            )}
            {/* Talent Availability Summary */}
            {data.position_analysis.talentAvailability && (
              <Col span={12}>
                <div>
                  <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>Talent Availability</Text>
                  <div style={{ fontSize: '11px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary">Score: </Text>
                      <Text>{data.position_analysis.talentAvailability.openai.score}/10</Text>
                      <Tag 
                        color={data.position_analysis.talentAvailability.openai.status === 'abundant' ? 'green' : 
                               data.position_analysis.talentAvailability.openai.status === 'moderate' ? 'blue' : 'orange'}
                        style={{ marginLeft: '8px', fontSize: '11px' }}
                      >
                        {data.position_analysis.talentAvailability.openai.status.toUpperCase()}
                      </Tag>
                    </div>
                    <div>
                      <Text type="secondary">Timeline: </Text>
                      <Text>{data.position_analysis.talentAvailability.openai.timeline}</Text>
                    </div>
                  </div>
                </div>
              </Col>
            )}
          </Row>
          {/* Generated Content Summary */}
          <Divider style={{ margin: '12px 0' }} />
          <Row gutter={[16, 16]}>
            {data.position_analysis.jobDescription && (
              <Col span={12}>
                <div>
                  <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>AI Job Description</Text>
                  <div style={{ fontSize: '11px' }}>
                    <Text type="secondary">Generated and optimized content ready for use</Text>
                  </div>
                </div>
              </Col>
            )}
            {data.position_analysis.rolePitch && (
              <Col span={12}>
                <div>
                  <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>Applicant Pitch</Text>
                  <div 
                    style={{ 
                      maxHeight: '100px', 
                      overflow: 'auto', 
                      fontSize: '10px',
                      lineHeight: '1.3',
                      padding: '6px',
                      background: '#f6ffed',
                      border: '1px solid #d9f7be',
                      borderRadius: '4px',
                      whiteSpace: 'pre-line',
                      marginBottom: '6px'
                    }}
                  >
                    {/* Show the best pitch content */}
                    {(data.position_analysis.rolePitch.openai?.content || data.position_analysis.rolePitch.gemini?.content || '').substring(0, 200)}...
                  </div>
                  <div>
                    {(data.position_analysis.rolePitch.openai?.keyPoints || data.position_analysis.rolePitch.gemini?.keyPoints || []).slice(0, 2).map((point, index) => (
                      <Tag key={index} color="green" style={{ fontSize: '9px', marginRight: '2px' }}>
                        {point}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Col>
            )}
          </Row>
          {data.position_analysis.analysisMetadata && (
            <div style={{ marginTop: '12px', padding: '8px', background: '#f6ffed', borderRadius: '4px' }}>
              <Text style={{ fontSize: '11px', color: '#52c41a' }}>
                ✓ Analysis completed on {new Date(data.position_analysis.analysisMetadata.timestamp).toLocaleDateString()} with {data.position_analysis.analysisMetadata.confidence} confidence
              </Text>
            </div>
          )}
        </Card>
      )}

      {/* Final Options */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
      >
        <Card 
          size="small" 
          title="Final Settings"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="is_priority" 
                valuePropName="checked"
                style={{ marginBottom: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Switch />
                  <div>
                    <Text strong>Priority Role</Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Mark this as a high-priority position
                    </div>
                  </div>
                </div>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="publish_to_teamtailor" 
                valuePropName="checked"
                style={{ marginBottom: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Switch disabled />
                  <div>
                    <Text strong style={{ color: '#999' }}>Publish to TeamTailor</Text>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      Available after saving as draft and changing status to 'Active'
                    </div>
                  </div>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Alert
            message="Ready to Save as Draft"
            description="This job role will be saved with 'Draft' status. It will NOT be published to TeamTailor yet. You can review, edit, and publish it later from the job roles page."
            type="info"
            showIcon
          />
        </Card>
      </Form>
    </div>
  );
}