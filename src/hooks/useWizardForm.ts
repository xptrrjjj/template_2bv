import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Form } from 'antd';
import { JobRoleWizardData } from '@/types/job-roles';
import { convertFormDateFields, JOB_ROLE_DATE_FIELDS } from '@/utils/dateUtils';

/**
 * Custom hook for managing wizard form state with consistent date conversion patterns
 * Consolidates common form handling logic used across wizard stages
 */

interface UseWizardFormProps {
  data: Partial<JobRoleWizardData>;
  onDataChange: (data: Partial<JobRoleWizardData>) => void;
  onValidChange: (valid: boolean) => void;
  requiredFields: string[];
  defaultValues?: Partial<JobRoleWizardData>;
}

interface UseWizardFormReturn {
  form: ReturnType<typeof Form.useForm>[0];
  handleFormChange: (changedFields: unknown, allFields: unknown) => void;
  isValid: boolean;
}

export function useWizardForm({
  data,
  onDataChange,
  onValidChange,
  requiredFields,
  defaultValues = {},
}: UseWizardFormProps): UseWizardFormReturn {
  const [form] = Form.useForm();
  const [isValid, setIsValid] = useState(false);
  
  // Use refs to store stable references to callback functions
  const onDataChangeRef = useRef(onDataChange);
  const onValidChangeRef = useRef(onValidChange);
  
  // Update refs when callbacks change
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
    onValidChangeRef.current = onValidChange;
  });

  /**
   * Initialize form with default values and convert dates
   */
  useEffect(() => {
    const initialValues = {
      ...defaultValues,
      ...data,
    };

    // Convert string dates to dayjs objects for form display
    const processedValues = convertFormDateFields(
      initialValues,
      JOB_ROLE_DATE_FIELDS as (keyof JobRoleWizardData)[],
      false // Convert to dayjs for display
    );

    form.setFieldsValue(processedValues);

    // Only update data if it's significantly different (avoid infinite loops)
    const hasSignificantChanges = requiredFields.some(field => !data[field as keyof JobRoleWizardData]);
    if (hasSignificantChanges && Object.keys(defaultValues).length > 0) {
      // Convert dayjs objects to strings for storage
      const dataForStorage = convertFormDateFields(
        processedValues,
        JOB_ROLE_DATE_FIELDS as (keyof JobRoleWizardData)[],
        true // Convert to strings for storage
      );
      onDataChangeRef.current(dataForStorage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty dependency array to prevent infinite loops

  /**
   * Update form values when external data changes
   */
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      const processedData = convertFormDateFields(
        data,
        JOB_ROLE_DATE_FIELDS as (keyof JobRoleWizardData)[],
        false // Convert to dayjs for display
      );
      form.setFieldsValue(processedData);
    }
  }, [data, form]);

  /**
   * Memoized validation function to prevent recreation on every change
   */
  const validateFields = useMemo(() => (fields: Record<string, unknown>) => {
    return requiredFields.every(field => {
      const value = fields[field];
      return value !== undefined && value !== null && value !== '';
    });
  }, [requiredFields]);

  /**
   * Optimized form change handler with memoized validation
   */
  const handleFormChange = useCallback((changedFields: unknown, allFields: unknown) => {
    // Convert dayjs objects to strings for storage
    const processedFields = convertFormDateFields(
      allFields as Record<string, unknown>,
      JOB_ROLE_DATE_FIELDS as (keyof JobRoleWizardData)[],
      true // Convert to strings for storage
    );
    
    onDataChangeRef.current(processedFields);
    
    // Use memoized validation function
    const formIsValid = validateFields(processedFields);
    
    setIsValid(formIsValid);
    onValidChangeRef.current(formIsValid);
  }, [validateFields]); // Use stable memoized validation function

  return {
    form,
    handleFormChange,
    isValid,
  };
}

/**
 * Specialized hook for basic info stage with default values
 */
export function useBasicInfoForm({
  data,
  onDataChange,
  onValidChange,
}: Omit<UseWizardFormProps, 'requiredFields' | 'defaultValues'>) {
  const requiredFields = [
    'title',
    'department',
    'level',
    'employment_type',
    'location',
    'currency',
    'number_of_resources',
    'desired_minimum_years_experience',
  ];

  const defaultValues = {
    contract_duration: 'rolling',
    currency: 'USD',
    number_of_resources: 1,
    desired_minimum_years_experience: 3,
    location_type: 'remote' as const,
    ...convertFormDateFields(
      {
        date_of_request: new Date().toISOString().split('T')[0],
        desired_start_date: new Date(Date.now() + 6 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      JOB_ROLE_DATE_FIELDS as ('date_of_request' | 'desired_start_date')[],
      false // Convert to dayjs for initial values
    ),
  };

  return useWizardForm({
    data,
    onDataChange,
    onValidChange,
    requiredFields,
    defaultValues,
  });
}

/**
 * Specialized hook for skills stage
 */
export function useSkillsForm({
  data,
  onDataChange,
  onValidChange,
}: Omit<UseWizardFormProps, 'requiredFields' | 'defaultValues'>) {
  const requiredFields = ['requirements', 'responsibilities'];

  // Memoized skills conversion functions to prevent recreation on every render
  const convertSkillsToString = useMemo(() => (skillArray: string[] | undefined) => 
    Array.isArray(skillArray) ? skillArray.join('\n') : '', []);
  
  const convertStringToSkills = useMemo(() => (skillString: string | undefined) => 
    skillString ? skillString.split('\n').filter((r: string) => r.trim()) : [], []);

  // Use refs to store stable references to callback functions
  const onDataChangeRef = useRef(onDataChange);
  const onValidChangeRef = useRef(onValidChange);
  
  // Update refs when callbacks change
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
    onValidChangeRef.current = onValidChange;
  });

  // Use the base wizard form with empty data and handle skills conversion manually
  const { form, isValid } = useWizardForm({
    data: {}, // Start with empty data
    onDataChange: () => {}, // Handle data change manually
    onValidChange: () => {}, // Handle validation manually  
    requiredFields: [], // Handle validation manually
    defaultValues: {},
  });

  // Initialize form with skills data converted to strings
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      form.setFieldsValue({
        requirements: convertSkillsToString(data.requirements),
        preferred_qualifications: convertSkillsToString(data.preferred_qualifications),
        responsibilities: convertSkillsToString(data.responsibilities),
      });
    }
  }, [data, form, convertSkillsToString]);

  // Memoized validation function
  const validateSkillsData = useMemo(() => (skillsData: { requirements: string[], responsibilities: string[] }) => {
    return skillsData.requirements.length > 0 && skillsData.responsibilities.length > 0;
  }, []);

  // Custom form change handler that handles string-to-array conversion
  const handleFormChange = useCallback((changedFields: unknown, allFields: Record<string, unknown>) => {
    const updatedData = {
      requirements: convertStringToSkills(allFields.requirements as string),
      preferred_qualifications: convertStringToSkills(allFields.preferred_qualifications as string),
      responsibilities: convertStringToSkills(allFields.responsibilities as string),
    };

    onDataChangeRef.current(updatedData);
    
    // Use memoized validation
    const isValid = validateSkillsData(updatedData);
    onValidChangeRef.current(isValid);
  }, [convertStringToSkills, validateSkillsData]);

  // Initial validation with memoized functions
  useEffect(() => {
    const requirements = data.requirements || [];
    const responsibilities = data.responsibilities || [];
    const isValid = validateSkillsData({ requirements, responsibilities });
    onValidChangeRef.current(isValid);
  }, [data.requirements, data.responsibilities, validateSkillsData]);

  return {
    form,
    handleFormChange,
    isValid: true, // This will be managed by the validation logic above
  };
}

/**
 * Specialized hook for position analysis stage
 */
export function usePositionAnalysisForm({
  data,
  onDataChange,
  onValidChange,
}: Omit<UseWizardFormProps, 'requiredFields' | 'defaultValues'>) {
  const requiredFields = ['description'];

  return useWizardForm({
    data,
    onDataChange,
    onValidChange,
    requiredFields,
    defaultValues: {},
  });
}

/**
 * Specialized hook for company stage
 */
export function useCompanyForm({
  data,
  onDataChange,
  onValidChange,
}: Omit<UseWizardFormProps, 'requiredFields' | 'defaultValues'>) {
  const requiredFields = ['company_id'];

  return useWizardForm({
    data,
    onDataChange,
    onValidChange,
    requiredFields,
    defaultValues: {},
  });
}