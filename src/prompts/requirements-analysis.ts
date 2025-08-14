// Requirements analysis prompts for analyzing and improving job requirements
import type { PromptTemplate } from '@/services/ai/types';

// Base template variables for requirements analysis
export const REQUIREMENTS_ANALYSIS_VARIABLES = [
  'job_requirements', 'market_data', 'similar_roles', 'candidate_feedback', 
  'application_rate', 'interview_success_rate', 'title', 'level', 'department'
] as const;

// Requirements optimization prompt
export const REQUIREMENTS_OPTIMIZATION_PROMPT: PromptTemplate = {
  id: 'requirements_optimization',
  name: 'Job Requirements Optimizer',
  description: 'Analyzes and suggests improvements for job requirements based on market data and performance',
  version: '1.0.0',
  variables: [...REQUIREMENTS_ANALYSIS_VARIABLES],
  template: `You are an expert talent acquisition analyst. Analyze the current job requirements and suggest optimizations to improve candidate quality and application rates.

Current Job Requirements:
{{job_requirements}}

Role Context:
- Title: {{title}}
- Level: {{level}}
- Department: {{department}}

Performance Data:
- Application Rate: {{application_rate}}
- Interview Success Rate: {{interview_success_rate}}

Market Context:
{{market_data}}

Similar Role Examples:
{{similar_roles}}

Candidate Feedback:
{{candidate_feedback}}

Analyze the requirements and provide:

**1. Requirements Assessment:**
- Which requirements are essential vs. nice-to-have?
- Are any requirements overly restrictive for the role level?
- Which requirements might be deterring qualified candidates?

**2. Market Alignment:**
- How do these requirements compare to market standards?
- Are there gaps in emerging skills or technologies?
- Are salary/experience expectations realistic?

**3. Optimization Recommendations:**
- Specific changes to improve candidate attraction
- Requirements to remove, modify, or add
- Alternative ways to express the same needs
- Suggestions for expanding the candidate pool

**4. Prioritized Action Items:**
- High-impact changes to make immediately
- Medium-term adjustments to consider
- Long-term strategic improvements

Return structured analysis with specific, actionable recommendations.`
};

// Requirements gap analysis prompt
export const REQUIREMENTS_GAP_ANALYSIS_PROMPT: PromptTemplate = {
  id: 'requirements_gap_analysis',
  name: 'Requirements Gap Analyzer',
  description: 'Identifies missing skills and requirements in job postings compared to market needs',
  version: '1.0.0',
  variables: ['current_requirements', 'industry_trends', 'competitor_requirements', 'title', 'department'],
  template: `Analyze the current job requirements for gaps compared to industry standards and emerging needs.

Current Requirements:
{{current_requirements}}

Role Context:
- Title: {{title}}
- Department: {{department}}

Industry Trends:
{{industry_trends}}

Competitor Requirements:
{{competitor_requirements}}

Identify and analyze:

**1. Missing Critical Skills:**
- Essential technical skills not currently listed
- Important soft skills overlooked
- Industry-specific knowledge gaps
- Emerging technologies relevant to the role

**2. Competitive Disadvantages:**
- Where competitors are more attractive
- Skills they require that we don't mention
- Benefits or opportunities they highlight

**3. Future-Proofing Gaps:**
- Skills that will be important in 1-2 years
- Emerging technologies to consider
- Industry shifts to prepare for

**4. Recommendations:**
- Priority additions to requirements
- Skills to emphasize more strongly
- New preferred qualifications to add
- Long-term skill development needs

Provide specific recommendations with rationale for each suggestion.`
};

// Requirements inclusivity analysis
export const REQUIREMENTS_INCLUSIVITY_PROMPT: PromptTemplate = {
  id: 'requirements_inclusivity',
  name: 'Requirements Inclusivity Analyzer',
  description: 'Evaluates job requirements for inclusivity and suggests improvements to reduce bias',
  version: '1.0.0',
  variables: ['job_requirements', 'title', 'level', 'target_diversity_goals'],
  template: `Analyze job requirements for potential barriers to diverse candidates and suggest inclusive alternatives.

Current Requirements:
{{job_requirements}}

Role Details:
- Title: {{title}}
- Level: {{level}}

Diversity Goals:
{{target_diversity_goals}}

Evaluate for potential bias and barriers:

**1. Language Analysis:**
- Gender-coded language (masculine/feminine terms)
- Unnecessarily aggressive or competitive language
- Cultural assumptions or references
- Educational elitism or degree requirements

**2. Experience Barriers:**
- Years of experience requirements that may exclude career changers
- Industry-specific experience that could limit diversity
- Linear career path assumptions
- Overemphasis on "traditional" background

**3. Skill Assessment:**
- Skills that could be learned on the job vs. required upfront
- Alternative ways to demonstrate competency
- Portfolio/project-based alternatives to formal credentials
- Skills that may favor certain educational or economic backgrounds

**4. Inclusive Alternatives:**
- More inclusive language suggestions
- Alternative qualification pathways
- Skills-based vs. credential-based requirements
- Flexible experience considerations

**5. Recommended Changes:**
- Specific wording improvements
- Requirements to make optional or preferred
- New ways to attract underrepresented candidates
- Process improvements for inclusive hiring

Return specific, actionable recommendations for making requirements more inclusive while maintaining quality standards.`
};

// Candidate experience optimization prompt
export const CANDIDATE_EXPERIENCE_ANALYSIS_PROMPT: PromptTemplate = {
  id: 'candidate_experience_analysis',
  name: 'Candidate Experience Analyzer',
  description: 'Analyzes requirements from candidate perspective and suggests improvements',
  version: '1.0.0',
  variables: ['job_requirements', 'application_process', 'candidate_feedback', 'drop_off_points'],
  template: `Analyze the job requirements and application process from the candidate's perspective to identify improvement opportunities.

Job Requirements:
{{job_requirements}}

Application Process:
{{application_process}}

Candidate Feedback:
{{candidate_feedback}}

Drop-off Points:
{{drop_off_points}}

Analyze the candidate experience:

**1. Requirements Clarity:**
- Are requirements clear and specific?
- Do candidates understand what success looks like?
- Are expectations realistic and achievable?
- Is the growth potential clear?

**2. Application Friction:**
- Where do candidates get confused or discouraged?
- What requirements seem overwhelming or unclear?
- Are there too many "required" items?
- Is the application process user-friendly?

**3. Value Proposition:**
- Do requirements highlight what candidates will gain?
- Is the learning and growth opportunity clear?
- Are the most exciting aspects of the role emphasized?
- Does it appeal to candidates' career goals?

**4. Competitive Positioning:**
- How do we compare to other opportunities?
- What makes this role uniquely attractive?
- Are we highlighting our key differentiators?

**5. Improvement Recommendations:**
- Specific changes to improve candidate experience
- Requirements presentation improvements
- Application process optimizations
- Value proposition enhancements

Focus on practical changes that will improve both candidate experience and application quality.`
};

// Skills demand forecasting prompt
export const SKILLS_DEMAND_FORECAST_PROMPT: PromptTemplate = {
  id: 'skills_demand_forecast',
  name: 'Skills Demand Forecaster',
  description: 'Predicts future skill requirements and suggests forward-looking hiring criteria',
  version: '1.0.0',
  variables: ['current_requirements', 'industry', 'technology_trends', 'business_strategy', 'timeline'],
  template: `Analyze current requirements and predict future skill needs to inform hiring strategy.

Current Requirements:
{{current_requirements}}

Context:
- Industry: {{industry}}
- Business Strategy: {{business_strategy}}
- Timeline: {{timeline}}

Technology Trends:
{{technology_trends}}

Provide forward-looking analysis:

**1. Trend Analysis:**
- Which current skills will remain important?
- Which skills are becoming less relevant?
- What new skills are emerging in the industry?
- How are role expectations evolving?

**2. Future Skill Predictions:**
- Skills likely to be critical in 1-2 years
- Emerging technologies to prepare for
- Soft skills that will become more important
- Cross-functional capabilities gaining value

**3. Hiring Strategy Implications:**
- Should we hire for current or future skills?
- Which skills can be developed internally?
- What to prioritize in candidates now
- Training and development needs to consider

**4. Risk Assessment:**
- Skills shortages likely to emerge
- Competitive threats in talent acquisition
- Market wage pressure points
- Retention challenges to prepare for

**5. Actionable Recommendations:**
- Immediate changes to job requirements
- Medium-term hiring strategy adjustments
- Skills development priorities for current team
- Market positioning improvements

Focus on practical, implementable strategies that balance current needs with future preparation.`
};

// Export all requirements analysis templates
export const REQUIREMENTS_ANALYSIS_TEMPLATES = {
  OPTIMIZATION: REQUIREMENTS_OPTIMIZATION_PROMPT,
  GAP_ANALYSIS: REQUIREMENTS_GAP_ANALYSIS_PROMPT,
  INCLUSIVITY: REQUIREMENTS_INCLUSIVITY_PROMPT,
  CANDIDATE_EXPERIENCE: CANDIDATE_EXPERIENCE_ANALYSIS_PROMPT,
  SKILLS_FORECAST: SKILLS_DEMAND_FORECAST_PROMPT
} as const;

export default REQUIREMENTS_ANALYSIS_TEMPLATES;