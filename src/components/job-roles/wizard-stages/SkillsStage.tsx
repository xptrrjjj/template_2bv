'use client';

import React, { useState, memo, useMemo, useCallback, useRef } from 'react';
import {
  Form,
  Input,
  Typography,
  Space,
  Button,
  Tag,
  Modal,
  Alert,
  Card,
  App,
} from 'antd';
import {
  CodeOutlined,
  PlusOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { JobRoleWizardData } from '@/types/job-roles';
import { useSkillsForm } from '@/hooks/useWizardForm';
import { useAISkillsForJobRole } from '@/hooks/useAISkillGeneration';
import type { GeneratedSkills } from '@/services/ai/types';
import WizardStageLayout, { STAGE_GRADIENTS } from '@/components/job-roles/common/WizardStageLayout';
import FormFieldGroup from '@/components/job-roles/common/FormFieldGroup';

const { Text } = Typography;
const { TextArea } = Input;

interface SkillsStageProps {
  data: Partial<JobRoleWizardData>;
  onDataChange: (data: Partial<JobRoleWizardData>) => void;
  onValidChange: (valid: boolean) => void;
}

const SkillsStage = memo<SkillsStageProps>(function SkillsStage({ data, onDataChange, onValidChange }) {
  const { message } = App.useApp();
  const [aiPreviewModal, setAiPreviewModal] = useState(false);
  
  // Use consolidated form hook for skills stage
  const { form, handleFormChange } = useSkillsForm({
    data,
    onDataChange,
    onValidChange,
  });
  
  // AI skill generation hook
  const { 
    generateFromBasicInfo, 
    generatedSkills, 
    isGenerating, 
    generationError: aiError,
    clearGenerated: clearError 
  } = useAISkillsForJobRole();

  // Debounce ref for AI generation to prevent rapid successive calls
  const aiGenerationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized skill suggestions to prevent re-creating arrays on every render
  const skillSuggestions = useMemo(() => ({
    technical: [
      'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 
      'Kubernetes', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Git', 'CI/CD'
    ],
    soft: [
      'Team Leadership', 'Communication', 'Problem Solving', 'Agile/Scrum',
      'Project Management', 'Mentoring', 'Cross-functional Collaboration'
    ],
    responsibilities: [
      'Design and develop scalable applications',
      'Lead technical architecture decisions',
      'Mentor junior developers',
      'Collaborate with product and design teams',
      'Conduct code reviews',
      'Participate in technical planning'
    ]
  }), []);

  // Memoized suggestion handler to prevent re-creating on each render
  const addSuggestion = useCallback((field: string, suggestion: string) => {
    const currentValue = form.getFieldValue(field) || '';
    const newValue = currentValue ? `${currentValue}\n${suggestion}` : suggestion;
    form.setFieldValue(field, newValue);
    
    // Trigger form change
    const currentValues = form.getFieldsValue() as Record<string, string>;
    handleFormChange({}, {
      ...currentValues,
      [field]: newValue
    });
  }, [form, handleFormChange]);

  // Debounced AI skill generation handler
  const handleGenerateAISkills = useCallback(async () => {
    if (!data.company_name || !data.title || !data.level || !data.department || 
        !data.employment_type || !data.location || !data.location_type ||
        !data.contract_duration || !data.currency) {
      message.error('Please complete all basic information first');
      return;
    }

    // Clear any pending AI generation calls
    if (aiGenerationTimeoutRef.current) {
      clearTimeout(aiGenerationTimeoutRef.current);
    }

    // Debounce AI generation to prevent rapid successive calls
    aiGenerationTimeoutRef.current = setTimeout(async () => {
      try {
        clearError();
        const result = await generateFromBasicInfo(
          {
            title: data.title || '',
            level: data.level || 'mid',
            department: data.department || '',
            employment_type: data.employment_type || 'full-time',
            location: data.location || '',
            location_type: data.location_type || 'remote',
            desired_minimum_years_experience: data.desired_minimum_years_experience || 0,
            currency: data.currency || 'USD',
            target_budget_usd: data.target_budget_usd || 0,
            time_zone: data.time_zone || '',
            contract_duration: data.contract_duration || '',
          },
          data.company_name || ''
        );
        if (result) {
          setAiPreviewModal(true);
        }
      } catch (error) {
        console.error('AI skill generation failed:', error);
        message.error('Failed to generate AI skills. Please try again.');
      }
    }, 300); // 300ms debounce
  }, [data, message, generateFromBasicInfo, clearError]);

  // Memoized AI skills application handler
  const applyAISkills = useCallback((skillType: 'requirements' | 'preferred_qualifications' | 'responsibilities') => {
    if (!generatedSkills) return;
    
    const skills = generatedSkills[skillType];
    if (skills && Array.isArray(skills)) {
      const skillText = skills.join('\n');
      form.setFieldValue(skillType, skillText);
      
      // Trigger form change
      const currentValues = form.getFieldsValue() as Record<string, string>;
      handleFormChange({}, {
        ...currentValues,
        [skillType]: skillText
      });
      
      message.success(`${skillType.replace('_', ' ')} applied successfully!`);
    }
  }, [generatedSkills, form, handleFormChange, message]);

  // Memoized handler for applying all AI skills at once
  const applyAllAISkills = useCallback(() => {
    if (!generatedSkills) return;
    
    const formValues = form.getFieldsValue() as Record<string, string>;
    const updatedValues = { ...formValues };
    
    // Apply each skill type
    ['requirements', 'preferred_qualifications', 'responsibilities'].forEach(skillType => {
      const skills = generatedSkills[skillType as keyof GeneratedSkills];
      if (skills && Array.isArray(skills)) {
        updatedValues[skillType] = skills.join('\n');
      }
    });
    
    form.setFieldsValue(updatedValues);
    handleFormChange({}, updatedValues);
    
    setAiPreviewModal(false);
    message.success('All AI-generated skills applied successfully!');
  }, [generatedSkills, form, handleFormChange, message]);

  // Memoized suggestion tags to prevent re-rendering
  const technicalSkillTags = useMemo(() => 
    skillSuggestions.technical.map(skill => (
      <Tag
        key={skill}
        style={{ cursor: 'pointer', marginBottom: '4px' }}
        onClick={() => addSuggestion('requirements', `• ${skill} experience`)}
      >
        <PlusOutlined style={{ marginRight: '4px' }} />
        {skill}
      </Tag>
    )), [skillSuggestions.technical, addSuggestion]);

  const softSkillTags = useMemo(() => 
    skillSuggestions.soft.map(skill => (
      <Tag
        key={skill}
        color="blue"
        style={{ cursor: 'pointer', marginBottom: '4px' }}
        onClick={() => addSuggestion('requirements', `• ${skill}`)}
      >
        <PlusOutlined style={{ marginRight: '4px' }} />
        {skill}
      </Tag>
    )), [skillSuggestions.soft, addSuggestion]);

  const responsibilityTags = useMemo(() => 
    skillSuggestions.responsibilities.map(resp => (
      <Tag
        key={resp}
        color="green"
        style={{ cursor: 'pointer', marginBottom: '4px' }}
        onClick={() => addSuggestion('responsibilities', `• ${resp}`)}
      >
        <PlusOutlined style={{ marginRight: '4px' }} />
        {resp}
      </Tag>
    )), [skillSuggestions.responsibilities, addSuggestion]);

  // Memoized modal handlers
  const handleModalCancel = useCallback(() => setAiPreviewModal(false), []);

  return (
    <WizardStageLayout
      icon={<CodeOutlined />}
      title="Skills & Requirements"
      description="Define the skills, qualifications, and responsibilities for this role"
      gradientColors={STAGE_GRADIENTS.skills}
    >

      <Form
        form={form as any}
        layout="vertical"
        onValuesChange={handleFormChange}
      >
        {/* AI Generation Section */}
        <FormFieldGroup
          icon={<RobotOutlined />}
          title="AI-Powered Skill Generation"
          style={{ marginBottom: '24px' }}
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Generate skills and requirements based on your job details from the previous step
            </Text>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerateAISkills}
              loading={isGenerating}
              disabled={!data.title || !data.level}
              style={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
              }}
            >
              {isGenerating ? 'Generating AI Skills...' : 'Generate AI Skills'}
            </Button>
            
            {aiError && (
              <Alert
                message="AI Generation Error"
                description={aiError}
                type="error"
                showIcon
                closable
                onClose={clearError}
                style={{ marginTop: '16px' }}
              />
            )}
            
            {(!data.title || !data.level) && (
              <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}>
                Complete basic information first to use AI generation
              </Text>
            )}
          </div>
        </FormFieldGroup>

        {/* Required Skills */}
        <FormFieldGroup
          icon={<CodeOutlined />}
          title="Required Skills & Qualifications"
        >
          <Form.Item
            name="requirements"
            rules={[{ required: true, message: 'Please enter at least one requirement' }]}
          >
            <TextArea
              rows={6}
              placeholder="Enter each requirement on a new line:&#10;• 5+ years of software development experience&#10;• Proficiency in React and TypeScript&#10;• Experience with modern CI/CD practices"
            />
          </Form.Item>
          
          <div style={{ marginTop: '16px' }}>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>
              Technical Skills Suggestions:
            </Text>
            <Space wrap>
              {technicalSkillTags}
            </Space>
          </div>
          
          <div style={{ marginTop: '12px' }}>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>
              Soft Skills Suggestions:
            </Text>
            <Space wrap>
              {softSkillTags}
            </Space>
          </div>
        </FormFieldGroup>

        {/* Preferred Qualifications */}
        <FormFieldGroup
          title="Preferred Qualifications (Optional)"
          style={{ marginBottom: '24px' }}
        >
          <Form.Item name="preferred_qualifications">
            <TextArea
              rows={4}
              placeholder="Enter each preferred qualification on a new line:&#10;• Experience with cloud platforms (AWS/GCP)&#10;• Leadership experience&#10;• Previous startup experience"
            />
          </Form.Item>
          
          <Text type="secondary" style={{ fontSize: '12px' }}>
            These are nice-to-have qualifications that would be beneficial but not required
          </Text>
        </FormFieldGroup>

        {/* Key Responsibilities */}
        <FormFieldGroup
          title="Key Responsibilities"
        >
          <Form.Item
            name="responsibilities"
            rules={[{ required: true, message: 'Please enter at least one responsibility' }]}
          >
            <TextArea
              rows={6}
              placeholder="Enter each responsibility on a new line:&#10;• Design and develop scalable web applications&#10;• Collaborate with cross-functional teams&#10;• Mentor junior developers"
            />
          </Form.Item>
          
          <div style={{ marginTop: '16px' }}>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>
              Common Responsibilities:
            </Text>
            <Space wrap>
              {responsibilityTags}
            </Space>
          </div>
        </FormFieldGroup>
      </Form>

      {/* AI Skills Preview Modal */}
      <Modal
        title="AI Generated Skills Preview"
        open={aiPreviewModal}
        onCancel={handleModalCancel}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleModalCancel}>
            Cancel
          </Button>,
          <Button key="apply" type="primary" onClick={applyAllAISkills}>
            <CheckOutlined /> Apply All Skills
          </Button>,
        ]}
      >
        {generatedSkills && (
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {/* Requirements Section */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Text strong>Required Skills & Qualifications</Text>
                <Button 
                  size="small" 
                  type="link" 
                  onClick={() => applyAISkills('requirements')}
                >
                  Apply These Only
                </Button>
              </div>
              <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '4px' }}>
                {generatedSkills.requirements?.map((req: string, index: number) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <Text>{req}</Text>
                  </div>
                ))}
              </div>
            </Card>

            {/* Preferred Qualifications Section */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Text strong>Preferred Qualifications</Text>
                <Button 
                  size="small" 
                  type="link" 
                  onClick={() => applyAISkills('preferred_qualifications')}
                >
                  Apply These Only
                </Button>
              </div>
              <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '4px' }}>
                {generatedSkills.preferred_qualifications?.map((qual: string, index: number) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <Text>{qual}</Text>
                  </div>
                ))}
              </div>
            </Card>

            {/* Responsibilities Section */}
            <Card size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <Text strong>Key Responsibilities</Text>
                <Button 
                  size="small" 
                  type="link" 
                  onClick={() => applyAISkills('responsibilities')}
                >
                  Apply These Only
                </Button>
              </div>
              <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '4px' }}>
                {generatedSkills.responsibilities?.map((resp: string, index: number) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <Text>{resp}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </WizardStageLayout>
  );
});

export default SkillsStage;