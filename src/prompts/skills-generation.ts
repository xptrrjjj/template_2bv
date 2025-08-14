// Skills generation prompts with different strategies for various skill types and experience levels
import type { PromptTemplate } from '@/services/ai/types';

export interface SkillGenerationStrategy {
  junior: PromptTemplate;
  mid: PromptTemplate;
  senior: PromptTemplate;
  lead: PromptTemplate;
}

export interface SkillPromptVariations {
  technical: SkillGenerationStrategy;
  business: SkillGenerationStrategy;
  creative: SkillGenerationStrategy;
  operations: SkillGenerationStrategy;
}

// Base template variables for all skill generation prompts
export const SKILL_TEMPLATE_VARIABLES = [
  'title', 'level', 'department', 'employment_type', 'location', 'location_type',
  'desired_minimum_years_experience', 'company_name', 'time_zone', 'contract_duration'
] as const;

// Core skill generation prompts
export const REQUIREMENTS_PROMPT: PromptTemplate = {
  id: 'job_requirements',
  name: 'Job Requirements Generator',
  description: 'Generates essential technical and professional requirements for a job role',
  version: '2.0.0',
  variables: [...SKILL_TEMPLATE_VARIABLES],
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
2. Professional experience requirements with specific years
3. Domain knowledge relevant to the department
4. Critical soft skills appropriate for the level and role type
5. Education or certification requirements if applicable

Requirements should be:
- Specific and measurable (include years of experience, specific technologies)
- Appropriate for the {{level}} level (avoid over/under-qualification)
- Relevant to {{department}} department context
- Realistic for the current job market
- Essential (not nice-to-have)

Return only a JSON array of strings, no additional text:
["requirement 1", "requirement 2", ...]`
};

export const PREFERRED_QUALIFICATIONS_PROMPT: PromptTemplate = {
  id: 'job_preferred_qualifications',
  name: 'Preferred Qualifications Generator',
  description: 'Generates valuable but non-essential qualifications that would make candidates stand out',
  version: '2.0.0',
  variables: [...SKILL_TEMPLATE_VARIABLES],
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
4. Leadership or mentoring experience (if appropriate for {{level}} level)
5. Industry-specific knowledge or certifications
6. Communication, collaboration, or process improvement skills
7. Experience with specific tools, frameworks, or methodologies

Qualifications should be:
- Aspirational but realistic for the {{level}} level
- Complementary to (not overlapping with) basic requirements
- Valuable for career growth and team contribution
- Specific enough to be actionable

Return only a JSON array of strings, no additional text:
["qualification 1", "qualification 2", ...]`
};

export const RESPONSIBILITIES_PROMPT: PromptTemplate = {
  id: 'job_responsibilities',
  name: 'Job Responsibilities Generator',
  description: 'Generates key responsibilities and day-to-day activities for a job role',
  version: '2.0.0',
  variables: [...SKILL_TEMPLATE_VARIABLES],
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

Generate 6-10 specific responsibilities that accurately reflect what this person will do day-to-day. Consider the {{level}} level and {{department}} department context. Focus on:

1. Core technical activities and deliverables
2. Collaboration and communication responsibilities
3. Project or product ownership areas appropriate for {{level}} level
4. Quality assurance and process responsibilities
5. Mentoring or leadership duties (if appropriate for {{level}} level)
6. Cross-functional work and stakeholder management
7. Innovation and improvement initiatives

Responsibilities should be:
- Action-oriented (start with strong verbs: Design, Develop, Lead, Collaborate, etc.)
- Specific to the role level ({{level}}) and department ({{department}})
- Realistic for day-to-day work
- Include both individual contributor and collaborative aspects
- Show career growth appropriate for the level

Return only a JSON array of strings, no additional text:
["responsibility 1", "responsibility 2", ...]`
};

// Comprehensive skills generation prompt
export const COMPREHENSIVE_SKILLS_PROMPT: PromptTemplate = {
  id: 'comprehensive_skills',
  name: 'Comprehensive Skills Generator',
  description: 'Generates all skill categories (requirements, preferred, responsibilities) in one optimized request',
  version: '2.0.0',
  variables: [...SKILL_TEMPLATE_VARIABLES],
  template: `You are an expert technical recruiter creating a comprehensive job specification. Based on the job details provided, generate requirements, preferred qualifications, and responsibilities that work together cohesively.

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

Create three distinct, complementary categories:

**1. REQUIREMENTS (6-10 items)**: Essential skills, experience, and qualifications that candidates MUST have
- Technical skills specific to {{title}} at {{level}} level
- Required years of experience with specific technologies
- Essential domain knowledge for {{department}}
- Critical soft skills for the role type and level
- Mandatory education/certifications if applicable

**2. PREFERRED QUALIFICATIONS (5-8 items)**: Valuable additions that would make candidates stand out
- Advanced or emerging technologies
- Cross-functional experience
- Leadership/mentoring experience (if appropriate for {{level}})
- Additional certifications or domain expertise
- Process improvement or innovation experience

**3. RESPONSIBILITIES (6-10 items)**: Key day-to-day activities and accountabilities
- Core technical work appropriate for {{level}} level
- Collaboration and communication activities
- Project/product ownership relevant to the role
- Quality and process responsibilities
- Growth and development activities appropriate for level

Ensure all categories:
- Are appropriate for {{level}} level in {{department}}
- Work together cohesively (no conflicts or overlaps)
- Reflect current industry standards and practices
- Consider {{location_type}} work arrangement
- Are specific and actionable

Return only a JSON object with this exact structure:
{
  "requirements": ["requirement 1", "requirement 2", ...],
  "preferred_qualifications": ["qualification 1", "qualification 2", ...],
  "responsibilities": ["responsibility 1", "responsibility 2", ...]
}`
};

// Experience-level specific variations
interface ExperienceLevelContext {
  readonly requirements_suffix: string;
  readonly preferred_suffix: string;
  readonly responsibilities_suffix: string;
}

export const EXPERIENCE_LEVEL_PROMPTS = {
  junior: {
    requirements_suffix: `Focus on foundational skills, educational requirements, and willingness to learn. Avoid requiring extensive years of experience.`,
    preferred_suffix: `Emphasize learning potential, academic projects, internships, and basic exposure to technologies.`,
    responsibilities_suffix: `Focus on learning, contributing to team projects, following established processes, and growing technical skills.`
  } as ExperienceLevelContext,
  mid: {
    requirements_suffix: `Balance technical depth with breadth. Require proven experience and some specialization.`,
    preferred_suffix: `Look for technical leadership potential, process improvement experience, and cross-functional exposure.`,
    responsibilities_suffix: `Include independent project ownership, mentoring junior developers, and contributing to technical decisions.`
  } as ExperienceLevelContext,
  senior: {
    requirements_suffix: `Demand deep technical expertise, system design experience, and proven leadership capabilities.`,
    preferred_suffix: `Seek industry thought leadership, mentoring experience, and strategic thinking capabilities.`,
    responsibilities_suffix: `Include architecture decisions, team leadership, cross-functional collaboration, and strategic planning.`
  } as ExperienceLevelContext,
  lead: {
    requirements_suffix: `Require extensive experience, proven team leadership, and strategic technical vision.`,
    preferred_suffix: `Look for organizational influence, public speaking, open source contributions, and business acumen.`,
    responsibilities_suffix: `Include team management, technical strategy, stakeholder communication, and organizational impact.`
  } as ExperienceLevelContext
} as const;

// Department-specific prompt variations
export const DEPARTMENT_SPECIFIC_CONTEXTS = {
  engineering: {
    focus_areas: ['software architecture', 'code quality', 'technical leadership', 'system scalability'],
    technologies: ['programming languages', 'frameworks', 'databases', 'cloud platforms', 'DevOps tools']
  },
  product: {
    focus_areas: ['user experience', 'product strategy', 'market analysis', 'stakeholder management'],
    technologies: ['analytics tools', 'design software', 'project management tools', 'user research platforms']
  },
  design: {
    focus_areas: ['user experience', 'visual design', 'design systems', 'user research'],
    technologies: ['design tools', 'prototyping software', 'collaboration platforms', 'research tools']
  },
  marketing: {
    focus_areas: ['brand strategy', 'campaign management', 'data analysis', 'content creation'],
    technologies: ['marketing automation', 'analytics platforms', 'content management', 'social media tools']
  },
  sales: {
    focus_areas: ['relationship building', 'deal negotiation', 'pipeline management', 'customer success'],
    technologies: ['CRM systems', 'sales automation', 'communication tools', 'analytics platforms']
  },
  operations: {
    focus_areas: ['process optimization', 'resource management', 'quality assurance', 'efficiency improvement'],
    technologies: ['project management tools', 'automation platforms', 'data analysis tools', 'communication systems']
  }
} as const;

// Utility functions for dynamic prompt generation
export function getExperienceLevelContext(level: string): ExperienceLevelContext {
  const normalizedLevel = level.toLowerCase();
  if (normalizedLevel.includes('junior') || normalizedLevel.includes('entry')) {
    return EXPERIENCE_LEVEL_PROMPTS.junior;
  }
  if (normalizedLevel.includes('senior') || normalizedLevel.includes('staff')) {
    return EXPERIENCE_LEVEL_PROMPTS.senior;
  }
  if (normalizedLevel.includes('lead') || normalizedLevel.includes('principal') || normalizedLevel.includes('director')) {
    return EXPERIENCE_LEVEL_PROMPTS.lead;
  }
  return EXPERIENCE_LEVEL_PROMPTS.mid; // Default to mid-level
}

export function getDepartmentContext(department: string) {
  const normalizedDept = department.toLowerCase();
  if (normalizedDept.includes('engineering') || normalizedDept.includes('development')) {
    return DEPARTMENT_SPECIFIC_CONTEXTS.engineering;
  }
  if (normalizedDept.includes('product')) {
    return DEPARTMENT_SPECIFIC_CONTEXTS.product;
  }
  if (normalizedDept.includes('design')) {
    return DEPARTMENT_SPECIFIC_CONTEXTS.design;
  }
  if (normalizedDept.includes('marketing')) {
    return DEPARTMENT_SPECIFIC_CONTEXTS.marketing;
  }
  if (normalizedDept.includes('sales')) {
    return DEPARTMENT_SPECIFIC_CONTEXTS.sales;
  }
  return DEPARTMENT_SPECIFIC_CONTEXTS.operations; // Default fallback
}

// Enhanced prompt builder that considers experience level and department
export function buildContextualSkillPrompt(
  baseTemplate: PromptTemplate,
  level: string,
  department: string,
  type: 'requirements' | 'preferred_qualifications' | 'responsibilities'
): PromptTemplate {
  const levelContext = getExperienceLevelContext(level);
  const deptContext = getDepartmentContext(department);
  
  const contextualSuffix = `
  
Consider these context-specific guidelines:
- Experience Level: ${levelContext[`${type}_suffix` as keyof typeof levelContext]}
- Department Focus: Emphasize ${deptContext.focus_areas.join(', ')}
- Relevant Technologies: Consider ${deptContext.technologies.join(', ')}`;

  return {
    ...baseTemplate,
    id: `${baseTemplate.id}_contextual`,
    template: baseTemplate.template + contextualSuffix
  };
}

// Export all skill generation templates
export const SKILL_GENERATION_TEMPLATES = {
  REQUIREMENTS: REQUIREMENTS_PROMPT,
  PREFERRED_QUALIFICATIONS: PREFERRED_QUALIFICATIONS_PROMPT,
  RESPONSIBILITIES: RESPONSIBILITIES_PROMPT,
  COMPREHENSIVE_SKILLS: COMPREHENSIVE_SKILLS_PROMPT
} as const;

export default SKILL_GENERATION_TEMPLATES;