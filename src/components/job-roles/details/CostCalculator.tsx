'use client';

import React from 'react';
import { Slider, Statistic, Row, Col, Alert } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Text } = Typography;

interface CostCalculatorData {
  annualSavings: number;
  threeYearSavings: number;
  phRateWithMarkup: number;
  savingsPercentage: number;
  avgPhRate: number;
  avgUsRate: number;
}

interface CostCalculatorProps {
  markupPercentage: number;
  onMarkupChange: (value: number) => void;
  savingsData: CostCalculatorData | null;
}

/**
 * CostCalculator Component
 * 
 * Interactive cost calculator with markup percentage slider
 * Follows Single Responsibility Principle - only handles cost calculation display
 */
const CostCalculator: React.FC<CostCalculatorProps> = ({
  markupPercentage,
  onMarkupChange,
  savingsData
}) => {
  if (!savingsData) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>
          Interactive Cost Calculator
        </Text>
        <Alert
          message="Cost Calculator Temporarily Unavailable"
          description="The cost calculation encountered invalid data. Our team is working to resolve this issue."
          type="info"
          showIcon
        />
      </div>
    );
  }

  // Safety check for reasonable values
  const hasInvalidData = savingsData.phRateWithMarkup > 1000 || savingsData.annualSavings > 10000000;

  return (
    <div style={{ marginBottom: '16px' }}>
      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>
        Interactive Cost Calculator
      </Text>
      
      <div style={{ marginBottom: '16px' }}>
        <Text strong>Markup Percentage: {markupPercentage}%</Text>
        <Slider
          min={0}
          max={100}
          value={markupPercentage}
          onChange={onMarkupChange}
          marks={{
            0: '0%',
            25: '25%',
            50: '50%',
            75: '75%',
            100: '100%',
          }}
        />
      </div>
      
      <div style={{ marginBottom: '16px', padding: '12px', background: '#f6ffed', borderRadius: '6px' }}>
        <Text strong style={{ color: '#52c41a' }}>Using Combined AI Analysis (Average of OpenAI & Gemini)</Text>
      </div>
      
      {hasInvalidData ? (
        <Alert
          message="Calculation Error Detected"
          description="The calculated values appear to be incorrect. Please contact support."
          type="warning"
          style={{ marginBottom: '16px' }}
        />
      ) : (
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="PH Rate + Markup"
              value={`$${savingsData.phRateWithMarkup}`}
              suffix="/hour"
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Annual Savings"
              value={`$${savingsData.annualSavings.toLocaleString()}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<span style={{ color: '#52c41a' }}>💰</span>}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="3-Year Savings"
              value={`$${savingsData.threeYearSavings.toLocaleString()}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<span style={{ color: '#52c41a' }}>📈</span>}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Savings %"
              value={Math.max(0, Math.min(100, savingsData.savingsPercentage))}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<span style={{ color: '#52c41a' }}>📊</span>}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default CostCalculator;