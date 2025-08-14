'use client';

import React from 'react';
import { Form, Input, Select, Button, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ApplicationQuestionsProps {
  customQuestions: string[];
  onCustomQuestionsChange: (questions: string[]) => void;
}

/**
 * ApplicationQuestions Component
 * 
 * Handles application questions configuration
 * Follows Single Responsibility Principle - only manages application questions
 */
const ApplicationQuestions: React.FC<ApplicationQuestionsProps> = ({
  customQuestions,
  onCustomQuestionsChange,
}) => {
  const updateQuestion = (index: number, value?: string) => {
    if (value !== undefined) {
      const newQuestions = [...customQuestions];
      newQuestions[index] = value;
      onCustomQuestionsChange(newQuestions);
    } else {
      // Remove item
      onCustomQuestionsChange(customQuestions.filter((_, i) => i !== index));
    }
  };

  const addQuestion = () => {
    onCustomQuestionsChange([...customQuestions, '']);
  };

  return (
    <div>
      <Form.Item
        name="us_shift_experience"
        label="Experience Working US Shift"
        rules={[{ required: true, message: 'Please specify US shift requirement' }]}
      >
        <Select placeholder="Select requirement level">
          <Option value="required">Required</Option>
          <Option value="preferred">Preferred</Option>
          <Option value="not_required">Not Required</Option>
        </Select>
      </Form.Item>

      <div style={{ marginBottom: '16px' }}>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Custom Application Questions</Text>
        {customQuestions.map((question, index) => (
          <div key={index} style={{ display: 'flex', marginBottom: '8px' }}>
            <TextArea
              value={question}
              onChange={(e) => updateQuestion(index, e.target.value)}
              placeholder="Enter application question"
              rows={2}
              style={{ marginRight: '8px' }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => updateQuestion(index)}
            />
          </div>
        ))}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addQuestion}
        >
          Add Question
        </Button>
      </div>
    </div>
  );
};

export default ApplicationQuestions;