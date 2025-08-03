import { TeamTailorJobRequest, TeamTailorJobAttributes, TeamTailorJobRelationships } from "../../types";

/**
 * Job Payload Builder
 * Constructs TeamTailor API payloads for job operations
 */
export class JobPayloadBuilder {
  /**
   * Build job payload for TeamTailor API
   */
  static buildJobPayload(
    jobData: Record<string, unknown>
  ): TeamTailorJobRequest {
    const attributes = this.buildAttributes(jobData);
    const relationships = this.buildRelationships(jobData);

    return {
      data: {
        type: "jobs",
        attributes,
        ...(Object.keys(relationships).length > 0 && { relationships }),
      },
    };
  }

  /**
   * Build archive job payload
   */
  static buildArchivePayload(): TeamTailorJobRequest {
    return {
      data: {
        type: "jobs",
        attributes: {
          name: "", // Required field, but will be ignored for archive
          status: "archived",
        },
      },
    };
  }

  /**
   * Build job attributes
   */
  private static buildAttributes(jobData: Record<string, unknown>): TeamTailorJobAttributes {
    const attributes: TeamTailorJobAttributes & Record<string, unknown> = {
      name: jobData.name as string,
      body: jobData.body as string,
      requirements: jobData.requirements as string,
      status: (jobData.status as "published" | "draft" | "archived") || "published",
      "apply-button-text": (jobData.applyButtonText as string) || "Apply Now",
    };

    // Add optional attributes
    this.addOptionalAttribute(attributes, "end-date", jobData.endDate);
    this.addOptionalAttribute(attributes, "start-date", jobData.startDate);
    this.addOptionalAttribute(attributes, "reference-number", jobData.referenceNumber);
    this.addOptionalAttribute(attributes, "salary-description", jobData.salaryDescription);
    this.addOptionalAttribute(attributes, "employment-type", jobData.employmentType);

    // Handle tags
    if (jobData.tags && Array.isArray(jobData.tags)) {
      attributes.tags = jobData.tags as string[];
    }

    return attributes;
  }

  /**
   * Build job relationships
   */
  private static buildRelationships(jobData: Record<string, unknown>): TeamTailorJobRelationships {
    const relationships: TeamTailorJobRelationships = {};

    // Department relationship
    if (jobData.departmentId) {
      relationships.department = {
        data: {
          id: jobData.departmentId as string,
          type: "departments",
        },
      };
    }

    // Locations relationship
    if (jobData.locationIds && Array.isArray(jobData.locationIds)) {
      relationships.locations = {
        data: (jobData.locationIds as string[]).map((id) => ({
          id,
          type: "locations" as const,
        })),
      };
    } else if (jobData.locationId) {
      relationships.locations = {
        data: [{
          id: jobData.locationId as string,
          type: "locations" as const,
        }],
      };
    }

    // Job template relationship
    if (jobData.jobTemplateId) {
      relationships["job-template"] = {
        data: {
          id: jobData.jobTemplateId as string,
          type: "job-templates",
        },
      };
    }

    // Stages relationship
    if (jobData.stageIds && Array.isArray(jobData.stageIds)) {
      relationships.stages = {
        data: (jobData.stageIds as string[]).map((id) => ({
          id,
          type: "stages" as const,
        })),
      };
    }

    return relationships;
  }

  /**
   * Add optional attribute if value exists
   */
  private static addOptionalAttribute(
    attributes: TeamTailorJobAttributes & Record<string, unknown>,
    key: string,
    value: unknown
  ): void {
    if (value !== undefined && value !== null && value !== "") {
      attributes[key] = value;
    }
  }
}