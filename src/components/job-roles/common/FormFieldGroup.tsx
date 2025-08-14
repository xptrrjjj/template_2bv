'use client';

import React, { ReactNode } from 'react';
import { Card, Space, Typography } from 'antd';

const { Text } = Typography;

/**
 * Reusable card wrapper component for grouping related form fields
 * Provides consistent styling with icon and title pattern
 */

interface FormFieldGroupProps {
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

const FormFieldGroup = React.memo(function FormFieldGroup({
  icon,
  title,
  description,
  children,
  size = 'small',
  style = {},
  className,
  extra,
}: FormFieldGroupProps) {
  const cardTitle = (
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
  );

  return (
    <Card
      size={size}
      title={cardTitle}
      extra={extra}
      style={{
        marginBottom: '24px',
        ...style,
      }}
      className={className}
      styles={{
        body: {
          paddingTop: '16px',
        },
      }}
    >
      {children}
    </Card>
  );
});

FormFieldGroup.displayName = 'FormFieldGroup';

export default FormFieldGroup;