'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import '@/styles/wizard-performance.css';
import {
  Form,
  Input,
  Typography,
  Space,
  Button,
  Card,
  Divider,
  Slider,
  Row,
  Col,
  Statistic,
  Alert,
  Tabs,
  App,
  Badge,
  Progress,
} from 'antd';
import {
  BarChartOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  TeamOutlined,
  CopyOutlined,
  RobotOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { JobRoleWizardData } from '@/types/job-roles';
import { usePositionAnalysisForm } from '@/hooks/useWizardForm';
import { usePositionAnalysisForJobRole } from '@/hooks/usePositionAnalysis';
import WizardStageLayout, { STAGE_GRADIENTS } from '@/components/job-roles/common/WizardStageLayout';
import OptimizedFormFieldGroup from '@/components/job-roles/common/OptimizedFormFieldGroup';

const { Text } = Typography;
const { TextArea } = Input;

interface PositionAnalysisStageProps {
  data: Partial<JobRoleWizardData>;
  onDataChange: (data: Partial<JobRoleWizardData>) => void;
  onValidChange: (valid: boolean) => void;
}

const PositionAnalysisStage = React.memo(function PositionAnalysisStage({ data, onDataChange, onValidChange }: PositionAnalysisStageProps) {
  const { message } = App.useApp();
  const [markupPercentage, setMarkupPercentage] = useState(25);
  
  // Form hook for job description
  const { form, handleFormChange } = usePositionAnalysisForm({
    data,
    onDataChange,
    onValidChange,
  });

  // Analysis hook
  const {
    results,
    isAnalyzing,
    error,
    analyzePosition,
    clearError,
    updateJobData,
    specialInstructions,
    setSpecialInstructions,
  } = usePositionAnalysisForJobRole();

  // Update job data when props change
  useEffect(() => {
    updateJobData(data);
  }, [data, updateJobData]);

  // Load existing position analysis data if it exists (for viewing saved roles)
  useEffect(() => {
    if (data.position_analysis && !results) {
      // If we have saved analysis data but no current results, we're viewing a saved role
      // The analysis results should be displayed from the saved data
      console.log('Loading existing position analysis data:', data.position_analysis);
    }
  }, [data.position_analysis, results]);

  // Validation is now handled manually in useAIDescription and by the form hook

  // Store analysis results in local state for display only
  // Data will only be saved when user clicks "Use This Description" or in Review stage

  // Memoized callback for handling analysis
  const handleAnalyze = useCallback(async () => {
    if (!data.title || !data.level) {
      message.warning('Please complete the basic information first');
      return;
    }

    try {
      await analyzePosition(data as JobRoleWizardData, specialInstructions);
      message.success('Analysis completed successfully!');
    } catch (err) {
      console.error('Analysis failed:', err);
      message.error('Analysis failed. Please try again.');
    }
  }, [data, specialInstructions, analyzePosition, message]);

  // Save analysis data when results change (but not when data changes to avoid infinite loop)
  useEffect(() => {
    if (results) {
      onDataChange({
        position_analysis: results
      });
      console.log('Analysis data automatically saved to wizard state:', results);
    }
  }, [results, onDataChange]);

  // Use either current results or saved analysis data for display
  const displayResults = results || data.position_analysis;

  // Memoized cost savings calculation
  const savings = useMemo(() => {
    if (!displayResults?.marketRates) return null;
    
    const phOpenAI = displayResults.marketRates.philippines.openai;
    const phGemini = displayResults.marketRates.philippines.gemini;
    const usOpenAI = displayResults.marketRates.usa.openai;
    const usGemini = displayResults.marketRates.usa.gemini;
    
    const avgPhRate = ((phOpenAI.min + phOpenAI.max + phGemini.min + phGemini.max) / 4);
    const avgUsRate = ((usOpenAI.min + usOpenAI.max + usGemini.min + usGemini.max) / 4);
    const adjustedPhRate = avgPhRate * (1 + markupPercentage / 100);
    
    const annualSavings = (avgUsRate - adjustedPhRate) * 40 * 52; // 40 hours/week * 52 weeks
    const threeYearSavings = annualSavings * 3;
    
    return {
      annualSavings: Math.round(annualSavings),
      threeYearSavings: Math.round(threeYearSavings),
      phRateWithMarkup: Math.round(adjustedPhRate),
      savingsPercentage: Math.round(((avgUsRate - adjustedPhRate) / avgUsRate) * 100),
      avgPhRate: Math.round(avgPhRate),
      avgUsRate: Math.round(avgUsRate),
    };
  }, [displayResults?.marketRates, markupPercentage]);


  // Smart AI selection - choose the best content based on quality metrics
  const selectBestContent = useCallback((type: 'jobDescription' | 'rolePitch') => {
    if (!displayResults?.[type]) return null;
    
    const openaiContent = displayResults[type]?.openai;
    const geminiContent = displayResults[type]?.gemini;
    
    if (!openaiContent || !geminiContent) {
      return openaiContent || geminiContent;
    }
    
    // Simple quality scoring based on length, structure, and key points
    const scoreContent = (content: any) => {
      let score = 0;
      
      if (type === 'jobDescription') {
        // For job descriptions: prefer longer, more detailed content
        score += (content.wordCount || 0) * 0.1;
        score += (content.content?.split('•').length || 0) * 5; // Bullet points
        score += (content.content?.includes('Requirements:') ? 10 : 0);
        score += (content.content?.includes('Responsibilities:') ? 10 : 0);
      } else {
        // For role pitch: prefer more key points and engaging content
        score += (content.keyPoints?.length || 0) * 8;
        score += (content.content?.includes('🚀') || content.content?.includes('✨') ? 5 : 0); // Emojis indicate engaging content
        score += (content.content?.length || 0) * 0.05;
      }
      
      return score;
    };
    
    const openaiScore = scoreContent(openaiContent);
    const geminiScore = scoreContent(geminiContent);
    
    return openaiScore >= geminiScore ? openaiContent : geminiContent;
  }, [displayResults]);
  
  // Get the best job description and pitch
  const bestJobDescription = useMemo(() => selectBestContent('jobDescription'), [selectBestContent]);
  const bestRolePitch = useMemo(() => selectBestContent('rolePitch'), [selectBestContent]);

  // Analysis data is now automatically saved when results are available (see useEffect above)

  // Memoized callback for using the best AI description
  const useAIDescription = useCallback(() => {
    const description = bestJobDescription?.content;
    
    if (description) {
      try {
        // Set form value
        form.setFieldValue('description', description);
        
        // Clean the description string to avoid any circular references
        const cleanDescription = String(description);
        
        // Update data directly
        onDataChange({ description: cleanDescription });
        
        // Manually trigger validation since we know the description is valid
        if (cleanDescription && cleanDescription.length >= 100) {
          onValidChange(true);
        }
        
        message.success('AI job description applied!');
      } catch (error) {
        console.error('Error applying AI description:', error);
        message.error('Failed to apply AI description');
      }
    }
  }, [bestJobDescription, form, onDataChange, onValidChange, message]);

  // Memoized callback for copying to clipboard
  const copyToClipboard = useCallback((content: string, type: string, provider?: 'openai' | 'gemini') => {
    const providerLabel = provider ? ` (${provider.toUpperCase()})` : '';
    navigator.clipboard.writeText(content);
    message.success(`${type}${providerLabel} copied to clipboard!`);
  }, [message]);

  return (
    <WizardStageLayout
      icon={<BarChartOutlined />}
      title="Position Analysis"
      description="AI-powered market analysis and job description generation"
      gradientColors={STAGE_GRADIENTS.positionAnalysis}
    >
      {/* AI Market Analysis Section */}
      <OptimizedFormFieldGroup
        icon={<ThunderboltOutlined />}
        title="AI Market Analysis"
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Special Instructions (Optional)
            </Text>
            <TextArea
              rows={3}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Add any specific requirements or context for the analysis..."
            />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handleAnalyze}
              loading={isAnalyzing}
              disabled={!data.title || !data.level}
              style={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
              }}
            >
              {isAnalyzing ? 'Analyzing Position...' : 'Start AI Analysis'}
            </Button>
            
            {(!data.title || !data.level) && (
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Complete basic information to start analysis
                </Text>
              </div>
            )}
          </div>

          {error && (
            <Alert
              message="Analysis Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
            />
          )}
        </Space>
      </OptimizedFormFieldGroup>

      {/* Analysis Results */}
      {displayResults && (
        <>
          {/* Consolidated Market Rates */}
          <OptimizedFormFieldGroup
            icon={<DollarOutlined />}
            title="Market Rate Analysis"
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title={<span><span style={{ color: '#52c41a' }}>🇵🇭</span> Philippines Market</span>} size="small">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Badge color="blue" text="As per OpenAI" />
                      <Statistic
                        value={`$${displayResults.marketRates?.philippines.openai.min} - $${displayResults.marketRates?.philippines.openai.max}`}
                        suffix="/hour"
                        style={{ marginBottom: '8px' }}
                      />
                      <ul style={{ fontSize: '11px', color: '#666', margin: 0, paddingLeft: '16px' }}>
                        {displayResults.marketRates?.philippines.openai.insights.slice(0, 2).map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Badge color="green" text="As per Gemini" />
                      <Statistic
                        value={`$${displayResults.marketRates?.philippines.gemini.min} - $${displayResults.marketRates?.philippines.gemini.max}`}
                        suffix="/hour"
                        style={{ marginBottom: '8px' }}
                      />
                      <ul style={{ fontSize: '11px', color: '#666', margin: 0, paddingLeft: '16px' }}>
                        {displayResults.marketRates?.philippines.gemini.insights.slice(0, 2).map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title={<span><span style={{ color: '#1890ff' }}>🇺🇸</span> USA Market</span>} size="small">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Badge color="blue" text="As per OpenAI" />
                      <Statistic
                        value={`$${displayResults.marketRates?.usa.openai.min} - $${displayResults.marketRates?.usa.openai.max}`}
                        suffix="/hour"
                        style={{ marginBottom: '8px' }}
                      />
                      <ul style={{ fontSize: '11px', color: '#666', margin: 0, paddingLeft: '16px' }}>
                        {displayResults.marketRates?.usa.openai.insights.slice(0, 2).map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Badge color="green" text="As per Gemini" />
                      <Statistic
                        value={`$${displayResults.marketRates?.usa.gemini.min} - $${displayResults.marketRates?.usa.gemini.max}`}
                        suffix="/hour"
                        style={{ marginBottom: '8px' }}
                      />
                      <ul style={{ fontSize: '11px', color: '#666', margin: 0, paddingLeft: '16px' }}>
                        {displayResults.marketRates?.usa.gemini.insights.slice(0, 2).map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </OptimizedFormFieldGroup>

          {/* Cost Calculator */}
          <OptimizedFormFieldGroup
            title="Cost Calculator"
            style={{ marginBottom: '24px' }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Markup Percentage: {markupPercentage}%</Text>
              <Slider
                min={0}
                max={100}
                value={markupPercentage}
                onChange={setMarkupPercentage}
                marks={{
                  0: '0%',
                  25: '25%',
                  50: '50%',
                  75: '75%',
                  100: '100%',
                }}
              />
            </div>
            
            {savings && (
              <>
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f6ffed', borderRadius: '6px' }}>
                  <Text strong style={{ color: '#52c41a' }}>Using Combined AI Analysis (Average of OpenAI & Gemini)</Text>
                </div>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title="PH Rate + Markup"
                      value={`$${savings.phRateWithMarkup}`}
                      suffix="/hour"
                      prefix={<DollarOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Annual Savings"
                      value={`$${savings.annualSavings.toLocaleString()}`}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<span style={{ color: '#52c41a' }}>💰</span>}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="3-Year Savings"
                      value={`$${savings.threeYearSavings.toLocaleString()}`}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<span style={{ color: '#52c41a' }}>📈</span>}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Savings %"
                      value={savings.savingsPercentage}
                      suffix="%"
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<span style={{ color: '#52c41a' }}>📊</span>}
                    />
                  </Col>
                </Row>
              </>
            )}
          </OptimizedFormFieldGroup>

          {/* Consolidated Talent Availability */}
          {displayResults.talentAvailability && (
            <OptimizedFormFieldGroup
              icon={<TeamOutlined />}
              title="Talent Availability Assessment"
              style={{ marginBottom: '24px' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card
                    title={<Badge color="blue" text="OpenAI Assessment" />}
                    size="small"
                    styles={{ body: { padding: '16px' } }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ textAlign: 'center' }}>
                        <Progress
                          type="circle"
                          percent={(displayResults.talentAvailability?.openai?.score || 0) * 10}
                          size={60}
                          strokeColor={{
                            '0%': (displayResults.talentAvailability?.openai?.score || 0) >= 7 ? '#87d068' : '#faad14',
                            '100%': (displayResults.talentAvailability?.openai?.score || 0) >= 7 ? '#52c41a' : '#fa8c16',
                          }}
                          format={() => `${displayResults.talentAvailability?.openai?.score || 0}/10`}
                        />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Badge 
                          status={displayResults.talentAvailability?.openai?.status === 'abundant' ? 'success' : 
                                 displayResults.talentAvailability?.openai?.status === 'moderate' ? 'processing' : 'warning'}
                          text={(displayResults.talentAvailability?.openai?.status || 'unknown').toUpperCase()}
                        />
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Timeline: {displayResults.talentAvailability?.openai?.timeline || 'N/A'}
                        </Text>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <Text strong style={{ fontSize: '12px' }}>Key Insights:</Text>
                        <ul style={{ fontSize: '11px', margin: '4px 0 0 0', paddingLeft: '16px' }}>
                          {(displayResults.talentAvailability?.openai?.insights || []).slice(0, 3).map((insight, index) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    title={<Badge color="green" text="Gemini Assessment" />}
                    size="small"
                    styles={{ body: { padding: '16px' } }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ textAlign: 'center' }}>
                        <Progress
                          type="circle"
                          percent={(displayResults.talentAvailability?.gemini?.score || 0) * 10}
                          size={60}
                          strokeColor={{
                            '0%': (displayResults.talentAvailability?.gemini?.score || 0) >= 7 ? '#87d068' : '#faad14',
                            '100%': (displayResults.talentAvailability?.gemini?.score || 0) >= 7 ? '#52c41a' : '#fa8c16',
                          }}
                          format={() => `${displayResults.talentAvailability?.gemini?.score || 0}/10`}
                        />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Badge 
                          status={displayResults.talentAvailability?.gemini?.status === 'abundant' ? 'success' : 
                                 displayResults.talentAvailability?.gemini?.status === 'moderate' ? 'processing' : 'warning'}
                          text={(displayResults.talentAvailability?.gemini?.status || 'unknown').toUpperCase()}
                        />
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Timeline: {displayResults.talentAvailability?.gemini?.timeline || 'N/A'}
                        </Text>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <Text strong style={{ fontSize: '12px' }}>Key Insights:</Text>
                        <ul style={{ fontSize: '11px', margin: '4px 0 0 0', paddingLeft: '16px' }}>
                          {(displayResults.talentAvailability?.gemini?.insights || []).slice(0, 3).map((insight, index) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </OptimizedFormFieldGroup>
          )}

          {/* Smart AI Generated Job Description */}
          {bestJobDescription && (
            <OptimizedFormFieldGroup
              icon={<FileTextOutlined />}
              title="AI Generated Job Description"
              style={{ marginBottom: '24px' }}
              extra={
                <Space>
                  <Badge 
                    count={'wordCount' in bestJobDescription ? `${bestJobDescription.wordCount || 0} words` : 'AI Generated'}
                    style={{ backgroundColor: '#52c41a' }}
                  />
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={useAIDescription}
                  >
                    Use This Description
                  </Button>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(bestJobDescription.content || '', 'Job Description')}
                  >
                    Copy
                  </Button>
                </Space>
              }
            >
              <div
                style={{
                  background: '#f9f9f9',
                  padding: '16px',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  whiteSpace: 'pre-line',
                  fontSize: '14px',
                  border: '1px solid #e8e8e8',
                  lineHeight: '1.6'
                }}
              >
                {bestJobDescription.content}
              </div>
              <div style={{ marginTop: '8px', textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {'wordCount' in bestJobDescription ? `${bestJobDescription.wordCount} words • ${bestJobDescription.readingTime} min read` : 'AI Generated Content'}
                </Text>
              </div>
            </OptimizedFormFieldGroup>
          )}

          {/* Smart AI Generated Applicant Pitch */}
          {bestRolePitch && (
            <OptimizedFormFieldGroup
              icon={<ThunderboltOutlined />}
              title="AI Generated Applicant Pitch"
              style={{ marginBottom: '24px' }}
              extra={
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(bestRolePitch.content || '', 'Applicant Pitch')}
                >
                  Copy Pitch
                </Button>
              }
            >
              <div
                style={{
                  background: '#f9f9f9',
                  padding: '16px',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  whiteSpace: 'pre-line',
                  fontSize: '14px',
                  border: '1px solid #e8e8e8',
                  lineHeight: '1.6'
                }}
              >
                {bestRolePitch.content}
              </div>
              <div style={{ marginTop: '12px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Key Highlights:</Text>
                <Space size="small" wrap>
                  {('keyPoints' in bestRolePitch && bestRolePitch.keyPoints) ? bestRolePitch.keyPoints.map((point: string, index: number) => (
                    <Badge key={index} count={point} style={{ backgroundColor: '#87d068', fontSize: '11px' }} />
                  )) : null}
                </Space>
              </div>
            </OptimizedFormFieldGroup>
          )}
        </>
      )}

      <Divider />

      {/* Job Description Form */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
      >
        <OptimizedFormFieldGroup
          icon={<FileTextOutlined />}
          title="Job Description"
          extra={
            <Button
              type="link"
              onClick={() => {
                const template = `We are seeking a talented ${data.title || '[Job Title]'} to join our ${data.department || '[Department]'} team.

Key Responsibilities:
${Array.isArray(data.responsibilities) ? data.responsibilities.map(r => `• ${r}`).join('\n') : '• [Key responsibilities will be listed here]'}

Requirements:
${Array.isArray(data.requirements) ? data.requirements.map(r => `• ${r}`).join('\n') : '• [Requirements will be listed here]'}

What We Offer:
• Competitive salary and benefits
• Flexible work arrangements (${data.location_type || 'remote'})
• Professional development opportunities

About ${data.company_name || '[Company Name]'}:
We are committed to innovation and excellence.`;
                
                form.setFieldValue('description', template);
                handleFormChange({}, { description: template });
              }}
              size="small"
            >
              Use Template
            </Button>
          }
        >
          <Form.Item
            name="description"
            rules={[
              { required: true, message: 'Please provide a job description' },
              { min: 100, message: 'Job description should be at least 100 characters' }
            ]}
          >
            <TextArea
              rows={15}
              placeholder="Write a comprehensive job description..."
              style={{ fontSize: '14px', lineHeight: '1.6' }}
            />
          </Form.Item>
          
          <div style={{ marginTop: '16px', padding: '12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
            <Text strong style={{ color: '#52c41a', display: 'block', marginBottom: '8px' }}>
              💡 Tips for a Great Job Description:
            </Text>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#52c41a' }}>
              <li>Start with an engaging overview of the role and company</li>
              <li>Be specific about responsibilities and expectations</li>
              <li>Highlight what makes your company unique</li>
              <li>Use inclusive language to attract diverse candidates</li>
            </ul>
          </div>
        </OptimizedFormFieldGroup>

        {/* Preview Section */}
        {data.description && data.description.length > 50 && (
          <OptimizedFormFieldGroup
            title="Preview" 
            style={{ marginTop: '24px' }}
          >
            <div 
              style={{ 
                whiteSpace: 'pre-line', 
                lineHeight: '1.6',
                fontSize: '14px',
                maxHeight: '200px',
                overflow: 'auto',
                padding: '12px',
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: '4px'
              }}
            >
              {data.description.substring(0, 500)}
              {data.description.length > 500 && '...'}
            </div>
            <div style={{ marginTop: '8px', textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {data.description.length} characters • Reading time: {Math.ceil(data.description.split(' ').length / 200)} min
              </Text>
            </div>
          </OptimizedFormFieldGroup>
        )}
      </Form>
    </WizardStageLayout>
  );
});

PositionAnalysisStage.displayName = 'PositionAnalysisStage';

export default PositionAnalysisStage;