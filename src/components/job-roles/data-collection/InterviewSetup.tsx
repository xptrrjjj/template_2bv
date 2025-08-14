'use client';

import React from 'react';
import { Form, Input, Select, Button, Table, Collapse, Row, Col, Typography, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { InterviewerInfo, TIME_ZONES } from '@/types/job-roles';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface InterviewSetupProps {
  skillsInterviewers: InterviewerInfo[];
  clientInterviewers: InterviewerInfo[];
  onSkillsInterviewersChange: (interviewers: InterviewerInfo[]) => void;
  onClientInterviewersChange: (interviewers: InterviewerInfo[]) => void;
}

/**
 * InterviewSetup Component
 * 
 * Handles interview configuration including skills and client interviews
 * Follows Single Responsibility Principle - only manages interview setup
 */
const InterviewSetup: React.FC<InterviewSetupProps> = ({
  skillsInterviewers,
  clientInterviewers,
  onSkillsInterviewersChange,
  onClientInterviewersChange,
}) => {
  // Create table columns for skills interviewers
  const skillsInterviewerColumns: ColumnType<InterviewerInfo>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Input 
          value={text} 
          onChange={(e) => {
            const newInterviewers = [...skillsInterviewers];
            newInterviewers[index].name = e.target.value;
            onSkillsInterviewersChange(newInterviewers);
          }}
          placeholder="Full Name"
        />
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Input 
          value={text} 
          onChange={(e) => {
            const newInterviewers = [...skillsInterviewers];
            newInterviewers[index].email = e.target.value;
            onSkillsInterviewersChange(newInterviewers);
          }}
          placeholder="email@company.com"
        />
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Input 
          value={text} 
          onChange={(e) => {
            const newInterviewers = [...skillsInterviewers];
            newInterviewers[index].role = e.target.value;
            onSkillsInterviewersChange(newInterviewers);
          }}
          placeholder="Senior Developer"
        />
      )
    },
    {
      title: 'Time Zone',
      dataIndex: 'timezone',
      key: 'timezone',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Select 
          value={text} 
          onChange={(value) => {
            const newInterviewers = [...skillsInterviewers];
            newInterviewers[index].timezone = value;
            onSkillsInterviewersChange(newInterviewers);
          }}
          placeholder="Select timezone"
          style={{ width: '100%' }}
        >
          {TIME_ZONES.map(tz => (
            <Option key={tz.value} value={tz.value}>{tz.label}</Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Availability',
      dataIndex: 'availability_hours',
      key: 'availability_hours',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Input 
          value={text} 
          onChange={(e) => {
            const newInterviewers = [...skillsInterviewers];
            newInterviewers[index].availability_hours = e.target.value;
            onSkillsInterviewersChange(newInterviewers);
          }}
          placeholder="9AM-5PM EST"
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 60,
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onSkillsInterviewersChange(skillsInterviewers.filter((_, i) => i !== index))}
        />
      )
    }
  ];

  // Create table columns for client interviewers
  const clientInterviewerColumns: ColumnType<InterviewerInfo>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Input 
          value={text} 
          onChange={(e) => {
            const newInterviewers = [...clientInterviewers];
            newInterviewers[index].name = e.target.value;
            onClientInterviewersChange(newInterviewers);
          }}
          placeholder="Full Name"
        />
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Input 
          value={text} 
          onChange={(e) => {
            const newInterviewers = [...clientInterviewers];
            newInterviewers[index].email = e.target.value;
            onClientInterviewersChange(newInterviewers);
          }}
          placeholder="email@company.com"
        />
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Input 
          value={text} 
          onChange={(e) => {
            const newInterviewers = [...clientInterviewers];
            newInterviewers[index].role = e.target.value;
            onClientInterviewersChange(newInterviewers);
          }}
          placeholder="Senior Developer"
        />
      )
    },
    {
      title: 'Time Zone',
      dataIndex: 'timezone',
      key: 'timezone',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Select 
          value={text} 
          onChange={(value) => {
            const newInterviewers = [...clientInterviewers];
            newInterviewers[index].timezone = value;
            onClientInterviewersChange(newInterviewers);
          }}
          placeholder="Select timezone"
          style={{ width: '100%' }}
        >
          {TIME_ZONES.map(tz => (
            <Option key={tz.value} value={tz.value}>{tz.label}</Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Availability',
      dataIndex: 'availability_hours',
      key: 'availability_hours',
      render: (text: string, record: InterviewerInfo, index: number) => (
        <Input 
          value={text} 
          onChange={(e) => {
            const newInterviewers = [...clientInterviewers];
            newInterviewers[index].availability_hours = e.target.value;
            onClientInterviewersChange(newInterviewers);
          }}
          placeholder="9AM-5PM EST"
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 60,
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onClientInterviewersChange(clientInterviewers.filter((_, i) => i !== index))}
        />
      )
    }
  ];

  return (
    <Collapse 
      defaultActiveKey={['skills', 'final']}
      items={[
        {
          key: 'skills',
          label: 'Skills Interview Configuration',
          children: (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="interview_kit_name"
                    label="Interview Kit Name"
                  >
                    <Input placeholder="e.g., Senior React Developer Kit" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="max_interviews_per_day"
                    label="Max Interviews Per Day"
                  >
                    <InputNumber min={1} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="joint_or_separate"
                    label="Interview Format"
                  >
                    <Select placeholder="Select interview format">
                      <Option value="joint">Joint Interview</Option>
                      <Option value="separate">Separate Interviews</Option>
                      <Option value="flexible">Flexible</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="timezone_preference"
                    label="Preferred Time Zone"
                  >
                    <Select placeholder="Select timezone">
                      {TIME_ZONES.map(tz => (
                        <Option key={tz.value} value={tz.value}>{tz.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text strong>Available Interviewers</Text>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => onSkillsInterviewersChange([...skillsInterviewers, { name: '', email: '', role: '', timezone: '' }])}
                  >
                    Add Interviewer
                  </Button>
                </div>
                <Table
                  dataSource={skillsInterviewers}
                  columns={skillsInterviewerColumns}
                  pagination={false}
                  size="small"
                  rowKey={(record) => `skills-interviewer-${record.name}-${record.email}`}
                />
              </div>

              <Form.Item
                name="interview_notes"
                label="Interview Notes"
              >
                <TextArea rows={3} placeholder="Additional notes for skills interview setup..." />
              </Form.Item>
            </div>
          )
        },
        {
          key: 'final',
          label: 'Final/Client Interview Configuration',
          children: (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="client_interview_required"
                    label="Client Interview Required"
                    rules={[{ required: true, message: 'Please specify if client interview is required' }]}
                  >
                    <Select placeholder="Select requirement">
                      <Option value="yes">Yes</Option>
                      <Option value="no">No</Option>
                      <Option value="tbc">To Be Confirmed</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="client_availability"
                    label="Client Availability"
                  >
                    <Input placeholder="e.g., Weekdays 2-5PM EST" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text strong>Client Interviewers</Text>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => onClientInterviewersChange([...clientInterviewers, { name: '', email: '', role: '', timezone: '' }])}
                  >
                    Add Client Interviewer
                  </Button>
                </div>
                <Table
                  dataSource={clientInterviewers}
                  columns={clientInterviewerColumns}
                  pagination={false}
                  size="small"
                  rowKey={(record) => `client-interviewer-${record.name}-${record.email}`}
                />
              </div>

              <Form.Item
                name="final_interview_notes"
                label="Final Interview Notes"
              >
                <TextArea rows={3} placeholder="Additional notes for final interview setup..." />
              </Form.Item>
            </div>
          )
        }
      ]}
    />
  );
};

export default InterviewSetup;