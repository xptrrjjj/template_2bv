'use client';

import React, { ReactNode } from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

/**
 * Standardized layout component for wizard stages
 * Provides consistent header pattern with icon, title, and description
 */

interface WizardStageLayoutProps {
  /** Icon to display in the header circle */
  icon: ReactNode;
  /** Main title of the stage */
  title: string;
  /** Description text below the title */
  description: string;
  /** Content to render below the header */
  children: ReactNode;
  /** Optional gradient colors for the icon background */
  gradientColors?: {
    from: string;
    to: string;
  };
  /** Optional maximum width for the content */
  maxWidth?: number | string;
  /** Optional padding override */
  padding?: number | string;
}

export default function WizardStageLayout({
  icon,
  title,
  description,
  children,
  gradientColors = { from: '#1890ff', to: '#722ed1' },
  maxWidth = '800px',
  padding = '24px',
}: WizardStageLayoutProps) {
  return (
    <div 
      style={{ 
        padding: typeof padding === 'number' ? `${padding}px` : padding, 
        maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth, 
        margin: '0 auto' 
      }}
    >
      {/* Standardized Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ color: 'white', fontSize: '24px' }}>
            {icon}
          </div>
        </div>
        
        <Title level={3} style={{ margin: '0 0 8px 0' }}>
          {title}
        </Title>
        
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {description}
        </Text>
      </div>

      {/* Stage Content */}
      {children}
    </div>
  );
}

/**
 * Predefined gradient color combinations for different stages
 */
export const STAGE_GRADIENTS = {
  company: { from: '#1890ff', to: '#722ed1' },
  basicInfo: { from: '#52c41a', to: '#1890ff' },
  skills: { from: '#722ed1', to: '#1890ff' },
  positionAnalysis: { from: '#fa8c16', to: '#722ed1' },
  analysis: { from: '#f759ab', to: '#faad14' },
  review: { from: '#13c2c2', to: '#f759ab' },
} as const;