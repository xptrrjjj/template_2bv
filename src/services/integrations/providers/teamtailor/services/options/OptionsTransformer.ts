import { ExternalOptions } from "@/types/integrations";
import {
  TeamTailorDepartment,
  TeamTailorLocation,
  TeamTailorJobTemplate,
  TeamTailorStage,
} from "../../types";

/**
 * Options Transformer
 * Handles transformation of TeamTailor API responses to ExternalOptions format
 */
export class OptionsTransformer {
  /**
   * Transform department to ExternalOptions
   */
  static transformDepartment(dept: TeamTailorDepartment): ExternalOptions {
    return {
      id: dept.id,
      label: dept.attributes.name,
      value: dept.id,
      category: "departments",
      metadata: {
        name: dept.attributes.name,
        type: "department",
        createdAt: dept.attributes["created-at"],
        updatedAt: dept.attributes["updated-at"],
        selected: false,
      },
      parentId: dept.relationships?.parent?.data?.id || undefined,
    };
  }

  /**
   * Transform location to ExternalOptions
   */
  static transformLocation(location: TeamTailorLocation): ExternalOptions {
    return {
      id: location.id,
      label: location.attributes.name,
      value: location.id,
      category: "locations",
      metadata: {
        name: location.attributes.name,
        type: "location",
        city: location.attributes.city,
        country: location.attributes.country,
        createdAt: location.attributes["created-at"],
        updatedAt: location.attributes["updated-at"],
        selected: false,
      },
    };
  }

  /**
   * Transform job template to ExternalOptions
   */
  static transformJobTemplate(template: TeamTailorJobTemplate): ExternalOptions {
    return {
      id: template.id,
      label: template.attributes.name,
      value: template.id,
      category: "job_templates",
      metadata: {
        name: template.attributes.name,
        type: "job_template",
        body: template.attributes.body,
        requirements: template.attributes.requirements,
        createdAt: template.attributes["created-at"],
        updatedAt: template.attributes["updated-at"],
        selected: false,
      },
    };
  }

  /**
   * Transform stage to ExternalOptions
   */
  static transformStage(stage: TeamTailorStage): ExternalOptions {
    return {
      id: stage.id,
      label: stage.attributes.name,
      value: stage.id,
      category: "stages",
      metadata: {
        name: stage.attributes.name,
        type: "hiring_stage",
        order: stage.attributes.order,
        stageCategory: stage.attributes.category,
        createdAt: stage.attributes["created-at"],
        updatedAt: stage.attributes["updated-at"],
        selected: false,
      },
    };
  }

  /**
   * Transform single item based on type
   */
  static transformSingleOption(type: string, data: TeamTailorDepartment | TeamTailorLocation | TeamTailorJobTemplate | TeamTailorStage): ExternalOptions | null {
    switch (type) {
      case "departments":
        return this.transformDepartment(data as TeamTailorDepartment);
      case "locations":
        return this.transformLocation(data as TeamTailorLocation);
      case "job-templates":
        return this.transformJobTemplate(data as TeamTailorJobTemplate);
      case "stages":
        return this.transformStage(data as TeamTailorStage);
      default:
        return null;
    }
  }
}