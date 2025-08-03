import { ExternalOptions } from "@/types/integrations";
import { BaseService } from "../BaseService";
import { OptionsTransformer } from "./OptionsTransformer";
import { ErrorFactory } from "../../errors/ErrorFactory";
import { TEAMTAILOR_ENDPOINTS } from "../../constants";
import {
  TeamTailorApiResponse,
  TeamTailorSingleResponse,
  TeamTailorDepartment,
  TeamTailorLocation,
  TeamTailorJobTemplate,
  TeamTailorStage,
} from "../../types";

/**
 * TeamTailor Options Service
 * Handles fetching and caching of external options from TeamTailor API
 */
export class TeamTailorOptionsService extends BaseService {
  /**
   * Fetch all available options from TeamTailor
   */
  async fetchAllOptions(
    apiKey: string,
    filters?: Record<string, unknown>
  ): Promise<ExternalOptions[]> {
    this.validateApiKey(apiKey);

    try {
      const [departments, locations, jobTemplates, stages] = await Promise.all([
        this.fetchDepartments(apiKey, filters),
        this.fetchLocations(apiKey, filters),
        this.fetchJobTemplates(apiKey, filters),
        this.fetchHiringStages(apiKey, filters),
      ]);

      return [...departments, ...locations, ...jobTemplates, ...stages];
    } catch (error) {
      throw ErrorFactory.createOptionsError("all", error);
    }
  }

  /**
   * Fetch departments from TeamTailor API
   */
  async fetchDepartments(
    apiKey: string,
    filters?: Record<string, unknown>
  ): Promise<ExternalOptions[]> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling("fetchDepartments", async () => {
      const params = this.buildParams(filters);
      const response = await this.apiClient.get<TeamTailorApiResponse<TeamTailorDepartment>>(
        TEAMTAILOR_ENDPOINTS.DEPARTMENTS,
        apiKey,
        params,
        this.defaultTimeout
      );

      return response.data.map(OptionsTransformer.transformDepartment);
    });
  }

  /**
   * Fetch locations from TeamTailor API
   */
  async fetchLocations(
    apiKey: string,
    filters?: Record<string, unknown>
  ): Promise<ExternalOptions[]> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling("fetchLocations", async () => {
      const params = this.buildParams(filters);
      const response = await this.apiClient.get<TeamTailorApiResponse<TeamTailorLocation>>(
        TEAMTAILOR_ENDPOINTS.LOCATIONS,
        apiKey,
        params,
        this.defaultTimeout
      );

      return response.data.map(OptionsTransformer.transformLocation);
    });
  }

  /**
   * Fetch job templates from TeamTailor API
   */
  async fetchJobTemplates(
    apiKey: string,
    filters?: Record<string, unknown>
  ): Promise<ExternalOptions[]> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling("fetchJobTemplates", async () => {
      const params = this.buildParams(filters);
      const response = await this.apiClient.get<TeamTailorApiResponse<TeamTailorJobTemplate>>(
        TEAMTAILOR_ENDPOINTS.JOB_TEMPLATES,
        apiKey,
        params,
        this.defaultTimeout
      );

      return response.data.map(OptionsTransformer.transformJobTemplate);
    });
  }

  /**
   * Fetch hiring stages from TeamTailor API
   */
  async fetchHiringStages(
    apiKey: string,
    filters?: Record<string, unknown>
  ): Promise<ExternalOptions[]> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling("fetchHiringStages", async () => {
      const params = this.buildParams(filters);
      const response = await this.apiClient.get<TeamTailorApiResponse<TeamTailorStage>>(
        TEAMTAILOR_ENDPOINTS.STAGES,
        apiKey,
        params,
        this.defaultTimeout
      );

      // Sort stages by order
      const sortedStages = response.data.sort((a, b) => 
        a.attributes.order - b.attributes.order
      );

      return sortedStages.map(OptionsTransformer.transformStage);
    });
  }

  /**
   * Fetch a single option by ID and type
   */
  async fetchSingleOption(
    apiKey: string,
    optionType: string,
    optionId: string
  ): Promise<ExternalOptions | null> {
    this.validateApiKey(apiKey);

    return this.executeWithErrorHandling(`fetchSingleOption:${optionType}`, async () => {
      const endpoint = `/${optionType}/${optionId}`;
      const response = await this.apiClient.get<TeamTailorSingleResponse<TeamTailorDepartment | TeamTailorLocation | TeamTailorJobTemplate | TeamTailorStage>>(
        endpoint,
        apiKey,
        undefined,
        this.defaultTimeout
      );

      if (!response.data) {
        return null;
      }

      return OptionsTransformer.transformSingleOption(optionType, response.data);
    });
  }

  /**
   * Build query parameters from filters
   */
  private buildParams(filters?: Record<string, unknown>): Record<string, string> {
    const params: Record<string, string> = {
      "page[size]": "100", // Default pagination
    };

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = String(value);
        }
      });
    }

    return params;
  }
}