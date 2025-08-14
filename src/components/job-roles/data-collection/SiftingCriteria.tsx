'use client';

import React from 'react';
import { Form, Input, Button, Row, Col, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

interface SiftingCriteriaProps {
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  disqualifiers: string[];
  onMustHaveSkillsChange: (skills: string[]) => void;
  onNiceToHaveSkillsChange: (skills: string[]) => void;
  onDisqualifiersChange: (disqualifiers: string[]) => void;
}

/**
 * SiftingCriteria Component
 * 
 * Handles sifting criteria configuration including skills and disqualifiers
 * Follows Single Responsibility Principle - only manages sifting criteria
 */
const SiftingCriteria: React.FC<SiftingCriteriaProps> = ({
  mustHaveSkills,
  niceToHaveSkills,
  disqualifiers,
  onMustHaveSkillsChange,
  onNiceToHaveSkillsChange,
  onDisqualifiersChange,
}) => {
  const updateSkill = (
    setter: (skills: string[]) => void,
    array: string[],
    index: number,
    value?: string
  ) => {
    if (value !== undefined) {
      const newArray = [...array];
      newArray[index] = value;
      setter(newArray);
    } else {
      // Remove item
      setter(array.filter((_, i) => i !== index));
    }
  };

  const addSkill = (
    setter: (skills: string[]) => void,
    array: string[]
  ) => {
    setter([...array, '']);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Must Have Skills</Text>
        {mustHaveSkills.map((skill, index) => (
          <div key={index} style={{ display: 'flex', marginBottom: '8px' }}>
            <Input
              value={skill}
              onChange={(e) => updateSkill(onMustHaveSkillsChange, mustHaveSkills, index, e.target.value)}
              placeholder="Enter must-have skill"
              style={{ marginRight: '8px' }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => updateSkill(onMustHaveSkillsChange, mustHaveSkills, index)}
            />
          </div>
        ))}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => addSkill(onMustHaveSkillsChange, mustHaveSkills)}
        >
          Add Must-Have Skill
        </Button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Nice to Have Skills</Text>
        {niceToHaveSkills.map((skill, index) => (
          <div key={index} style={{ display: 'flex', marginBottom: '8px' }}>
            <Input
              value={skill}
              onChange={(e) => updateSkill(onNiceToHaveSkillsChange, niceToHaveSkills, index, e.target.value)}
              placeholder="Enter nice-to-have skill"
              style={{ marginRight: '8px' }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => updateSkill(onNiceToHaveSkillsChange, niceToHaveSkills, index)}
            />
          </div>
        ))}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => addSkill(onNiceToHaveSkillsChange, niceToHaveSkills)}
        >
          Add Nice-to-Have Skill
        </Button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Disqualifiers / Red Flags</Text>
        {disqualifiers.map((flag, index) => (
          <div key={index} style={{ display: 'flex', marginBottom: '8px' }}>
            <Input
              value={flag}
              onChange={(e) => updateSkill(onDisqualifiersChange, disqualifiers, index, e.target.value)}
              placeholder="Enter disqualifier/red flag"
              style={{ marginRight: '8px' }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => updateSkill(onDisqualifiersChange, disqualifiers, index)}
            />
          </div>
        ))}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => addSkill(onDisqualifiersChange, disqualifiers)}
        >
          Add Disqualifier
        </Button>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="sifting_owner"
            label="Sifting Process Owner"
          >
            <Input placeholder="Who will own the sifting process?" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="sifting_notes"
        label="Sifting Notes"
      >
        <TextArea rows={4} placeholder="Additional notes for the sifting process..." />
      </Form.Item>
    </div>
  );
};

export default SiftingCriteria;