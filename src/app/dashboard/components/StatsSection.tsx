'use client';

import React from 'react';
import { Row, Col } from 'antd';
import { UserOutlined, PlusOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { StatCard } from './StatCard';

interface StatsSectionProps {
  stats?: {
    activeCandidates: number;
    openPositions: number;
    interviewsThisWeek: number;
    successfulHires: number;
  };
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  const defaultStats = {
    activeCandidates: 47,
    openPositions: 8,
    interviewsThisWeek: 12,
    successfulHires: 3,
  };

  const currentStats = stats || defaultStats;

  return (
    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
      <Col xs={24} sm={12} lg={6}>
        <StatCard 
          title="Active Candidates" 
          value={currentStats.activeCandidates} 
          icon={<UserOutlined />} 
          color="#667eea"
          trend={12}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard 
          title="Open Positions" 
          value={currentStats.openPositions} 
          icon={<PlusOutlined />} 
          color="#52c41a"
          trend={25}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard 
          title="Interviews This Week" 
          value={currentStats.interviewsThisWeek} 
          icon={<CalendarOutlined />} 
          color="#fa8c16"
          trend={8}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard 
          title="Successful Hires" 
          value={currentStats.successfulHires} 
          icon={<CheckCircleOutlined />} 
          color="#722ed1"
          trend={50}
        />
      </Col>
    </Row>
  );
};