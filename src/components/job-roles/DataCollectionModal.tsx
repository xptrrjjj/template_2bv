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
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  FilterOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { 
  JobRoleWithStats, 
  DataCollectionData, 
  InterviewerInfo,
} from '@/types/job-roles';
import InterviewSetup from './data-collection/InterviewSetup';
import SystemsAccess from './data-collection/SystemsAccess';
import ApplicationQuestions from './data-collection/ApplicationQuestions';
import SiftingCriteria from './data-collection/SiftingCriteria';

interface DataCollectionModalProps {
  role: JobRoleWithStats;
  visible: boolean;
  onClose: () => void;
  onSave: (data: DataCollectionData) => void;
  loading?: boolean;
}

/**
 * DataCollectionModal Component
 * 
 * Refactored to follow SOLID principles:
 * - Single Responsibility: Only handles modal orchestration and form management
 * - Open/Closed: Extensible through component composition
 * - Dependency Inversion: Depends on abstracted components
 * 
 * Extracted complex sections into dedicated components:
 * - InterviewSetup: Skills and client interview configuration
 * - SystemsAccess: Device, Microsoft 365, and tools requirements
 * - ApplicationQuestions: US shift experience and custom questions
 * - SiftingCriteria: Must-have skills, nice-to-have, and disqualifiers
 */
const DataCollectionModal: React.FC<DataCollectionModalProps> = ({
  role,
  visible,
  onClose,
  onSave,
  loading = false
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('interview');
  const [skillsInterviewers, setSkillsInterviewers] = useState<InterviewerInfo[]>([]);
  const [clientInterviewers, setClientInterviewers] = useState<InterviewerInfo[]>([]);
  const [customQuestions, setCustomQuestions] = useState<string[]>(['']);
  const [mustHaveSkills, setMustHaveSkills] = useState<string[]>(['']);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>(['']);
  const [disqualifiers, setDisqualifiers] = useState<string[]>(['']);
  const [microsoftApps, setMicrosoftApps] = useState<string[]>([]);
  const [additionalTools, setAdditionalTools] = useState<string[]>(['']);

  // Initialize form with existing data
  useEffect(() => {
    if (role.data_collection && visible) {
      const data = role.data_collection;
      
      // Set form values
      form.setFieldsValue({
        // Interview Setup
        interview_kit_name: data.interview_setup.skills_interview.interview_kit_name,
        max_interviews_per_day: data.interview_setup.skills_interview.max_interviews_per_day,
        joint_or_separate: data.interview_setup.skills_interview.joint_or_separate,
        timezone_preference: data.interview_setup.skills_interview.timezone_preference,
        interview_notes: data.interview_setup.skills_interview.notes,
        client_interview_required: data.interview_setup.final_interview.client_interview_required,
        client_availability: data.interview_setup.final_interview.availability,
        final_interview_notes: data.interview_setup.final_interview.notes,
        
        // Systems & Access
        device_provided: data.systems_access.device_provided,
        microsoft_365_required: data.systems_access.microsoft_365_required,
        sharepoint_requirements: data.systems_access.sharepoint_access_requirements,
        
        // Application Questions
        us_shift_experience: data.application_questions.us_shift_experience,
        
        // Sifting
        sifting_owner: data.sifting_criteria.sifting_owner,
        sifting_notes: data.sifting_criteria.notes,
      });
      
      // Set array states
      setSkillsInterviewers(data.interview_setup.skills_interview.interviewers || []);
      setClientInterviewers(data.interview_setup.final_interview.client_interviewers || []);
      setMicrosoftApps(data.systems_access.microsoft_apps_required || []);
      setAdditionalTools(data.systems_access.additional_tools_software || ['']);
      setCustomQuestions(data.application_questions.custom_questions.length > 0 ? data.application_questions.custom_questions : ['']);
      setMustHaveSkills(data.sifting_criteria.must_have_skills.length > 0 ? data.sifting_criteria.must_have_skills : ['']);
      setNiceToHaveSkills(data.sifting_criteria.nice_to_have_skills.length > 0 ? data.sifting_criteria.nice_to_have_skills : ['']);
      setDisqualifiers(data.sifting_criteria.disqualifiers_red_flags.length > 0 ? data.sifting_criteria.disqualifiers_red_flags : ['']);
    } else if (visible) {
      // Initialize with empty arrays for new data collection
      setSkillsInterviewers([]);
      setClientInterviewers([]);
      setCustomQuestions(['']);
      setMustHaveSkills(['']);
      setNiceToHaveSkills(['']);
      setDisqualifiers(['']);
      setMicrosoftApps([]);
      setAdditionalTools(['']);
      form.resetFields();
    }
  }, [role.data_collection, visible, form]);

  const handleSubmit = async (values: any) => {
    try {
      const dataCollectionData: DataCollectionData = {
        interview_setup: {
          skills_interview: {
            interviewers: skillsInterviewers.filter(i => i.name && i.email),
            interview_kit_name: values.interview_kit_name,
            max_interviews_per_day: values.max_interviews_per_day,
            joint_or_separate: values.joint_or_separate,
            timezone_preference: values.timezone_preference,
            notes: values.interview_notes,
          },
          final_interview: {
            client_interview_required: values.client_interview_required,
            client_interviewers: clientInterviewers.filter(i => i.name && i.email),
            availability: values.client_availability,
            notes: values.final_interview_notes,
          }
        },
        systems_access: {
          device_provided: values.device_provided,
          microsoft_365_required: values.microsoft_365_required,
          microsoft_apps_required: microsoftApps,
          sharepoint_access_requirements: values.sharepoint_requirements,
          additional_tools_software: additionalTools.filter(tool => tool.trim()),
        },
        application_questions: {
          us_shift_experience: values.us_shift_experience,
          custom_questions: customQuestions.filter(q => q.trim()),
        },
        sifting_criteria: {
          must_have_skills: mustHaveSkills.filter(skill => skill.trim()),
          nice_to_have_skills: niceToHaveSkills.filter(skill => skill.trim()),
          disqualifiers_red_flags: disqualifiers.filter(flag => flag.trim()),
          sifting_owner: values.sifting_owner,
          notes: values.sifting_notes,
        },
        completion_metadata: {
          completed_at: new Date().toISOString(),
          completed_by: 'current-user', // TODO: Get actual user
        }
      };

      onSave(dataCollectionData);
      message.success('Data collection completed successfully!');
    } catch (error) {
      console.error('Error saving data collection:', error);
      message.error('Failed to save data collection');
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>Data Collection: {role.title}</span>
          <Tag color="processing">Data Collection Stage</Tag>
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
          Complete Data Collection
        </Button>
      ]}
      styles={{ body: { maxHeight: '80vh', overflowY: 'auto' } }}
    >
      <Alert
        message="Data Collection Stage"
        description="Gather comprehensive information required for job setup, interviews, and candidate evaluation process."
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
              key: 'interview',
              label: (
                <span>
                  <UserOutlined />
                  Interview Setup
                </span>
              ),
              children: (
                <InterviewSetup 
                  skillsInterviewers={skillsInterviewers}
                  clientInterviewers={clientInterviewers}
                  onSkillsInterviewersChange={setSkillsInterviewers}
                  onClientInterviewersChange={setClientInterviewers}
                />
              )
            },
            {
              key: 'systems',
              label: (
                <span>
                  <SettingOutlined />
                  Systems & Access
                </span>
              ),
              children: (
                <SystemsAccess 
                  microsoftApps={microsoftApps}
                  additionalTools={additionalTools}
                  onMicrosoftAppsChange={setMicrosoftApps}
                  onAdditionalToolsChange={setAdditionalTools}
                />
              )
            },
            {
              key: 'questions',
              label: (
                <span>
                  <QuestionCircleOutlined />
                  Application Questions
                </span>
              ),
              children: (
                <ApplicationQuestions 
                  customQuestions={customQuestions}
                  onCustomQuestionsChange={setCustomQuestions}
                />
              )
            },
            {
              key: 'sifting',
              label: (
                <span>
                  <FilterOutlined />
                  Sifting Criteria
                </span>
              ),
              children: (
                <SiftingCriteria 
                  mustHaveSkills={mustHaveSkills}
                  niceToHaveSkills={niceToHaveSkills}
                  disqualifiers={disqualifiers}
                  onMustHaveSkillsChange={setMustHaveSkills}
                  onNiceToHaveSkillsChange={setNiceToHaveSkills}
                  onDisqualifiersChange={setDisqualifiers}
                />
              )
            }
          ]}
        />
      </Form>
    </Modal>
  );
};

export default DataCollectionModal;