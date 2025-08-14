'use client';

import React from 'react';
import { Card, Row, Col, Badge, Divider, Space } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Text } = Typography;

interface MarketRateInfo {
  min: number;
  max: number;
  insights: string[];
}

interface CountryRates {
  openai: MarketRateInfo;
  gemini: MarketRateInfo;
}

interface MarketRatesData {
  philippines: CountryRates;
  usa: CountryRates;
}

interface MarketRatesAnalysisProps {
  marketRates: MarketRatesData;
}

/**
 * MarketRatesAnalysis Component
 * 
 * Displays AI-generated market rate analysis from OpenAI and Gemini
 * Follows Single Responsibility Principle - only handles market rates display
 */
const MarketRatesAnalysis: React.FC<MarketRatesAnalysisProps> = ({ marketRates }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>
        <Space>
          <BarChartOutlined style={{ color: '#722ed1' }} />
          Market Rate Analysis
        </Space>
      </Text>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title={<span><span style={{ color: '#52c41a' }}>🇵🇭</span> Philippines Market</span>} size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Badge color="blue" text="As per OpenAI" />
                <div style={{ marginTop: '4px' }}>
                  <Text strong>${marketRates.philippines.openai.min} - ${marketRates.philippines.openai.max}/hr</Text>
                </div>
                <ul style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0', paddingLeft: '16px' }}>
                  {marketRates.philippines.openai.insights.slice(0, 2).map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Badge color="green" text="As per Gemini" />
                <div style={{ marginTop: '4px' }}>
                  <Text strong>${marketRates.philippines.gemini.min} - ${marketRates.philippines.gemini.max}/hr</Text>
                </div>
                <ul style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0', paddingLeft: '16px' }}>
                  {marketRates.philippines.gemini.insights.slice(0, 2).map((insight, index) => (
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
                <div style={{ marginTop: '4px' }}>
                  <Text strong>${marketRates.usa.openai.min} - ${marketRates.usa.openai.max}/hr</Text>
                </div>
                <ul style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0', paddingLeft: '16px' }}>
                  {marketRates.usa.openai.insights.slice(0, 2).map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Badge color="green" text="As per Gemini" />
                <div style={{ marginTop: '4px' }}>
                  <Text strong>${marketRates.usa.gemini.min} - ${marketRates.usa.gemini.max}/hr</Text>
                </div>
                <ul style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0', paddingLeft: '16px' }}>
                  {marketRates.usa.gemini.insights.slice(0, 2).map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MarketRatesAnalysis;