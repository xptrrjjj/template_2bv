'use client';

import React, { useState, useCallback, useRef, useMemo, memo } from 'react';
import '@/styles/wizard-performance.css';
import {
  Modal,
  Steps,
  Button,
  Space,
  Card,
  Typography,
  Progress,
  App,
} from 'antd';
import {
  BuildOutlined,
  InfoCircleOutlined,
  CodeOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  JobRoleWizardState,
  JobRoleWizardData,
  JOB_ROLE_WIZARD_STAGES,
} from '@/types/job-roles';
import { jobRoleService } from '@/services/jobRoles';
import { useAuth } from '@/contexts/AuthContext';

// Import stage components
import CompanyStage from './wizard-stages/CompanyStage';
import BasicInfoStage from './wizard-stages/BasicInfoStage';
import SkillsStage from './wizard-stages/SkillsStage';
import PositionAnalysisStage from './wizard-stages/PositionAnalysisStage';
import ReviewStage from './wizard-stages/ReviewStage';

const { Title, Text } = Typography;

interface JobRoleWizardProps {
  visible: boolean;
  onCancel: () => void;
  onComplete: () => void;
  editMode?: boolean;
  initialData?: JobRoleWizardData;
  roleId?: string;
}

const STAGE_ICONS = [
  <BuildOutlined key="company" />,
  <InfoCircleOutlined key="basic" />,
  <CodeOutlined key="skills" />,
  <BarChartOutlined key="analysis" />,
  <CheckCircleOutlined key="review" />,
];

const JobRoleWizard = memo<JobRoleWizardProps>(function JobRoleWizard({ 
  visible, 
  onCancel, 
  onComplete, 
  editMode = false, 
  initialData = {}, 
  roleId 
}) {
  const { message } = App.useApp();
  const { user } = useAuth();
  
  const [wizardState, setWizardState] = useState<JobRoleWizardState>({
    currentStage: 1,
    completedStages: editMode ? [1, 2, 3, 4] : [], // Mark all stages as completed in edit mode
    data: editMode ? initialData : {},
    isValid: editMode ? { 1: true, 2: true, 3: true, 4: true, 5: true } : {}, // Mark all stages as valid in edit mode
  });
  
  const [loading, setLoading] = useState(false);
  const wizardStateRef = useRef(wizardState);
  
  // Keep ref in sync with state
  wizardStateRef.current = wizardState;

  // Stable callback references that won't cause re-renders
  const updateWizardData = useCallback((stageData: Partial<JobRoleWizardData>) => {
    setWizardState(prev => ({
      ...prev,
      data: { ...prev.data, ...stageData },
    }));
  }, []);

  const markStageValid = useCallback((stage: number, isValid: boolean) => {
    setWizardState(prev => ({
      ...prev,
      isValid: { ...prev.isValid, [stage]: isValid },
    }));
  }, []);

  const goToNext = useCallback(() => {
    setWizardState(prev => {
      const { currentStage, completedStages } = prev;
      
      if (currentStage < 5) {
        return {
          ...prev,
          currentStage: currentStage + 1,
          completedStages: [...completedStages.filter(s => s !== currentStage), currentStage],
        };
      }
      return prev;
    });
  }, []);

  const goToPrevious = useCallback(() => {
    setWizardState(prev => {
      const { currentStage } = prev;
      
      if (currentStage > 1) {
        return {
          ...prev,
          currentStage: currentStage - 1,
        };
      }
      return prev;
    });
  }, []);

  const goToStage = useCallback((stage: number) => {
    setWizardState(prev => {
      const { completedStages, currentStage } = prev;
      
      // Only allow navigation to completed stages or the next stage
      if (stage <= currentStage || completedStages.includes(stage - 1)) {
        return {
          ...prev,
          currentStage: stage,
        };
      }
      return prev;
    });
  }, []);

  const handleSaveDraft = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use ref to get current data without dependency
      const currentData = wizardStateRef.current.data;
      
      // Clean data to remove circular references and functions
      const cleanData = JSON.parse(JSON.stringify(currentData, (key, value) => {
        // Remove functions, undefined values, and circular references
        if (typeof value === 'function' || typeof value === 'undefined') {
          return undefined;
        }
        return value;
      }));
      
      // Convert wizard data to job role format
      const jobRoleData = {
        ...cleanData,
        status: 'draft' as const,
        openings_count: cleanData.number_of_resources || 1,
        filled_count: 0,
        published_to_teamtailor: false, // Always false for drafts
      };

      // Console log for debugging and then save
      console.log('=== JOB ROLE DATA TO BE SAVED ===');
      console.log(JSON.stringify(jobRoleData, null, 2));
      console.log('=== END OF DATA ===');
      
      if (editMode && roleId) {
        // Update existing job role
        await jobRoleService.updateJobRole(roleId, jobRoleData as JobRoleWizardData, user?.email || 'unknown@company.com');
        message.success('Job role updated successfully!');
      } else {
        // Create new job role
        await jobRoleService.createJobRole(jobRoleData as JobRoleWizardData, user?.email || 'unknown@company.com');
        message.success('Job role saved as draft successfully!');
      }
      onComplete();
      
      // Reset wizard state
      setWizardState({
        currentStage: 1,
        completedStages: [],
        data: {},
        isValid: {},
      });
      
    } catch (error) {
      console.error('Error saving job role draft:', error);
      message.error('Failed to save job role draft');
    } finally {
      setLoading(false);
    }
  }, [message, onComplete]);

  const handleCancel = useCallback(() => {
    // Reset wizard state when cancelled
    setWizardState({
      currentStage: 1,
      completedStages: [],
      data: {},
      isValid: {},
    });
    onCancel();
  }, [onCancel]);

  // Memoized stage validation callbacks to prevent re-renders
  const stageValidationCallbacks = useMemo(() => ({
    1: (valid: boolean) => markStageValid(1, valid),
    2: (valid: boolean) => markStageValid(2, valid),
    3: (valid: boolean) => markStageValid(3, valid),
    4: (valid: boolean) => markStageValid(4, valid),
    5: (valid: boolean) => markStageValid(5, valid),
  }), [markStageValid]);

  // Memoized current stage component to prevent unnecessary re-renders
  const currentStageComponent = useMemo(() => {
    const { currentStage, data } = wizardState;
    
    switch (currentStage) {
      case 1:
        return (
          <CompanyStage
            data={data}
            onDataChange={updateWizardData}
            onValidChange={stageValidationCallbacks[1]}
          />
        );
      case 2:
        return (
          <BasicInfoStage
            data={data}
            onDataChange={updateWizardData}
            onValidChange={stageValidationCallbacks[2]}
          />
        );
      case 3:
        return (
          <SkillsStage
            data={data}
            onDataChange={updateWizardData}
            onValidChange={stageValidationCallbacks[3]}
          />
        );
      case 4:
        return (
          <PositionAnalysisStage
            data={data}
            onDataChange={updateWizardData}
            onValidChange={stageValidationCallbacks[4]}
          />
        );
      case 5:
        return (
          <ReviewStage
            data={data}
            onDataChange={updateWizardData}
            onValidChange={stageValidationCallbacks[5]}
          />
        );
      default:
        return null;
    }
  }, [wizardState, updateWizardData, stageValidationCallbacks]);

  // Memoized derived values to prevent recalculation on every render
  const { currentStage, isValid, completedStages } = wizardState;
  const currentStageValid = useMemo(() => isValid[currentStage] ?? false, [isValid, currentStage]);
  const progress = useMemo(() => (completedStages.length / 5) * 100, [completedStages.length]);
  
  // Memoized steps configuration
  const stepsItems = useMemo(() => 
    JOB_ROLE_WIZARD_STAGES.map((stage, index) => ({
      title: stage.title,
      icon: STAGE_ICONS[index],
      status: completedStages.includes(stage.id) ? 'finish' as const : 
             currentStage === stage.id ? 'process' as const : 'wait' as const,
      disabled: stage.id > currentStage && !completedStages.includes(stage.id - 1)
    })), [completedStages, currentStage]);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BuildOutlined style={{ color: '#1890ff' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>{editMode ? 'Edit Job Role' : 'Create New Job Role'}</Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Step {currentStage} of 5: {JOB_ROLE_WIZARD_STAGES[currentStage - 1]?.description}
            </Text>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={1000}
      destroyOnHidden
      maskClosable={false}
    >
      <div className="job-role-wizard wizard-stage-content" style={{ padding: '24px 0' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <Progress 
            percent={progress} 
            strokeColor="#1890ff"
            showInfo={false}
            style={{ marginBottom: '16px' }}
          />
          
          {/* Steps */}
          <Steps
            current={currentStage - 1}
            onChange={goToStage}
            items={stepsItems}
            style={{ marginBottom: '32px' }}
          />
        </div>

        {/* Stage Content */}
        <Card
          style={{
            minHeight: '400px',
            marginBottom: '24px',
          }}
        >
          {currentStageComponent}
        </Card>

        {/* Navigation Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <div>
            <Button 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
          
          <Space>
            {currentStage > 1 && (
              <Button 
                onClick={goToPrevious}
                disabled={loading}
              >
                Previous
              </Button>
            )}
            
            {currentStage < 5 ? (
              <Button 
                type="primary" 
                onClick={goToNext}
                disabled={!currentStageValid || loading}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="primary" 
                onClick={handleSaveDraft}
                disabled={!currentStageValid}
                loading={loading}
              >
{editMode ? 'Update Role' : 'Save as Draft'}
              </Button>
            )}
          </Space>
        </div>
      </div>
    </Modal>
  );
});

export default JobRoleWizard;