// Updated prompt manager using the new structured prompt system
import type {
  PromptTemplate,
  PromptContext,
  CompiledPrompt,
  PromptManager,
  SkillSuggestionContext,
  SuggestionType
} from './types';

// Import the new structured prompts
import {
  SKILL_GENERATION_TEMPLATES,
  buildContextualSkillPrompt,
  getExperienceLevelContext,
  getDepartmentContext
} from '../../prompts/skills-generation';

export class PromptManagerImpl implements PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Register skill generation templates
    Object.entries(SKILL_GENERATION_TEMPLATES).forEach(([key, template]) => {
      this.templates.set(template.id, template);
      // Also register with legacy keys for backward compatibility
      this.templates.set(key.toLowerCase(), template);
    });

    // Register legacy template IDs for backward compatibility
    this.templates.set('job_requirements', SKILL_GENERATION_TEMPLATES.REQUIREMENTS);
    this.templates.set('job_preferred_qualifications', SKILL_GENERATION_TEMPLATES.PREFERRED_QUALIFICATIONS);
    this.templates.set('job_responsibilities', SKILL_GENERATION_TEMPLATES.RESPONSIBILITIES);
    this.templates.set('comprehensive_skills', SKILL_GENERATION_TEMPLATES.COMPREHENSIVE_SKILLS);
  }

  getTemplate(id: string): PromptTemplate | null {
    return this.templates.get(id) || null;
  }

  compilePrompt(templateId: string, context: PromptContext): CompiledPrompt {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with id '${templateId}' not found`);
    }

    const variablesUsed: string[] = [];
    let compiledContent = template.template;

    // Replace template variables with context values
    for (const variable of template.variables) {
      const placeholder = `{{${variable}}}`;
      const value = context[variable];

      if (compiledContent.includes(placeholder)) {
        variablesUsed.push(variable);

        if (value !== undefined && value !== null) {
          compiledContent = compiledContent.replace(
            new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
            String(value)
          );
        } else {
          // Replace with empty string or default value for missing variables
          compiledContent = compiledContent.replace(
            new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
            'Not specified'
          );
        }
      }
    }

    return {
      content: compiledContent,
      variables_used: variablesUsed,
      template_id: templateId
    };
  }

  compileContextualPrompt(
    templateId: string,
    context: PromptContext,
    experienceLevel?: string,
    department?: string
  ): CompiledPrompt {
    const baseTemplate = this.getTemplate(templateId);
    if (!baseTemplate) {
      throw new Error(`Template with id '${templateId}' not found`);
    }

    // Create contextual template if experience level and department are provided
    let template = baseTemplate;
    if (experienceLevel && department) {
      const type = this.getSkillTypeFromTemplateId(templateId);
      if (type) {
        template = buildContextualSkillPrompt(baseTemplate, experienceLevel, department, type);
      }
    }

    return this.compilePrompt(template.id, context);
  }

  private getSkillTypeFromTemplateId(templateId: string): 'requirements' | 'preferred_qualifications' | 'responsibilities' | null {
    if (templateId.includes('requirements')) {
      return 'requirements';
    }
    if (templateId.includes('preferred') || templateId.includes('qualifications')) {
      return 'preferred_qualifications';
    }
    if (templateId.includes('responsibilities')) {
      return 'responsibilities';
    }
    return null;
  }

  listTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  validateTemplate(template: PromptTemplate): boolean {
    try {
      // Check required fields
      if (!template.id || !template.name || !template.template) {
        return false;
      }

      // Check if template string contains valid variable syntax
      const variablePattern = /\{\{([^}]+)\}\}/g;
      const matches = Array.from(template.template.matchAll(variablePattern));
      const templateVariables = matches.map(match => match[1].trim());

      // Check if declared variables match template variables
      const declaredVariables = new Set(template.variables);
      const usedVariables = new Set(templateVariables);

      // All used variables should be declared
      for (const used of usedVariables) {
        if (!declaredVariables.has(used)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  registerTemplate(template: PromptTemplate): void {
    if (!this.validateTemplate(template)) {
      throw new Error(`Invalid template: ${template.id}`);
    }
    this.templates.set(template.id, template);
  }

  removeTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  updateTemplate(template: PromptTemplate): void {
    if (!this.templates.has(template.id)) {
      throw new Error(`Template with id '${template.id}' does not exist`);
    }
    this.registerTemplate(template);
  }
}

// Utility functions (updated to use new prompt system)
export function createPromptManager(): PromptManager {
  return new PromptManagerImpl();
}

export function createSkillSuggestionContext(
  basicInfo: {
    title: string;
    level: string;
    department: string;
    employment_type: string;
    location: string;
    location_type: 'remote' | 'hybrid' | 'on-site';
    desired_minimum_years_experience: number;
    currency: string;
    target_budget_usd?: number;
    time_zone?: string;
    contract_duration: string;
  },
  companyName: string
): SkillSuggestionContext {
  return {
    title: basicInfo.title,
    level: basicInfo.level,
    department: basicInfo.department,
    employment_type: basicInfo.employment_type,
    location: basicInfo.location,
    location_type: basicInfo.location_type,
    desired_minimum_years_experience: basicInfo.desired_minimum_years_experience,
    currency: basicInfo.currency,
    target_budget_usd: basicInfo.target_budget_usd,
    company_name: companyName,
    time_zone: basicInfo.time_zone,
    contract_duration: basicInfo.contract_duration
  };
}

export function getPromptForSuggestionType(type: SuggestionType): string {
  const promptMap: Record<SuggestionType, string> = {
    requirements: 'job_requirements',
    preferred_qualifications: 'job_preferred_qualifications',
    responsibilities: 'job_responsibilities'
  };

  return promptMap[type];
}

export function createPromptContext(context: SkillSuggestionContext): PromptContext {
  return {
    title: context.title,
    level: context.level,
    department: context.department,
    employment_type: context.employment_type,
    location: context.location,
    location_type: context.location_type,
    desired_minimum_years_experience: context.desired_minimum_years_experience,
    currency: context.currency,
    target_budget_usd: context.target_budget_usd,
    company_name: context.company_name,
    time_zone: context.time_zone || 'Not specified',
    contract_duration: context.contract_duration
  };
}

// Enhanced context creation with experience level awareness
export function createEnhancedPromptContext(
  context: SkillSuggestionContext,
  enhanceWithContext: boolean = true
): PromptContext {
  const baseContext = createPromptContext(context);
  
  if (enhanceWithContext) {
    const levelContext = getExperienceLevelContext(context.level);
    const deptContext = getDepartmentContext(context.department);
    
    // Add contextual information to the prompt context
    baseContext.experience_context = levelContext.requirements_suffix || '';
    baseContext.department_focus = deptContext.focus_areas.join(', ');
    baseContext.relevant_technologies = deptContext.technologies.join(', ');
  }
  
  return baseContext;
}

// Template validation utilities (updated)
export function validateTemplateVariables(template: string, expectedVariables: string[]): {
  isValid: boolean;
  missingVariables: string[];
  extraVariables: string[];
} {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const matches = Array.from(template.matchAll(variablePattern));
  const foundVariables = new Set(matches.map(match => match[1].trim()));
  const expectedSet = new Set(expectedVariables);

  const missingVariables = expectedVariables.filter(v => !foundVariables.has(v));
  const extraVariables = Array.from(foundVariables).filter(v => !expectedSet.has(v));

  return {
    isValid: missingVariables.length === 0 && extraVariables.length === 0,
    missingVariables,
    extraVariables
  };
}

// Backward compatibility constants
export const DEFAULT_PROMPT_TEMPLATES = {
  JOB_REQUIREMENTS: 'job_requirements',
  JOB_PREFERRED_QUALIFICATIONS: 'job_preferred_qualifications',
  JOB_RESPONSIBILITIES: 'job_responsibilities',
  COMPREHENSIVE_SKILLS: 'comprehensive_skills'
} as const;