import { ErrorFactory } from "../../errors/ErrorFactory";
import { ERROR_MESSAGES } from "../../constants";

/**
 * Field Validator
 * Handles validation of job data fields
 */
export class FieldValidator {
  private static readonly REQUIRED_FIELDS = ["name"];
  private static readonly MAX_JOB_NAME_LENGTH = 255;
  private static readonly VALID_STATUSES = ["published", "draft", "archived"];
  private static readonly VALID_EMPLOYMENT_TYPES = [
    "full_time", "part_time", "contract", "freelance", "internship", "temporary"
  ];

  /**
   * Validate all required fields are present
   */
  static validateRequiredFields(jobData: Record<string, unknown>): void {
    const missingFields: string[] = [];

    for (const field of this.REQUIRED_FIELDS) {
      if (!jobData[field] || (typeof jobData[field] === "string" && jobData[field].trim() === "")) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw ErrorFactory.createValidationError(
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS(missingFields)
      );
    }

    this.validateFieldFormats(jobData);
  }

  /**
   * Validate field formats and constraints
   */
  private static validateFieldFormats(jobData: Record<string, unknown>): void {
    // Validate job name length
    if (jobData.name && typeof jobData.name === 'string' && jobData.name.length > this.MAX_JOB_NAME_LENGTH) {
      throw ErrorFactory.createValidationError(ERROR_MESSAGES.JOB_NAME_TOO_LONG);
    }

    // Validate dates
    if (jobData.startDate && typeof jobData.startDate === 'string' && !this.isValidDate(jobData.startDate)) {
      throw ErrorFactory.createValidationError(ERROR_MESSAGES.INVALID_DATE_FORMAT);
    }
    
    if (jobData.endDate && typeof jobData.endDate === 'string' && !this.isValidDate(jobData.endDate)) {
      throw ErrorFactory.createValidationError(ERROR_MESSAGES.INVALID_DATE_FORMAT);
    }

    // Validate status
    if (jobData.status && typeof jobData.status === 'string' && !this.VALID_STATUSES.includes(jobData.status)) {
      throw ErrorFactory.createValidationError(ERROR_MESSAGES.INVALID_STATUS);
    }

    // Validate employment type
    if (jobData.employmentType && typeof jobData.employmentType === 'string' && !this.VALID_EMPLOYMENT_TYPES.includes(jobData.employmentType)) {
      throw ErrorFactory.createValidationError(
        `Employment type must be one of: ${this.VALID_EMPLOYMENT_TYPES.join(", ")}`
      );
    }
  }

  /**
   * Check if date string is valid
   */
  private static isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}