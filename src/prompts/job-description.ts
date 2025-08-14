// Job description generation prompts for creating comprehensive job postings
import type { PromptTemplate } from '@/services/ai/types';

// Base template variables for job description prompts
export const JOB_DESCRIPTION_VARIABLES = [
  'title', 'level', 'department', 'employment_type', 'location', 'location_type',
  'desired_minimum_years_experience', 'company_name', 'time_zone', 'contract_duration',
  'company_description', 'team_size', 'salary_range', 'benefits', 'requirements', 
  'preferred_qualifications', 'responsibilities'
] as const;

// Complete job description generation prompt
export const FULL_JOB_DESCRIPTION_PROMPT: PromptTemplate = {
  id: 'full_job_description',
  name: 'Complete Job Description Generator',
  description: 'Generates a comprehensive, engaging job description from job details and requirements',
  version: '1.0.0',
  variables: [...JOB_DESCRIPTION_VARIABLES],
  template: `You are an expert recruiter creating an engaging, comprehensive job description. Generate a professional job posting that attracts top talent while accurately representing the role and company.

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
- Team Size: {{team_size}}
- Salary Range: {{salary_range}}

Company Information:
{{company_description}}

Role Requirements:
{{requirements}}

Preferred Qualifications:
{{preferred_qualifications}}

Key Responsibilities:
{{responsibilities}}

Benefits:
{{benefits}}

Create a compelling job description with the following sections:
1. **Role Overview**: Engaging 2-3 sentence summary of the position
2. **What You'll Do**: Formatted list of key responsibilities
3. **What We're Looking For**: Essential requirements and qualifications
4. **Nice to Have**: Preferred qualifications
5. **What We Offer**: Benefits and growth opportunities
6. **About Us**: Company culture and mission (if company description provided)

Guidelines:
- Use active, engaging language that attracts candidates
- Be specific about expectations and requirements
- Highlight growth opportunities and impact
- Include diversity and inclusion language
- Make it scannable with clear sections and bullet points
- Keep professional but approachable tone
- Ensure accuracy to the role level and department

Return the job description as formatted text with clear section headers.`
};

// Job posting headline generation
export const JOB_HEADLINE_PROMPT: PromptTemplate = {
  id: 'job_headline',
  name: 'Job Headline Generator',
  description: 'Creates compelling, search-optimized job posting headlines',
  version: '1.0.0',
  variables: ['title', 'level', 'department', 'company_name', 'location', 'employment_type'],
  template: `Create an engaging job posting headline that attracts candidates and performs well in job search results.

Job Details:
- Title: {{title}}
- Level: {{level}}
- Department: {{department}}
- Company: {{company_name}}
- Location: {{location}}
- Employment Type: {{employment_type}}

Generate 3 headline variations:
1. **Direct & Clear**: Straightforward title with key details
2. **Engaging & Descriptive**: More compelling language highlighting impact
3. **Search Optimized**: Includes relevant keywords for discoverability

Each headline should be:
- 60-80 characters for optimal search display
- Include level and key technologies if relevant
- Be specific about location/remote work
- Avoid buzzwords and clichés
- Appeal to the target audience

Return as JSON array of objects:
[
  {"type": "direct", "headline": "headline text"},
  {"type": "engaging", "headline": "headline text"}, 
  {"type": "optimized", "headline": "headline text"}
]`
};

// Company culture section prompt
export const COMPANY_CULTURE_PROMPT: PromptTemplate = {
  id: 'company_culture',
  name: 'Company Culture Section Generator',
  description: 'Creates engaging company culture content for job descriptions',
  version: '1.0.0',
  variables: ['company_name', 'company_description', 'department', 'team_size'],
  template: `Create an engaging "About Us" or company culture section for a job posting.

Company Information:
- Company Name: {{company_name}}
- Description: {{company_description}}
- Department: {{department}}
- Team Size: {{team_size}}

Generate a compelling company culture section that:
- Highlights what makes the company unique
- Describes the work environment and team dynamics
- Shows company values and mission alignment
- Explains growth opportunities and career development
- Includes team collaboration and culture aspects
- Appeals to candidates who would thrive in this environment

Keep it:
- Authentic and specific (avoid generic corporate speak)
- 2-3 paragraphs, scannable format
- Inclusive and welcoming language
- Focused on employee experience and impact
- Professional but personable tone

Return the culture section as formatted text.`
};

// Benefits and perks prompt
export const BENEFITS_PROMPT: PromptTemplate = {
  id: 'benefits_section',
  name: 'Benefits Section Generator',
  description: 'Creates comprehensive benefits and perks section for job postings',
  version: '1.0.0',
  variables: ['employment_type', 'location_type', 'level', 'benefits', 'salary_range'],
  template: `Create an engaging benefits and perks section for a job posting.

Job Context:
- Employment Type: {{employment_type}}
- Work Arrangement: {{location_type}}
- Level: {{level}}
- Salary Range: {{salary_range}}
- Provided Benefits: {{benefits}}

Create a compelling "What We Offer" section that includes:

**Compensation & Financial Benefits:**
- Competitive salary information (if provided)
- Bonus/equity opportunities (if applicable)
- Financial wellness benefits

**Health & Wellness:**
- Health insurance and medical benefits
- Mental health and wellness programs
- Work-life balance initiatives

**Professional Development:**
- Learning and development opportunities
- Conference attendance and training budgets
- Career advancement paths
- Mentorship programs

**Work Environment:**
- Remote/hybrid/office perks based on {{location_type}}
- Flexible working arrangements
- Team collaboration and social activities
- Office amenities (if applicable)

**Time Off & Flexibility:**
- PTO and vacation policies
- Sick leave and personal time
- Parental leave policies
- Flexible scheduling options

Format as a scannable list with clear categories. Be specific where possible but avoid overpromising. Focus on benefits that matter most to {{level}} level professionals.

Return as formatted text with clear section headers and bullet points.`
};

// Equal opportunity statement prompt
export const EEO_STATEMENT_PROMPT: PromptTemplate = {
  id: 'eeo_statement',
  name: 'Equal Opportunity Statement Generator',
  description: 'Generates inclusive equal opportunity employment statements',
  version: '1.0.0',
  variables: ['company_name'],
  template: `Create a comprehensive, inclusive Equal Employment Opportunity (EEO) statement for {{company_name}}.

The statement should:
- Affirm commitment to equal opportunity employment
- Include protected classes (race, color, religion, gender, national origin, age, disability, sexual orientation, gender identity, veteran status)
- Encourage applications from underrepresented groups
- Mention accommodations for disabilities
- Be legally compliant but genuine and welcoming
- Reflect modern inclusive hiring practices

Keep it professional, clear, and authentically supportive of diversity and inclusion.

Return as a single paragraph of formatted text.`
};

// Application instructions prompt
export const APPLICATION_INSTRUCTIONS_PROMPT: PromptTemplate = {
  id: 'application_instructions',
  name: 'Application Instructions Generator',
  description: 'Creates clear, actionable application instructions for candidates',
  version: '1.0.0',
  variables: ['title', 'company_name', 'application_deadline'],
  template: `Create clear application instructions for the {{title}} position at {{company_name}}.

Details:
- Application Deadline: {{application_deadline}}

Generate application instructions that include:

**How to Apply:**
- Clear next steps for candidates
- Required documents (resume, cover letter, portfolio, etc.)
- Application timeline and process
- What candidates can expect after applying

**Application Requirements:**
- Specific materials needed for this role
- Format preferences (PDF, links, etc.)
- Portfolio or work samples if relevant
- Any role-specific requirements

**Next Steps:**
- Interview process overview
- Timeline for response
- Contact information for questions
- Equal opportunity statement reference

Make it:
- Clear and actionable
- Professional but encouraging
- Specific about requirements
- Transparent about process and timing

Return as formatted text with clear sections and bullet points.`
};

// Export all job description templates
export const JOB_DESCRIPTION_TEMPLATES = {
  FULL_DESCRIPTION: FULL_JOB_DESCRIPTION_PROMPT,
  HEADLINE: JOB_HEADLINE_PROMPT,
  COMPANY_CULTURE: COMPANY_CULTURE_PROMPT,
  BENEFITS: BENEFITS_PROMPT,
  EEO_STATEMENT: EEO_STATEMENT_PROMPT,
  APPLICATION_INSTRUCTIONS: APPLICATION_INSTRUCTIONS_PROMPT
} as const;

export default JOB_DESCRIPTION_TEMPLATES;