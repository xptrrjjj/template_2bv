'use client';

import React from 'react';
import { Card, Row, Col, Badge, Progress, Space } from 'antd';
import { Typography } from 'antd';

const { Text } = Typography;

interface TalentAssessment {
  score: number;
  status: 'abundant' | 'moderate' | 'limited' | 'scarce';
  timeline: string;
}

interface TalentAvailabilityData {
  openai: TalentAssessment;
  gemini: TalentAssessment;
}

interface TalentAvailabilityProps {
  talentAvailability: TalentAvailabilityData;
}

/**
 * TalentAvailability Component
 * 
 * Displays talent availability assessment from AI providers
 * Follows Single Responsibility Principle - only handles talent availability display
 */
const TalentAvailability: React.FC<TalentAvailabilityProps> = ({ talentAvailability }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'abundant': return 'success';
      case 'moderate': return 'processing';
      default: return 'warning';
    }
  };

  const getProgressColor = (score: number) => ({
    '0%': score >= 7 ? '#87d068' : '#faad14',
    '100%': score >= 7 ? '#52c41a' : '#fa8c16',
  });

  return (
    <div style={{ marginBottom: '16px' }}>
      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>
        Talent Availability Assessment
      </Text>
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
                  percent={(talentAvailability.openai?.score || 0) * 10}
                  size={60}
                  strokeColor={getProgressColor(talentAvailability.openai?.score || 0)}
                  format={() => `${talentAvailability.openai?.score || 0}/10`}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <Badge 
                  status={getStatusColor(talentAvailability.openai?.status)}
                  text={(talentAvailability.openai?.status || 'unknown').toUpperCase()}
                />
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Timeline: {talentAvailability.openai?.timeline || 'N/A'}
                </Text>
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
                  percent={(talentAvailability.gemini?.score || 0) * 10}
                  size={60}
                  strokeColor={getProgressColor(talentAvailability.gemini?.score || 0)}
                  format={() => `${talentAvailability.gemini?.score || 0}/10`}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <Badge 
                  status={getStatusColor(talentAvailability.gemini?.status)}
                  text={(talentAvailability.gemini?.status || 'unknown').toUpperCase()}
                />
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Timeline: {talentAvailability.gemini?.timeline || 'N/A'}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TalentAvailability;