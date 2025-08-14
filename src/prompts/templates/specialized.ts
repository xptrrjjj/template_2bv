// Specialized prompt templates for specific use cases and industries
import type { PromptTemplate } from '@/services/ai/types';
import { buildPromptTemplate, COMMON_VARIABLES, PROMPT_FRAGMENTS, combineVariables } from './base';

// Industry-specific template variations
export const INDUSTRY_TEMPLATES = {
  TECHNOLOGY: {
    requirements_focus: `Focus on technical depth and innovation:
- Programming languages, frameworks, and development tools
- System architecture and scalability considerations
- DevOps, CI/CD, and deployment practices
- Code quality, testing, and documentation standards
- Performance optimization and troubleshooting skills
- Agile development and collaboration practices`,

    responsibilities_focus: `Emphasize technical delivery and innovation:
- Software design, development, and deployment
- Code review and technical mentoring
- System architecture and performance optimization
- Technical documentation and knowledge sharing
- Cross-team collaboration and technical leadership
- Innovation and continuous improvement initiatives`
  },

  HEALTHCARE: {
    requirements_focus: `Focus on healthcare domain expertise and compliance:
- Healthcare industry knowledge and regulations (HIPAA, FDA, etc.)
- Clinical workflows and healthcare data standards
- Privacy, security, and compliance requirements
- Healthcare technology platforms and integrations
- Patient safety and quality improvement understanding
- Healthcare stakeholder communication`,

    responsibilities_focus: `Emphasize patient impact and regulatory compliance:
- Healthcare solution development and implementation
- Compliance monitoring and quality assurance
- Clinical stakeholder collaboration and support
- Healthcare data management and privacy protection
- Patient experience and safety improvement initiatives
- Regulatory documentation and reporting`
  },

  FINTECH: {
    requirements_focus: `Focus on financial services and regulatory compliance:
- Financial industry knowledge and regulations
- Payment processing and financial transaction systems
- Risk management and fraud prevention
- Data security and financial compliance (PCI DSS, SOX, etc.)
- Financial modeling and quantitative analysis
- Regulatory reporting and audit preparation`,

    responsibilities_focus: `Emphasize financial accuracy and risk management:
- Financial system development and maintenance
- Risk assessment and compliance monitoring
- Financial data analysis and reporting
- Customer financial experience optimization
- Regulatory change management and implementation
- Financial product development and testing`
  }
} as const;

// Role-level specific templates
export const ROLE_LEVEL_TEMPLATES = {
  EXECUTIVE: {
    leadership_focus: `Executive-level leadership and strategy:
- Strategic vision and long-term planning
- Organizational leadership and culture development
- Stakeholder management and board communication
- P&L responsibility and business performance
- Market analysis and competitive positioning
- Change management and transformation leadership`,

    responsibilities_executive: `Executive-level accountability and impact:
- Organizational strategy development and execution
- Team leadership and talent development
- Board and investor relations management
- Business performance and growth driving
- Market expansion and competitive advantage creation
- Corporate culture and values leadership`
  },

  INDIVIDUAL_CONTRIBUTOR: {
    ic_focus: `Individual contributor excellence and growth:
- Deep technical or functional expertise
- Project execution and delivery excellence
- Quality and continuous improvement
- Knowledge sharing and documentation
- Cross-functional collaboration
- Professional development and skill building`,

    responsibilities_ic: `Individual contributor impact and growth:
- High-quality work delivery and execution
- Process improvement and optimization
- Knowledge transfer and mentoring
- Cross-team collaboration and communication
- Innovation and creative problem solving
- Personal and professional skill development`
  }
} as const;

// Experience level enhanced templates
export function createExperienceLevelTemplate(
  baseTemplate: PromptTemplate,
  experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | 'director'
): PromptTemplate {
  const experienceGuidance = {
    entry: `Entry-level focus (0-2 years experience):
- Emphasize learning potential and foundational skills
- Focus on educational background and projects
- Include mentorship and training opportunities
- Consider internships and academic projects as relevant experience
- Prioritize growth mindset and adaptability`,

    junior: `Junior-level focus (1-3 years experience):
- Balance foundational skills with some specialization
- Include basic project experience and contributions
- Focus on skill development and learning trajectory
- Consider diverse backgrounds and career transitions
- Emphasize team collaboration and communication`,

    mid: `Mid-level focus (3-6 years experience):
- Require proven experience and some specialization
- Include independent project ownership
- Balance technical depth with breadth
- Consider leadership potential and mentoring abilities
- Focus on impact and results delivery`,

    senior: `Senior-level focus (6+ years experience):
- Demand deep expertise and proven leadership
- Require system-level thinking and architecture experience
- Include mentoring and technical leadership responsibilities
- Focus on strategic impact and business value
- Consider cross-functional collaboration and influence`,

    staff: `Staff-level focus (8+ years experience):
- Require technical excellence and broad impact
- Include cross-team leadership and influence
- Focus on technical strategy and architecture decisions
- Emphasize knowledge transfer and organizational impact
- Consider industry expertise and thought leadership`,

    principal: `Principal-level focus (10+ years experience):
- Require industry expertise and organizational impact
- Include technical vision and strategic planning
- Focus on organizational influence and culture building
- Emphasize external visibility and industry contribution
- Consider business acumen and stakeholder management`,

    director: `Director-level focus (8+ years experience + management):
- Require team leadership and people management
- Include organizational strategy and vision setting
- Focus on business impact and performance management
- Emphasize stakeholder management and communication
- Consider budget management and resource planning`
  };

  return {
    ...baseTemplate,
    id: `${baseTemplate.id}_${experienceLevel}`,
    name: `${baseTemplate.name} (${experienceLevel} level)`,
    template: `${baseTemplate.template}\n\n${experienceGuidance[experienceLevel]}`
  };
}

// Remote work specific templates
export const REMOTE_WORK_TEMPLATES = {
  FULLY_REMOTE: `Remote work considerations:
- Strong written communication and documentation skills
- Self-motivation and independent work capabilities
- Experience with remote collaboration tools and practices
- Time management across different time zones
- Virtual team leadership and relationship building
- Digital communication and presentation skills`,

  HYBRID: `Hybrid work considerations:
- Flexibility to work both remotely and in-office effectively
- Strong communication skills for both virtual and in-person settings
- Adaptability to different work environments and styles
- Collaboration skills across distributed and co-located teams
- Office presence for key meetings and collaborative sessions
- Balance of independent and collaborative work preferences`,

  ON_SITE: `On-site work considerations:
- Strong in-person collaboration and communication skills
- Ability to work effectively in office environment
- Face-to-face meeting and presentation capabilities
- Physical presence for collaborative work and team building
- Local market knowledge and community connections
- Office-based tool and process familiarity`
} as const;

// Specialized skill assessment templates
export function createTechnicalAssessmentTemplate(technology: string): PromptTemplate {
  return buildPromptTemplate({
    id: `technical_assessment_${technology.toLowerCase()}`,
    name: `${technology} Technical Assessment`,
    description: `Creates technical requirements specifically for ${technology} roles`,
    version: '1.0.0',
    variables: combineVariables(COMMON_VARIABLES.JOB_EXTENDED),
    fragments: [
      PROMPT_FRAGMENTS.JOB_CONTEXT,
      `Technology Focus: ${technology}`,
      PROMPT_FRAGMENTS.QUALITY_GUIDELINES
    ],
    instructions: `Generate technical requirements specifically for ${technology} expertise:

1. **Core ${technology} Skills**: Essential technical skills and proficiency levels
2. **Related Technologies**: Complementary tools, frameworks, and platforms
3. **Experience Requirements**: Specific project types and complexity levels
4. **Best Practices**: Knowledge of ${technology} best practices and patterns
5. **Problem-Solving**: Ability to troubleshoot and optimize ${technology} solutions

Focus on current market demand and practical application of ${technology} skills.`,
    format: `Return requirements as a JSON array focusing on ${technology} technical competencies.`
  });
}

// Diversity and inclusion enhanced templates
export const DIVERSITY_INCLUSION_TEMPLATES = {
  INCLUSIVE_LANGUAGE: `Use inclusive language throughout:
- Gender-neutral terms (developer instead of "rockstar developer")
- Avoid cultural assumptions or references
- Use "person-first" language where appropriate
- Focus on skills and outcomes rather than background
- Include "or equivalent experience" for education requirements
- Emphasize diverse perspectives and experiences as valuable`,

  BARRIER_REDUCTION: `Reduce unnecessary barriers:
- Question degree requirements - can skills be demonstrated otherwise?
- Consider alternative career paths and non-traditional backgrounds
- Allow for skill development and learning on the job
- Focus on potential and growth mindset, not just current experience
- Consider different forms of experience (volunteer, project-based, etc.)
- Offer clear growth and development opportunities`,

  INCLUSIVE_BENEFITS: `Highlight inclusive benefits and culture:
- Professional development and learning opportunities
- Flexible work arrangements and life balance
- Diverse and inclusive team culture
- Mentorship and career advancement programs
- Health and wellness support for all identities
- Community involvement and social impact opportunities`
} as const;

// Performance-optimized templates for different use cases
export const PERFORMANCE_TEMPLATES = {
  QUICK_GENERATION: {
    variables: COMMON_VARIABLES.JOB_BASIC,
    fragments: [PROMPT_FRAGMENTS.JOB_CONTEXT, PROMPT_FRAGMENTS.JSON_ARRAY_FORMAT],
    maxTokens: 500
  },

  COMPREHENSIVE_ANALYSIS: {
    variables: combineVariables(COMMON_VARIABLES.JOB_EXTENDED, COMMON_VARIABLES.COMPANY_INFO),
    fragments: [
      PROMPT_FRAGMENTS.JOB_CONTEXT,
      PROMPT_FRAGMENTS.QUALITY_GUIDELINES,
      PROMPT_FRAGMENTS.EXPERIENCE_LEVEL_CONTEXT,
      PROMPT_FRAGMENTS.DEPARTMENT_CONTEXT,
      PROMPT_FRAGMENTS.INCLUSIVITY_REMINDER
    ],
    maxTokens: 2000
  }
} as const;

// Template factory functions
export function createIndustrySpecificTemplate(
  baseTemplate: PromptTemplate,
  industry: keyof typeof INDUSTRY_TEMPLATES
): PromptTemplate {
  const industryContext = INDUSTRY_TEMPLATES[industry];
  
  return {
    ...baseTemplate,
    id: `${baseTemplate.id}_${industry.toLowerCase()}`,
    name: `${baseTemplate.name} (${industry})`,
    template: `${baseTemplate.template}\n\nIndustry Context:\n${industryContext.requirements_focus}`
  };
}

export function createRemoteWorkTemplate(
  baseTemplate: PromptTemplate,
  workType: keyof typeof REMOTE_WORK_TEMPLATES
): PromptTemplate {
  return {
    ...baseTemplate,
    id: `${baseTemplate.id}_${workType.toLowerCase()}`,
    name: `${baseTemplate.name} (${workType.replace('_', ' ')})`,
    template: `${baseTemplate.template}\n\n${REMOTE_WORK_TEMPLATES[workType]}`
  };
}

export function createDiversityEnhancedTemplate(baseTemplate: PromptTemplate): PromptTemplate {
  return {
    ...baseTemplate,
    id: `${baseTemplate.id}_inclusive`,
    name: `${baseTemplate.name} (Diversity Enhanced)`,
    template: `${baseTemplate.template}\n\nDiversity & Inclusion Guidelines:\n${DIVERSITY_INCLUSION_TEMPLATES.INCLUSIVE_LANGUAGE}\n\n${DIVERSITY_INCLUSION_TEMPLATES.BARRIER_REDUCTION}`
  };
}

const specializedTemplates = {
  INDUSTRY_TEMPLATES,
  ROLE_LEVEL_TEMPLATES,
  REMOTE_WORK_TEMPLATES,
  DIVERSITY_INCLUSION_TEMPLATES,
  PERFORMANCE_TEMPLATES,
  createExperienceLevelTemplate,
  createTechnicalAssessmentTemplate,
  createIndustrySpecificTemplate,
  createRemoteWorkTemplate,
  createDiversityEnhancedTemplate
};

export default specializedTemplates;