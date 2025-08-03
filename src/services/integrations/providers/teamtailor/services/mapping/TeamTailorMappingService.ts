import { FieldTransformers } from "./FieldTransformers";
import { FieldValidator } from "./FieldValidator";
import { ErrorFactory } from "../../errors/ErrorFactory";
import { RoleData, TeamTailorJobData } from "../../types";

/**
 * Field mapping configuration
 */
interface FieldMapping {
  source: string;
  target: string;
  required: boolean;
  transform?: (value: unknown) => unknown;
  defaultValue?: unknown;
}

/**
 * TeamTailor Mapping Service
 * Handles data transformation between internal role format and TeamTailor API format
 */
export class TeamTailorMappingService {
  private readonly defaultFieldMappings: FieldMapping[] = [
    {
      source: "title",
      target: "name",
      required: true,
    },
    {
      source: "description",
      target: "body",
      required: false,
      transform: FieldTransformers.sanitizeHtml,
    },
    {
      source: "requirements",
      target: "requirements",
      required: false,
      transform: FieldTransformers.sanitizeHtml,
    },
    {
      source: "department",
      target: "departmentId",
      required: false,
    },
    {
      source: "location",
      target: "locationId",
      required: false,
    },
    {
      source: "salary",
      target: "salaryDescription",
      required: false,
    },
    {
      source: "employmentType",
      target: "employmentType",
      required: false,
      transform: FieldTransformers.mapEmploymentType,
    },
    {
      source: "startDate",
      target: "startDate",
      required: false,
      transform: FieldTransformers.formatDate,
    },
    {
      source: "endDate",
      target: "endDate",
      required: false,
      transform: FieldTransformers.formatDate,
    },
    {
      source: "tags",
      target: "tags",
      required: false,
      transform: FieldTransformers.ensureArray,
    },
    {
      source: "referenceNumber",
      target: "referenceNumber",
      required: false,
    },
    {
      source: "status",
      target: "status",
      required: false,
      defaultValue: "published",
      transform: FieldTransformers.mapStatus,
    },
  ];

  /**
   * Transform internal role data to TeamTailor job format
   */
  transformRoleToTeamTailorJob(
    roleData: Record<string, unknown>,
    options?: Record<string, unknown>
  ): TeamTailorJobData {
    try {
      const mappings = this.getMappings(options);
      const transformed = this.applyMappings(roleData, mappings) as Record<string, unknown>;

      // Apply selected options from external options
      if (options?.externalOptions) {
        this.applyExternalOptions(transformed, options.externalOptions as Record<string, unknown>);
      }

      // Apply custom field mappings if provided
      if (options?.fieldMappings) {
        this.applyCustomMappings(transformed, roleData, options.fieldMappings as Record<string, string>);
      }

      return transformed as TeamTailorJobData;
    } catch (error) {
      throw ErrorFactory.createTransformationError("role_to_teamtailor", error);
    }
  }

  /**
   * Transform TeamTailor job data back to internal role format
   */
  transformTeamTailorJobToRole(
    teamTailorData: Record<string, unknown>,
    options?: Record<string, unknown>
  ): RoleData {
    try {
      const mappings = this.getMappings(options);
      const transformed: Record<string, unknown> = {};

      // Reverse mapping
      for (const mapping of mappings) {
        const targetValue = teamTailorData[mapping.target];
        
        if (targetValue !== undefined && targetValue !== null) {
          let sourceValue: unknown = targetValue;
          
          // Apply reverse transformation if available
          if (mapping.transform) {
            sourceValue = this.reverseTransform(mapping.transform, targetValue as unknown);
          }
          
          this.setNestedValue(transformed as Record<string, unknown>, mapping.source, sourceValue);
        }
      }

      return transformed as RoleData;
    } catch (error) {
      throw ErrorFactory.createTransformationError("teamtailor_to_role", error);
    }
  }

  /**
   * Validate that all required fields are present
   */
  validateRequiredFields(jobData: TeamTailorJobData): void {
    FieldValidator.validateRequiredFields(jobData);
  }

  /**
   * Apply field mappings
   */
  private applyMappings(
    sourceData: Record<string, unknown>,
    mappings: FieldMapping[]
  ): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};

    for (const mapping of mappings) {
      const sourceValue = this.getNestedValue(sourceData, mapping.source);
      
      if (sourceValue !== undefined && sourceValue !== null) {
        let targetValue: unknown = sourceValue;
        
        // Apply transformation if specified
        if (mapping.transform) {
          targetValue = mapping.transform(sourceValue as unknown);
        }
        
        (transformed as Record<string, unknown>)[mapping.target] = targetValue;
      } else if (mapping.defaultValue !== undefined) {
        transformed[mapping.target] = mapping.defaultValue;
      } else if (mapping.required) {
        throw new Error(`Required field '${mapping.source}' is missing or null`);
      }
    }

    return transformed;
  }

  /**
   * Get field mappings (default + custom)
   */
  private getMappings(options?: Record<string, unknown>): FieldMapping[] {
    let mappings = [...this.defaultFieldMappings];

    if (options?.customMappings && Array.isArray(options.customMappings)) {
      mappings = mappings.concat(options.customMappings as FieldMapping[]);
    }

    return mappings;
  }

  /**
   * Apply external options selections to the transformed data
   */
  private applyExternalOptions(
    transformed: Record<string, unknown>,
    externalOptions: Record<string, unknown>
  ): void {
    // Apply selected departments
    if (externalOptions.departments && Array.isArray(externalOptions.departments)) {
      const selectedDepartment = externalOptions.departments.find((d: { selected?: boolean }) => d.selected);
      if (selectedDepartment) {
        transformed.departmentId = selectedDepartment.id;
      }
    }

    // Apply selected locations
    if (externalOptions.locations && Array.isArray(externalOptions.locations)) {
      const selectedLocations = externalOptions.locations.filter((l: { selected?: boolean }) => l.selected);
      if (selectedLocations.length > 0) {
        if (selectedLocations.length === 1) {
          transformed.locationId = selectedLocations[0].id;
        } else {
          transformed.locationIds = selectedLocations.map((l: { id: string }) => l.id);
        }
      }
    }

    // Apply selected job template
    if (externalOptions.job_templates && Array.isArray(externalOptions.job_templates)) {
      const selectedTemplate = externalOptions.job_templates.find((t: { selected?: boolean }) => t.selected);
      if (selectedTemplate) {
        transformed.jobTemplateId = selectedTemplate.id;
      }
    }

    // Apply selected hiring stages
    if (externalOptions.hiring_stages && Array.isArray(externalOptions.hiring_stages)) {
      const selectedStages = externalOptions.hiring_stages.filter((s: { selected?: boolean }) => s.selected);
      if (selectedStages.length > 0) {
        transformed.stageIds = selectedStages
          .sort((a: { metadata?: { order?: number } }, b: { metadata?: { order?: number } }) => (a.metadata?.order || 0) - (b.metadata?.order || 0))
          .map((s: { id: string }) => s.id);
      }
    }
  }

  /**
   * Apply custom field mappings
   */
  private applyCustomMappings(
    transformed: Record<string, unknown>,
    sourceData: Record<string, unknown>,
    customMappings: Record<string, string>
  ): void {
    for (const [sourceField, targetField] of Object.entries(customMappings)) {
      const value = this.getNestedValue(sourceData, sourceField);
      if (value !== undefined && value !== null) {
        transformed[targetField] = value;
      }
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce<unknown>((current, key) => {
      return current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      return current[key] as Record<string, unknown>;
    }, obj as Record<string, unknown>);
    
    target[lastKey] = value;
  }

  /**
   * Apply reverse transformation
   */
  private reverseTransform(transform: (value: unknown) => unknown, value: unknown): unknown {
    // Map specific transformers to their reverse functions
    if (transform === FieldTransformers.mapEmploymentType) {
      return FieldTransformers.reverseMapEmploymentType(value as string);
    } else if (transform === FieldTransformers.mapStatus) {
      return FieldTransformers.reverseMapStatus(value as string);
    } else if (transform === FieldTransformers.formatDate) {
      return value; // Dates are already in correct format
    } else if (transform === FieldTransformers.ensureArray) {
      return Array.isArray(value) ? value.join(", ") : value;
    }
    
    return value;
  }
}