// Centralized prompt management system with flexible templates
import type {
  PromptTemplate,
  PromptContext,
  CompiledPrompt,
  PromptManager,
  SkillSuggestionContext,
  SuggestionType
} from './types';

export class PromptManagerImpl implements PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Requirements generation prompt
    this.registerTemplate({
      id: 'job_requirements',
      name: 'Job Requirements Generator',
      description: 'Generates technical and professional requirements for a job role',
      version: '1.0.0',
      variables: [
        'title', 'level', 'department', 'employment_type', 'location', 'location_type',
        'desired_minimum_years_experience', 'company_name', 'time_zone', 'contract_duration'
      ],
      template: `You are an expert technical recruiter generating job requirements. Based on the job details provided, create a comprehensive list of REQUIRED skills and qualifications.

Job Details:
- Title: {{title}}
- Level: {{level}}
- Department: {{department}}
- Employment Type: {{employment_type}}
- Location: {{location}} ({{location_type}})
- Minimum Experience: {{desired_minimum_years_experience}} years
- Company: {{company_name}}
- Time Zone: {{time_zone}}
- Contract Duration: {{contract_duration}}

Generate 6-10 specific, measurable requirements that are ESSENTIAL for this role. Focus on:
1. Technical skills and technologies specific to the role and level
2. Professional experience requirements
3. Domain knowledge relevant to the department
4. Critical soft skills for the level and role type
5. Education or certification requirements if applicable

Format each requirement as a clear, concise statement. Be specific about technologies, years of experience, and skill levels. Avoid generic requirements.

Return only a JSON array of strings, no additional text:
["requirement 1", "requirement 2", ...]`
    });

    // Preferred qualifications prompt
    this.registerTemplate({
      id: 'job_preferred_qualifications',
      name: 'Preferred Qualifications Generator',
      description: 'Generates nice-to-have qualifications that would make candidates stand out',
      version: '1.0.0',
      variables: [
        'title', 'level', 'department', 'employment_type', 'location', 'location_type',
        'desired_minimum_years_experience', 'company_name', 'time_zone', 'contract_duration'
      ],
      template: `You are an expert technical recruiter generating preferred qualifications. Based on the job details provided, create a list of PREFERRED (nice-to-have) skills that would make candidates stand out.

Job Details:
- Title: {{title}}
- Level: {{level}}
- Department: {{department}}
- Employment Type: {{employment_type}}
- Location: {{location}} ({{location_type}})
- Minimum Experience: {{desired_minimum_years_experience}} years
- Company: {{company_name}}
- Time Zone: {{time_zone}}
- Contract Duration: {{contract_duration}}

Generate 5-8 preferred qualifications that would be valuable but not strictly required. Focus on:
1. Advanced technical skills or emerging technologies
2. Additional experience that would be beneficial
3. Cross-functional skills that add value
4. Leadership or mentoring experience (if appropriate for level)
5. Industry-specific knowledge or certifications
6. Communication or collaboration skills
7. Experience with specific tools, frameworks, or methodologies

Format each qualification as a clear, concise statement. These should be aspirational but realistic for the role level.

Return only a JSON array of strings, no additional text:
["qualification 1", "qualification 2", ...]`
    });

    // Responsibilities prompt
    this.registerTemplate({
      id: 'job_responsibilities',
      name: 'Job Responsibilities Generator',
      description: 'Generates key responsibilities and day-to-day activities for a job role',
      version: '1.0.0',
      variables: [
        'title', 'level', 'department', 'employment_type', 'location', 'location_type',
        'desired_minimum_years_experience', 'company_name', 'time_zone', 'contract_duration'
      ],
      template: `You are an expert technical recruiter generating job responsibilities. Based on the job details provided, create a comprehensive list of key responsibilities and day-to-day activities.

Job Details:
- Title: {{title}}
- Level: {{level}}
- Department: {{department}}
- Employment Type: {{employment_type}}
- Location: {{location}} ({{location_type}})
- Minimum Experience: {{desired_minimum_years_experience}} years
- Company: {{company_name}}
- Time Zone: {{time_zone}}
- Contract Duration: {{contract_duration}}

Generate 6-10 specific responsibilities that accurately reflect what this person will do day-to-day. Consider the level and department context. Focus on:
1. Core technical activities and deliverables
2. Collaboration and communication responsibilities
3. Project or product ownership areas
4. Quality and process responsibilities
5. Mentoring or leadership duties (if appropriate for level)
6. Cross-functional work and stakeholder management
7. Innovation and improvement initiatives

Format each responsibility as an action-oriented statement starting with a strong verb. Be specific about the scope and impact of each responsibility.

Return only a JSON array of strings, no additional text:
["responsibility 1", "responsibility 2", ...]`
    });

    // Comprehensive skills generation prompt
    this.registerTemplate({
      id: 'comprehensive_skills',
      name: 'Comprehensive Skills Generator',
      description: 'Generates all skill categories (requirements, preferred, responsibilities) in one request',
      version: '1.0.0',
      variables: [
        'title', 'level', 'department', 'employment_type', 'location', 'location_type',
        'desired_minimum_years_experience', 'company_name', 'time_zone', 'contract_duration'
      ],
      template: `You are an expert technical recruiter creating a comprehensive job specification. Based on the job details provided, generate requirements, preferred qualifications, and responsibilities.

Job Details:
- Title: {{title}}
- Level: {{level}}
- Department: {{department}}
- Employment Type: {{employment_type}}
- Location: {{location}} ({{location_type}})
- Minimum Experience: {{desired_minimum_years_experience}} years
- Company: {{company_name}}
- Time Zone: {{time_zone}}
- Contract Duration: {{contract_duration}}

Create three distinct categories:

1. REQUIREMENTS (6-10 items): Essential skills, experience, and qualifications that candidates MUST have
2. PREFERRED QUALIFICATIONS (5-8 items): Nice-to-have skills that would make candidates stand out
3. RESPONSIBILITIES (6-10 items): Key day-to-day activities and accountabilities

Consider the seniority level, department context, and role type. Be specific and actionable.

Return only a JSON object with this exact structure:
{
  "requirements": ["requirement 1", "requirement 2", ...],
  "preferred_qualifications": ["qualification 1", "qualification 2", ...],
  "responsibilities": ["responsibility 1", "responsibility 2", ...]
}`
    });
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

// Utility functions for prompt management
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

// Template validation utilities
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

// Default prompt templates export for external use
export const DEFAULT_PROMPT_TEMPLATES = {
  JOB_REQUIREMENTS: 'job_requirements',
  JOB_PREFERRED_QUALIFICATIONS: 'job_preferred_qualifications',
  JOB_RESPONSIBILITIES: 'job_responsibilities',
  COMPREHENSIVE_SKILLS: 'comprehensive_skills'
} as const;