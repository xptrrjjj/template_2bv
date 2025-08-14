/**
 * Common reusable components for job role wizard stages
 * Consolidates form patterns and UI components following DRY principles
 */

// Layout components
export { default as WizardStageLayout, STAGE_GRADIENTS } from './WizardStageLayout';
export { default as FormFieldGroup } from './FormFieldGroup';

// Form input components
export { 
  default as CurrencyInput,
  USDInput,
  EURInput,
  GBPInput,
  NumberInput
} from './CurrencyInput';

export { 
  default as ExperienceInput,
  MinimumExperienceInput,
  MaximumExperienceInput,
  ExperienceRangeInput
} from './ExperienceInput';

// Re-export types for convenience
export type { 
  CurrencyInputProps,
  USDInputProps,
  EURInputProps,
  GBPInputProps,
  NumberInputProps
} from './CurrencyInput';

export type { 
  ExperienceInputProps,
  MinimumExperienceInputProps,
  MaximumExperienceInputProps,
  ExperienceRangeInputProps
} from './ExperienceInput';