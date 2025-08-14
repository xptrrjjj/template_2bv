'use client';

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Typography,
  Card,
  Row,
  Col,
  Space,
  Tag,
  Button,
  Divider,
  Progress,
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  StarOutlined,
  BuildOutlined,
  InfoCircleOutlined,
  CodeOutlined,
  FileTextOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { JobRoleWithStats, JOB_LEVELS, JOB_ROLE_STATUSES, EMPLOYMENT_TYPES, CURRENCIES, CONTRACT_DURATIONS, TIME_ZONES } from '@/types/job-roles';
import MarketRatesAnalysis from './details/MarketRatesAnalysis';
import CostCalculator from './details/CostCalculator';
import TalentAvailability from './details/TalentAvailability';

const { Title, Text, Paragraph } = Typography;

interface JobRoleDetailsModalProps {
  role: JobRoleWithStats;
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
}

/**
 * JobRoleDetailsModal Component
 * 
 * Refactored to follow SOLID principles:
 * - Single Responsibility: Only handles modal orchestration
 * - Open/Closed: Extensible through component composition
 * - Dependency Inversion: Depends on abstracted components
 * 
 * Extracted complex sections into dedicated components:
 * - MarketRatesAnalysis: Handles AI market rate display
 * - CostCalculator: Interactive cost calculation with slider
 * - TalentAvailability: AI talent assessment display
 */

const JobRoleDetailsModal: React.FC<JobRoleDetailsModalProps> = ({ role, visible, onClose, onEdit }) => {
  const [markupPercentage, setMarkupPercentage] = useState(25);

  // Helper function to safely extract numeric values from market rates
  const safeExtractRates = (rateData: any) => {
    const extractedRates = {
      philippines: {
        openai: { min: 0, max: 0 },
        gemini: { min: 0, max: 0 }
      },
      usa: {
        openai: { min: 0, max: 0 },
        gemini: { min: 0, max: 0 }
      }
    };

    try {
      // Philippines OpenAI
      if (rateData?.philippines?.openai) {
        extractedRates.philippines.openai.min = Number(rateData.philippines.openai.min) || 0;
        extractedRates.philippines.openai.max = Number(rateData.philippines.openai.max) || 0;
      }
      
      // Philippines Gemini
      if (rateData?.philippines?.gemini) {
        extractedRates.philippines.gemini.min = Number(rateData.philippines.gemini.min) || 0;
        extractedRates.philippines.gemini.max = Number(rateData.philippines.gemini.max) || 0;
      }
      
      // USA OpenAI
      if (rateData?.usa?.openai) {
        extractedRates.usa.openai.min = Number(rateData.usa.openai.min) || 0;
        extractedRates.usa.openai.max = Number(rateData.usa.openai.max) || 0;
      }
      
      // USA Gemini
      if (rateData?.usa?.gemini) {
        extractedRates.usa.gemini.min = Number(rateData.usa.gemini.min) || 0;
        extractedRates.usa.gemini.max = Number(rateData.usa.gemini.max) || 0;
      }
    } catch (error) {
      console.error('Error extracting rates:', error);
    }

    return extractedRates;
  };

  // Position analysis data should now be properly saved and available in role.position_analysis

  // Format currency helper
  const formatCurrency = (amount?: number, currency = 'USD') => {
    if (!amount) return 'Not specified';
    const currencyInfo = CURRENCIES.find(c => c.value === currency);
    return `${currencyInfo?.label.split(' ')[1] || '$'}${amount.toLocaleString()}`;
  };

  // Get label helpers
  const getLevelLabel = (level?: string) => JOB_LEVELS.find(l => l.value === level)?.label || level;
  const getEmploymentTypeLabel = (type?: string) => EMPLOYMENT_TYPES.find(t => t.value === type)?.label || type;
  const getContractDurationLabel = (duration?: string) => CONTRACT_DURATIONS.find(d => d.value === duration)?.label || duration;
  const getTimeZoneLabel = (tz?: string) => TIME_ZONES.find(t => t.value === tz)?.label || tz;

  // Calculate cost savings if position analysis exists - using exact same logic as working PositionAnalysisStage
  const savings = useMemo(() => {
    if (!role.position_analysis?.marketRates) {
      console.log('No market rates data available');
      return null;
    }
    
    const rates = role.position_analysis.marketRates;
    
    // Debug logging for troubleshooting
    console.log('=== Cost Calculator Debug ===');
    console.log('Market Rates Data:', JSON.stringify(rates, null, 2));
    
    try {
      // Use safe extraction helper to prevent data corruption
      const safeRates = safeExtractRates(rates);
      
      console.log('Safe extracted rates:', safeRates);
      
      // Extract rate data using safe extraction
      const phOpenAI = safeRates.philippines.openai;
      const phGemini = safeRates.philippines.gemini;
      const usOpenAI = safeRates.usa.openai;
      const usGemini = safeRates.usa.gemini;
      
      // Validate that we have non-zero rates
      const allRates = [phOpenAI.min, phOpenAI.max, phGemini.min, phGemini.max, 
                        usOpenAI.min, usOpenAI.max, usGemini.min, usGemini.max];
      
      if (allRates.some(rate => rate <= 0)) {
        console.log('Some rates are zero or negative:', allRates);
        return null;
      }
      
      // Validate that rates are reasonable (between $1 and $500/hour)
      if (allRates.some(rate => rate > 500)) {
        console.log('Some rates are unreasonably high (>$500/hr):', allRates);
        return null;
      }
      
      // Calculate averages - EXACTLY same logic as working version
      const avgPhRate = ((phOpenAI.min + phOpenAI.max + phGemini.min + phGemini.max) / 4);
      const avgUsRate = ((usOpenAI.min + usOpenAI.max + usGemini.min + usGemini.max) / 4);
      const adjustedPhRate = avgPhRate * (1 + markupPercentage / 100);
      
      console.log('Calculation steps:', {
        phRates: [phOpenAI.min, phOpenAI.max, phGemini.min, phGemini.max],
        usRates: [usOpenAI.min, usOpenAI.max, usGemini.min, usGemini.max],
        avgPhRate,
        avgUsRate,
        markupPercentage,
        adjustedPhRate
      });
      
      // Calculate savings - EXACTLY same logic as working version
      const annualSavings = (avgUsRate - adjustedPhRate) * 40 * 52; // 40 hours/week * 52 weeks
      const threeYearSavings = annualSavings * 3;
      const savingsPercentage = ((avgUsRate - adjustedPhRate) / avgUsRate) * 100;
      
      const result = {
        annualSavings: Math.round(annualSavings),
        threeYearSavings: Math.round(threeYearSavings),
        phRateWithMarkup: Math.round(adjustedPhRate),
        savingsPercentage: Math.round(savingsPercentage),
        avgPhRate: Math.round(avgPhRate),
        avgUsRate: Math.round(avgUsRate),
      };
      
      console.log('Final calculated result:', result);
      console.log('=== End Debug ===');
      
      return result;
    } catch (error) {
      console.error('Error in cost calculation:', error);
      return null;
    }
  }, [role.position_analysis?.marketRates, markupPercentage]);

  return (
    <Modal
      title={
        <Space align="center">
          <EyeOutlined />
          <span>Job Role Details</span>
          {role.is_priority && (
            <Tag color="gold" icon={<StarOutlined />}>Priority</Tag>
          )}
          {role.published_to_teamtailor && (
            <Tag color="blue">Published to TeamTailor</Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={onEdit}>
          Edit Role
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      width={1200}
      className="job-role-details-modal"
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <div style={{ padding: '16px 0' }}>
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
              <Text strong>{role.company_name}</Text>
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
                <div><Text strong>{role.title}</Text></div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Department</Text>
                <div><Text strong>{role.department}</Text></div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Level</Text>
                <div><Text strong>{getLevelLabel(role.level)}</Text></div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Employment Type</Text>
                <div><Text strong>{getEmploymentTypeLabel(role.employment_type)}</Text></div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Resources Needed</Text>
                <div><Text strong>{role.number_of_resources}</Text></div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Location</Text>
                <div>
                  <Text strong>{role.location}</Text>
                  <Tag color="green" style={{ marginLeft: '8px' }}>
                    {role.location_type}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Time Zone</Text>
                <div><Text strong>{getTimeZoneLabel(role.time_zone) || 'Not specified'}</Text></div>
              </div>
            </Col>
            {role.contract_duration && (
              <Col span={8}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Contract Duration</Text>
                  <div><Text strong>{getContractDurationLabel(role.contract_duration)}</Text></div>
                </div>
              </Col>
            )}
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
                <div><Text strong>{formatCurrency(role.target_budget_usd)}</Text></div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Maximum Budget (USD)</Text>
                <div><Text strong>{formatCurrency(role.maximum_budget_usd)}</Text></div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Target Rate (USD)</Text>
                <div><Text strong>{formatCurrency(role.target_rate_usd)}</Text></div>
              </div>
            </Col>
            {role.budget_notes && (
              <Col span={24}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Budget Notes</Text>
                  <div><Text>{role.budget_notes}</Text></div>
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
                <Text type="secondary" style={{ fontSize: '12px' }}>Required Skills ({role.requirements?.length || 0})</Text>
                <div style={{ marginTop: '4px' }}>
                  {role.requirements?.map((req, index) => (
                    <div key={`req-${index}-${req.slice(0, 10)}`} style={{ fontSize: '12px', marginBottom: '2px' }}>
                      • {req}
                    </div>
                  ))}
                </div>
              </div>
            </Col>
            <Col span={24}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Key Responsibilities ({role.responsibilities?.length || 0})</Text>
                <div style={{ marginTop: '4px' }}>
                  {role.responsibilities?.map((resp, index) => (
                    <div key={`resp-${index}-${resp.slice(0, 10)}`} style={{ fontSize: '12px', marginBottom: '2px' }}>
                      • {resp}
                    </div>
                  ))}
                </div>
              </div>
            </Col>
            {role.preferred_qualifications && role.preferred_qualifications.length > 0 && (
              <Col span={24}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Preferred Qualifications ({role.preferred_qualifications.length})</Text>
                  <div style={{ marginTop: '4px' }}>
                    {role.preferred_qualifications.map((qual, index) => (
                      <div key={`qual-${index}-${qual.slice(0, 10)}`} style={{ fontSize: '12px', marginBottom: '2px' }}>
                        • {qual}
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            )}
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
          style={{ marginBottom: '16px' }}
        >
          <div 
            style={{ 
              maxHeight: '200px', 
              overflow: 'auto', 
              fontSize: '14px',
              lineHeight: '1.6',
              padding: '12px',
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: '4px',
              whiteSpace: 'pre-line'
            }}
          >
            {role.description}
          </div>
          <div style={{ marginTop: '8px', textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {role.description?.length || 0} characters
            </Text>
          </div>
        </Card>

        {/* AI Position Analysis Results */}
        {role.position_analysis && (
          <Card 
            size="small" 
            title={
              <Space>
                <span>🤖</span>
                <span>AI Position Analysis</span>
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            {/* Market Rates Analysis */}
            {role.position_analysis.marketRates && (
              <MarketRatesAnalysis marketRates={role.position_analysis.marketRates} />
            )}

            {/* Interactive Cost Calculator */}
            <CostCalculator 
              markupPercentage={markupPercentage}
              onMarkupChange={setMarkupPercentage}
              savingsData={savings}
            />

            {/* Talent Availability */}
            {role.position_analysis.talentAvailability && (
              <TalentAvailability talentAvailability={role.position_analysis.talentAvailability} />
            )}

            {/* AI Generated Content Summary */}
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={[16, 16]}>
              {role.position_analysis.jobDescription && (
                <Col span={12}>
                  <div>
                    <Text strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>AI Job Description</Text>
                    <div style={{ fontSize: '11px' }}>
                      <Text type="secondary">Generated and optimized content ready for use</Text>
                    </div>
                  </div>
                </Col>
              )}
              {role.position_analysis.rolePitch && (
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
                      {(role.position_analysis.rolePitch.openai?.content || role.position_analysis.rolePitch.gemini?.content || '').substring(0, 200)}...
                    </div>
                    <div>
                      {(role.position_analysis.rolePitch.openai?.keyPoints || role.position_analysis.rolePitch.gemini?.keyPoints || []).slice(0, 2).map((point, index) => (
                        <Tag key={`keypoint-tag-${index}-${point.slice(0, 10)}`} color="green" style={{ fontSize: '9px', marginRight: '2px' }}>
                          {point}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Col>
              )}
            </Row>
            {role.position_analysis.analysisMetadata && (
              <div style={{ marginTop: '12px', padding: '8px', background: '#f6ffed', borderRadius: '4px' }}>
                <Text style={{ fontSize: '11px', color: '#52c41a' }}>
                  ✓ Analysis completed on {new Date(role.position_analysis.analysisMetadata.timestamp).toLocaleDateString()} with {role.position_analysis.analysisMetadata.confidence} confidence
                </Text>
              </div>
            )}
          </Card>
        )}

        {/* Status and Progress */}
        <Card
          size="small"
          title="Status & Progress"
          style={{ marginBottom: '16px' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text type="secondary">Status</Text>
                <div style={{ marginTop: '8px' }}>
                  <Tag color={JOB_ROLE_STATUSES.find(s => s.value === role.status)?.color}>
                    {JOB_ROLE_STATUSES.find(s => s.value === role.status)?.label}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text type="secondary">Filled</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text strong>{role.filled_count}/{role.openings_count}</Text>
                  {role.openings_count > 0 && (
                    <Progress
                      percent={(role.filled_count / role.openings_count) * 100}
                      size="small"
                      style={{ marginTop: '4px' }}
                    />
                  )}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Text type="secondary">Days Open</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text strong style={{ 
                    color: role.days_open > 60 ? '#ff4d4f' : 
                           role.days_open > 30 ? '#faad14' : '#52c41a' 
                  }}>
                    {role.days_open} days
                  </Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Metadata */}
        <Card size="small" title="Metadata">
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Created: {new Date(role.created_at).toLocaleDateString()}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Updated: {new Date(role.updated_at).toLocaleDateString()}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Created by: {role.created_by}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Updated by: {role.updated_by}</Text>
            </Col>
          </Row>
        </Card>
      </div>
    </Modal>
  );
};

export default JobRoleDetailsModal;