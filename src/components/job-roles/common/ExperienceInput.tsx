'use client';

import React, { forwardRef } from 'react';
import { InputNumber, InputNumberProps } from 'antd';

/**
 * Specialized input component for years of experience
 * Provides consistent validation and formatting for experience fields
 */

export interface ExperienceInputProps extends Omit<InputNumberProps, 'min' | 'max' | 'formatter'> {
  /** Minimum years of experience allowed (default: 0) */
  minYears?: number;
  /** Maximum years of experience allowed (default: 30) */
  maxYears?: number;
  /** Whether to show the "years" suffix (default: true) */
  showSuffix?: boolean;
  /** Custom suffix text (default: "years") */
  suffixText?: string;
}

const ExperienceInput = forwardRef<HTMLInputElement, ExperienceInputProps>(({
  minYears = 0,
  maxYears = 30,
  showSuffix = true,
  suffixText = 'years',
  placeholder = '3',
  ...props
}, ref) => {
  /**
   * Formatter that adds years suffix when appropriate
   */
  const formatter = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return String(value);
    }
    
    if (showSuffix && numericValue > 0) {
      const suffix = numericValue === 1 ? 'year' : suffixText;
      return `${numericValue} ${suffix}`;
    }
    
    return String(numericValue);
  };

  /**
   * Parser that removes the years suffix
   */
  const parser = (value: string | undefined): number | string => {
    if (!value) return '';
    
    // Remove common suffixes
    const cleaned = value
      .replace(/\s*(years?|yrs?)\s*$/i, '')
      .trim();
    
    const parsed = Number(cleaned);
    return isNaN(parsed) ? '' : parsed;
  };

  return (
    <InputNumber
      ref={ref}
      min={minYears}
      max={maxYears}
      formatter={showSuffix ? formatter : undefined}
      parser={showSuffix ? parser : undefined}
      placeholder={placeholder}
      style={{ width: '100%', ...props.style }}
      {...props}
    />
  );
});

ExperienceInput.displayName = 'ExperienceInput';

export default ExperienceInput;

/**
 * Predefined experience input variants
 */

export interface MinimumExperienceInputProps extends Omit<ExperienceInputProps, 'minYears'> {
  /** Override minimum years if needed */
  minYears?: number;
}

export const MinimumExperienceInput = forwardRef<HTMLInputElement, MinimumExperienceInputProps>(({
  minYears = 0,
  placeholder = '3',
  ...props
}, ref) => (
  <ExperienceInput
    ref={ref}
    minYears={minYears}
    placeholder={placeholder}
    {...props}
  />
));

MinimumExperienceInput.displayName = 'MinimumExperienceInput';

export interface MaximumExperienceInputProps extends Omit<ExperienceInputProps, 'maxYears'> {
  /** Override maximum years if needed */
  maxYears?: number;
}

export const MaximumExperienceInput = forwardRef<HTMLInputElement, MaximumExperienceInputProps>(({
  maxYears = 30,
  placeholder = '10',
  ...props
}, ref) => (
  <ExperienceInput
    ref={ref}
    maxYears={maxYears}
    placeholder={placeholder}
    {...props}
  />
));

MaximumExperienceInput.displayName = 'MaximumExperienceInput';

/**
 * Range experience input for when both min and max are needed
 */
export interface ExperienceRangeInputProps {
  /** Minimum experience value */
  minValue?: number;
  /** Maximum experience value */
  maxValue?: number;
  /** Callback when minimum changes */
  onMinChange?: (value: number | null) => void;
  /** Callback when maximum changes */
  onMaxChange?: (value: number | null) => void;
  /** Style overrides */
  style?: React.CSSProperties;
  /** Whether inputs are disabled */
  disabled?: boolean;
}

export const ExperienceRangeInput: React.FC<ExperienceRangeInputProps> = ({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  style,
  disabled,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
    <MinimumExperienceInput
      value={minValue}
      onChange={(value) => onMinChange?.(typeof value === 'number' ? value : null)}
      placeholder="Min"
      disabled={disabled}
    />
    <span style={{ color: '#666', fontSize: '14px' }}>to</span>
    <MaximumExperienceInput
      value={maxValue}
      onChange={(value) => onMaxChange?.(typeof value === 'number' ? value : null)}
      placeholder="Max"
      disabled={disabled}
      minYears={minValue || 0}
    />
  </div>
);

ExperienceRangeInput.displayName = 'ExperienceRangeInput';