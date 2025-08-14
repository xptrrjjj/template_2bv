'use client';

import React, { forwardRef } from 'react';
import { InputNumber, InputNumberProps } from 'antd';

/**
 * Reusable currency input component with consistent formatting
 * Handles number formatting with currency symbols and thousand separators
 */

export interface CurrencyInputProps extends Omit<InputNumberProps, 'formatter' | 'parser'> {
  /** Currency symbol to display (default: '$') */
  currencySymbol?: string;
  /** Whether to show currency symbol as prefix (default: true) */
  showSymbol?: boolean;
  /** Custom formatter function */
  customFormatter?: (value: number | string | undefined) => string;
  /** Custom parser function */
  customParser?: (value: string | undefined) => number | string;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(({
  currencySymbol = '$',
  showSymbol = true,
  customFormatter,
  customParser,
  ...props
}, ref) => {
  /**
   * Default formatter that adds currency symbol and thousand separators
   */
  const defaultFormatter = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    
    const numericValue = typeof value === 'string' ? value : String(value);
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return showSymbol ? `${currencySymbol} ${formatted}` : formatted;
  };

  /**
   * Default parser that removes currency symbol and commas
   */
  const defaultParser = (value: string | undefined): number | string => {
    if (!value) return '';
    
    // Remove currency symbol and spaces
    let cleaned = value.replace(new RegExp(`\\${currencySymbol}`, 'g'), '').trim();
    // Remove commas
    cleaned = cleaned.replace(/,/g, '');
    
    return cleaned;
  };

  const formatter = customFormatter || defaultFormatter;
  const parser = customParser || defaultParser;

  return (
    <InputNumber
      ref={ref}
      formatter={formatter}
      parser={parser}
      style={{ width: '100%', ...props.style }}
      {...props}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;

/**
 * Predefined currency input variants
 */

export type USDInputProps = Omit<CurrencyInputProps, 'currencySymbol'>;

export const USDInput = forwardRef<HTMLInputElement, USDInputProps>((props, ref) => (
  <CurrencyInput
    ref={ref}
    currencySymbol="$"
    placeholder="0"
    min={0}
    {...props}
  />
));

USDInput.displayName = 'USDInput';

export type EURInputProps = Omit<CurrencyInputProps, 'currencySymbol'>;

export const EURInput = forwardRef<HTMLInputElement, EURInputProps>((props, ref) => (
  <CurrencyInput
    ref={ref}
    currencySymbol="€"
    placeholder="0"
    min={0}
    {...props}
  />
));

EURInput.displayName = 'EURInput';

export type GBPInputProps = Omit<CurrencyInputProps, 'currencySymbol'>;

export const GBPInput = forwardRef<HTMLInputElement, GBPInputProps>((props, ref) => (
  <CurrencyInput
    ref={ref}
    currencySymbol="£"
    placeholder="0"
    min={0}
    {...props}
  />
));

GBPInput.displayName = 'GBPInput';

/**
 * Generic number input without currency symbol (for local currency amounts)
 */
export type NumberInputProps = Omit<CurrencyInputProps, 'currencySymbol' | 'showSymbol'>;

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>((props, ref) => (
  <CurrencyInput
    ref={ref}
    showSymbol={false}
    placeholder="0"
    min={0}
    {...props}
  />
));

NumberInput.displayName = 'NumberInput';