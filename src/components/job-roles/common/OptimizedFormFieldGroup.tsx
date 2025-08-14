'use client';

import React, { ReactNode, useMemo } from 'react';
import { Card, Space, Typography } from 'antd';

const { Text } = Typography;

/**
 * Highly optimized reusable card wrapper component for grouping related form fields
 * Uses advanced React performance patterns to prevent unnecessary re-renders
 */

interface OptimizedFormFieldGroupProps {
  /** Icon to display next to the title */
  icon?: ReactNode;
  /** Title of the form group */
  title: string;
  /** Optional description text */
  description?: string;
  /** Form fields and content to render inside the card */
  children: ReactNode;
  /** Card size variant */
  size?: 'small' | 'default';
  /** Optional additional styling */
  style?: React.CSSProperties;
  /** Optional custom CSS class */
  className?: string;
  /** Optional extra content (like buttons) in the card header */
  extra?: ReactNode;
}

const OptimizedFormFieldGroup = React.memo<OptimizedFormFieldGroupProps>(function OptimizedFormFieldGroup({
  icon,
  title,
  description,
  children,
  size = 'small',
  style,
  className,
  extra,
}) {
  // Memoize the card title to prevent recreation on every render
  const cardTitle = useMemo(() => (
    <Space>
      {icon}
      <div>
        <Text strong>{title}</Text>
        {description && (
          <div style={{ marginTop: '2px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {description}
            </Text>
          </div>
        )}
      </div>
    </Space>
  ), [icon, title, description]);

  // Memoize the card styles to prevent object recreation
  const cardStyle = useMemo(() => ({
    marginBottom: '24px',
    ...style,
  }), [style]);

  // Memoize the body styles to prevent object recreation
  const bodyStyles = useMemo(() => ({
    body: {
      paddingTop: '16px',
    },
  }), []);

  return (
    <Card
      size={size}
      title={cardTitle}
      extra={extra}
      style={cardStyle}
      className={className}
      styles={bodyStyles}
    >
      {children}
    </Card>
  );
});

OptimizedFormFieldGroup.displayName = 'OptimizedFormFieldGroup';

export default OptimizedFormFieldGroup;