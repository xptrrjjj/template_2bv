import dayjs, { Dayjs } from 'dayjs';

// Cache for memoizing date conversions to prevent expensive operations
const dateConversionCache = new Map<string, Dayjs | string | null>();
const CACHE_SIZE_LIMIT = 1000;

/**
 * Utility functions for converting between dayjs objects and string formats
 * used throughout the job role wizard and forms
 */

/**
 * Optimized conversion of dayjs object to ISO date string with caching
 * @param date - The dayjs object to convert
 * @returns ISO date string or undefined if date is invalid
 */
export function convertDayjsToString(date: Dayjs | null | undefined): string | undefined {
  if (!date || !dayjs.isDayjs(date)) {
    return undefined;
  }
  
  // Create cache key from the date's unix timestamp
  const cacheKey = `dayjs_to_string_${date.unix()}`;
  
  // Check cache first
  if (dateConversionCache.has(cacheKey)) {
    return dateConversionCache.get(cacheKey) as string;
  }
  
  // Clean cache if it gets too large
  if (dateConversionCache.size >= CACHE_SIZE_LIMIT) {
    const firstKey = dateConversionCache.keys().next().value;
    if (firstKey !== undefined) {
      dateConversionCache.delete(firstKey);
    }
  }
  
  const result = date.format('YYYY-MM-DD');
  dateConversionCache.set(cacheKey, result);
  
  return result;
}

/**
 * Optimized conversion of ISO date string to dayjs object with caching
 * @param dateString - The date string to convert
 * @returns dayjs object or null if string is invalid
 */
export function convertStringToDayjs(dateString: string | null | undefined): Dayjs | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  
  // Create cache key
  const cacheKey = `string_to_dayjs_${dateString}`;
  
  // Check cache first
  if (dateConversionCache.has(cacheKey)) {
    return dateConversionCache.get(cacheKey) as Dayjs | null;
  }
  
  // Clean cache if it gets too large
  if (dateConversionCache.size >= CACHE_SIZE_LIMIT) {
    const firstKey = dateConversionCache.keys().next().value;
    if (firstKey !== undefined) {
      dateConversionCache.delete(firstKey);
    }
  }
  
  const date = dayjs(dateString);
  const result = date.isValid() ? date : null;
  dateConversionCache.set(cacheKey, result);
  
  return result;
}

/**
 * Safely converts form values between dayjs and string formats for storage/display
 * @param formValues - Object containing form values that may have date fields
 * @param dateFields - Array of field names that contain dates
 * @param toStorage - If true, converts dayjs to strings; if false, converts strings to dayjs
 * @returns Processed form values with converted date fields
 */
export function convertFormDateFields<T extends Record<string, unknown>>(
  formValues: T,
  dateFields: (keyof T)[],
  toStorage: boolean = true
): T {
  const processed = { ...formValues };
  
  dateFields.forEach(field => {
    const value = processed[field];
    
    if (toStorage) {
      // Convert dayjs to string for storage
      if (dayjs.isDayjs(value)) {
        processed[field] = convertDayjsToString(value as Dayjs) as T[keyof T];
      }
    } else {
      // Convert string to dayjs for form display
      if (typeof value === 'string') {
        processed[field] = convertStringToDayjs(value) as T[keyof T];
      }
    }
  });
  
  return processed;
}

/**
 * Gets default date values for job role wizard
 */
export const getDefaultJobRoleDates = () => ({
  date_of_request: dayjs(),
  desired_start_date: dayjs().add(6, 'weeks'),
});

/**
 * Date field names commonly used in job role forms
 */
export const JOB_ROLE_DATE_FIELDS: string[] = ['date_of_request', 'desired_start_date'];

/**
 * Clears the date conversion cache - useful for memory management
 */
export function clearDateConversionCache(): void {
  dateConversionCache.clear();
}

/**
 * Gets the current size of the date conversion cache - useful for debugging
 */
export function getDateConversionCacheSize(): number {
  return dateConversionCache.size;
}