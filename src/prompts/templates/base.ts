// Base prompt templates and reusable components for building complex prompts
import type { PromptTemplate } from '@/services/ai/types';

// Common template variables used across different prompt types
export const COMMON_VARIABLES = {
  JOB_BASIC: ['title', 'level', 'department', 'employment_type', 'location', 'location_type'] as const,
  JOB_EXTENDED: ['title', 'level', 'department', 'employment_type', 'location', 'location_type', 
    'desired_minimum_years_experience', 'company_name', 'time_zone', 'contract_duration'] as const,
  COMPANY_INFO: ['company_name', 'company_description', 'company_size', 'company_industry'] as const,
  COMPENSATION: ['salary_range', 'currency', 'target_budget_usd', 'benefits'] as const
} as const;

// Reusable prompt fragments
export const PROMPT_FRAGMENTS = {
  // Standard job context section
  JOB_CONTEXT: `Job Details:
- Title: {{title}}
- Level: {{level}}
- Department: {{department}}
- Employment Type: {{employment_type}}
- Location: {{location}} ({{location_type}})
- Minimum Experience: {{desired_minimum_years_experience}} years
- Company: {{company_name}}
- Time Zone: {{time_zone}}
- Contract Duration: {{contract_duration}}`,

  // Quality guidelines for responses
  QUALITY_GUIDELINES: `Guidelines for high-quality responses:
- Be specific and actionable
- Consider the role level ({{level}}) and department ({{department}}) context
- Use current industry standards and best practices
- Avoid generic requirements or clichés
- Focus on value and impact
- Be realistic and achievable`,

  // JSON response format instruction
  JSON_ARRAY_FORMAT: `Return only a JSON array of strings, no additional text:
["item 1", "item 2", "item 3", ...]`,

  JSON_OBJECT_FORMAT: `Return only a JSON object with the specified structure, no additional text.`,

  // Experience level considerations
  EXPERIENCE_LEVEL_CONTEXT: `Consider the {{level}} level expectations:
- Ensure requirements match the seniority level
- Include appropriate leadership/mentoring expectations
- Balance individual contribution with collaboration
- Consider career growth and development opportunities`,

  // Department-specific guidance
  DEPARTMENT_CONTEXT: `Consider {{department}} department specifics:
- Focus on relevant technical skills and tools
- Include department-specific processes and methodologies  
- Consider cross-functional collaboration requirements
- Include domain knowledge relevant to the field`,

  // Inclusivity reminder
  INCLUSIVITY_REMINDER: `Ensure inclusive language and requirements:
- Use gender-neutral language
- Focus on skills over credentials where possible
- Consider diverse career paths and backgrounds
- Avoid unnecessary barriers to entry`,

  // Market competitiveness guidance
  MARKET_COMPETITIVE: `Ensure market competitiveness:
- Align with current industry standards
- Consider remote work preferences and trends
- Include growth and development opportunities
- Highlight unique value propositions`
} as const;

// Base template builders
export interface TemplateBuilder {
  id: string;
  name: string;
  description: string;
  version: string;
  variables: readonly string[];
  fragments: string[];
  instructions: string;
  format: string;
}

export function buildPromptTemplate(builder: TemplateBuilder): PromptTemplate {
  const template = [
    ...builder.fragments,
    builder.instructions,
    builder.format
  ].join('\n\n');

  return {
    id: builder.id,
    name: builder.name,
    description: builder.description,
    version: builder.version,
    variables: [...builder.variables],
    template
  };
}

// Common template combinations
export const TEMPLATE_COMBINATIONS = {
  BASIC_SKILLS: [
    PROMPT_FRAGMENTS.JOB_CONTEXT,
    PROMPT_FRAGMENTS.QUALITY_GUIDELINES,
    PROMPT_FRAGMENTS.EXPERIENCE_LEVEL_CONTEXT
  ],
  
  COMPREHENSIVE_SKILLS: [
    PROMPT_FRAGMENTS.JOB_CONTEXT,
    PROMPT_FRAGMENTS.QUALITY_GUIDELINES,
    PROMPT_FRAGMENTS.EXPERIENCE_LEVEL_CONTEXT,
    PROMPT_FRAGMENTS.DEPARTMENT_CONTEXT,
    PROMPT_FRAGMENTS.INCLUSIVITY_REMINDER
  ],

  JOB_DESCRIPTION: [
    PROMPT_FRAGMENTS.JOB_CONTEXT,
    PROMPT_FRAGMENTS.QUALITY_GUIDELINES,
    PROMPT_FRAGMENTS.MARKET_COMPETITIVE,
    PROMPT_FRAGMENTS.INCLUSIVITY_REMINDER
  ],

  ANALYSIS: [
    PROMPT_FRAGMENTS.QUALITY_GUIDELINES,
    PROMPT_FRAGMENTS.MARKET_COMPETITIVE
  ]
} as const;

// Specialized prompt instructions
export const PROMPT_INSTRUCTIONS = {
  SKILLS_GENERATION: {
    REQUIREMENTS: `Generate 6-10 specific, measurable requirements that are ESSENTIAL for this role. Focus on:
1. Technical skills and technologies specific to the role and level
2. Professional experience requirements with specific years
3. Domain knowledge relevant to the department
4. Critical soft skills appropriate for the level and role type
5. Education or certification requirements if applicable`,

    PREFERRED: `Generate 5-8 preferred qualifications that would be valuable but not strictly required. Focus on:
1. Advanced technical skills or emerging technologies
2. Additional experience that would be beneficial
3. Cross-functional skills that add value
4. Leadership or mentoring experience (if appropriate for level)
5. Industry-specific knowledge or certifications
6. Communication, collaboration, or process improvement skills`,

    RESPONSIBILITIES: `Generate 6-10 specific responsibilities that accurately reflect what this person will do day-to-day. Focus on:
1. Core technical activities and deliverables
2. Collaboration and communication responsibilities
3. Project or product ownership areas appropriate for level
4. Quality assurance and process responsibilities
5. Mentoring or leadership duties (if appropriate for level)
6. Cross-functional work and stakeholder management
7. Innovation and improvement initiatives`
  },

  JOB_DESCRIPTION: {
    FULL: `Create a compelling job description with the following sections:
1. **Role Overview**: Engaging 2-3 sentence summary of the position
2. **What You'll Do**: Formatted list of key responsibilities
3. **What We're Looking For**: Essential requirements and qualifications
4. **Nice to Have**: Preferred qualifications
5. **What We Offer**: Benefits and growth opportunities
6. **About Us**: Company culture and mission (if company description provided)`,

    HEADLINE: `Generate 3 headline variations:
1. **Direct & Clear**: Straightforward title with key details
2. **Engaging & Descriptive**: More compelling language highlighting impact
3. **Search Optimized**: Includes relevant keywords for discoverability`
  }
} as const;

// Response format templates
export const RESPONSE_FORMATS = {
  JSON_ARRAY: PROMPT_FRAGMENTS.JSON_ARRAY_FORMAT,
  
  JSON_OBJECT: PROMPT_FRAGMENTS.JSON_OBJECT_FORMAT,
  
  SKILLS_OBJECT: `{
  "requirements": ["requirement 1", "requirement 2", ...],
  "preferred_qualifications": ["qualification 1", "qualification 2", ...],
  "responsibilities": ["responsibility 1", "responsibility 2", ...]
}`,

  HEADLINES_ARRAY: `[
  {"type": "direct", "headline": "headline text"},
  {"type": "engaging", "headline": "headline text"}, 
  {"type": "optimized", "headline": "headline text"}
]`,

  FORMATTED_TEXT: `Return the content as formatted text with clear section headers and bullet points where appropriate.`
} as const;

// Template validation helpers
export function validateTemplateVariables(template: string, declaredVariables: string[]): {
  valid: boolean;
  missingVariables: string[];
  undeclaredVariables: string[];
} {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const matches = Array.from(template.matchAll(variablePattern));
  const usedVariables = new Set(matches.map(match => match[1].trim()));
  const declared = new Set(declaredVariables);

  const missingVariables = declaredVariables.filter(v => !usedVariables.has(v));
  const undeclaredVariables = Array.from(usedVariables).filter(v => !declared.has(v));

  return {
    valid: missingVariables.length === 0 && undeclaredVariables.length === 0,
    missingVariables,
    undeclaredVariables
  };
}

export function combineVariables(...variableGroups: readonly (readonly string[])[]): string[] {
  const combined = new Set<string>();
  variableGroups.forEach(group => {
    group.forEach(variable => combined.add(variable));
  });
  return Array.from(combined);
}

// Quick template builders for common use cases
export function createSkillsTemplate(
  id: string,
  name: string,
  type: 'requirements' | 'preferred' | 'responsibilities'
): PromptTemplate {
  return buildPromptTemplate({
    id,
    name,
    description: `Generates ${type} for job roles`,
    version: '2.0.0',
    variables: [...COMMON_VARIABLES.JOB_EXTENDED],
    fragments: [...TEMPLATE_COMBINATIONS.COMPREHENSIVE_SKILLS],
    instructions: PROMPT_INSTRUCTIONS.SKILLS_GENERATION[type.toUpperCase() as keyof typeof PROMPT_INSTRUCTIONS.SKILLS_GENERATION],
    format: RESPONSE_FORMATS.JSON_ARRAY
  });
}

export function createJobDescriptionTemplate(
  id: string,
  name: string,
  type: 'full' | 'headline'
): PromptTemplate {
  const variables = type === 'headline' 
    ? combineVariables(COMMON_VARIABLES.JOB_BASIC, ['company_name'])
    : combineVariables(COMMON_VARIABLES.JOB_EXTENDED, COMMON_VARIABLES.COMPANY_INFO, COMMON_VARIABLES.COMPENSATION);

  return buildPromptTemplate({
    id,
    name,
    description: `Creates ${type} job descriptions`,
    version: '1.0.0',
    variables,
    fragments: [...TEMPLATE_COMBINATIONS.JOB_DESCRIPTION],
    instructions: PROMPT_INSTRUCTIONS.JOB_DESCRIPTION[type.toUpperCase() as keyof typeof PROMPT_INSTRUCTIONS.JOB_DESCRIPTION],
    format: type === 'headline' ? RESPONSE_FORMATS.HEADLINES_ARRAY : RESPONSE_FORMATS.FORMATTED_TEXT
  });
}

const baseTemplates = {
  COMMON_VARIABLES,
  PROMPT_FRAGMENTS,
  TEMPLATE_COMBINATIONS,
  PROMPT_INSTRUCTIONS,
  RESPONSE_FORMATS,
  buildPromptTemplate,
  validateTemplateVariables,
  combineVariables,
  createSkillsTemplate,
  createJobDescriptionTemplate
};

export default baseTemplates;