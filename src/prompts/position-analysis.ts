// Position analysis prompts for comprehensive market insights
// Supporting market rate analysis, talent availability, job descriptions, and role pitches

import { COMMON_VARIABLES, PROMPT_FRAGMENTS, RESPONSE_FORMATS, combineVariables } from './templates/base';

// Helper function to create cost analysis template without TypeScript interpolation issues
function createCostAnalysisTemplate(): string {
  const costData = [
    '## Cost Data',
    '- USA Market Rate: ${{usa_rate_min}} - ${{usa_rate_max}} annually',
    '- Philippines Market Rate: ₱{{ph_rate_min}} - ₱{{ph_rate_max}} monthly',
    '- Company Markup: {{markup_percentage}}%',
    '- Exchange Rate: $1 = ₱{{exchange_rate}}'
  ].join('\n');

  const template = [
    'You are a financial analyst specializing in global talent acquisition cost analysis. Calculate the cost savings for this position:',
    '',
    '## Position Details',
    PROMPT_FRAGMENTS.JOB_CONTEXT,
    '',
    costData,
    '',
    '## Special Instructions',
    '{{special_instructions}}',
    '',
    '## Analysis Requirements',
    '1. **Direct Cost Comparison**',
    '   - Annual cost comparison (USD)',
    '   - Monthly cost breakdown',
    '   - Markup calculations',
    '',
    '2. **Total Cost of Employment**',
    '   - Base salary costs',
    '   - Benefits and overhead',
    '   - Recruitment and onboarding',
    '   - Management and coordination',
    '',
    '3. **Savings Projections**',
    '   - Annual savings amount',
    '   - 3-year savings projection',
    '   - ROI calculations',
    '   - Break-even analysis',
    '',
    '4. **Risk Factors**',
    '   - Currency fluctuation impact',
    '   - Market rate changes',
    '   - Quality considerations',
    '',
    RESPONSE_FORMATS.JSON_OBJECT,
    '',
    '```json',
    '{',
    '  "annual_savings": {',
    '    "amount_usd": number,',
    '    "percentage": number,',
    '    "breakdown": {',
    '      "salary_savings": number,',
    '      "overhead_savings": number,',
    '      "total_savings": number',
    '    }',
    '  },',
    '  "three_year_projection": {',
    '    "total_savings": number,',
    '    "year_1": number,',
    '    "year_2": number,',
    '    "year_3": number',
    '  },',
    '  "cost_breakdown": {',
    '    "usa_annual_cost": number,',
    '    "ph_annual_cost_usd": number,',
    '    "company_rate_usd": number',
    '  },',
    '  "roi_metrics": {',
    '    "roi_percentage": number,',
    '    "payback_period_months": number,',
    '    "net_present_value": number',
    '  },',
    '  "risk_analysis": [',
    '    "Key risk factors and mitigation strategies"',
    '  ],',
    '  "assumptions": [',
    '    "Analysis assumptions and limitations"',
    '  ]',
    '}',
    '```',
    '',
    'Focus on accurate calculations and realistic projections.'
  ].join('\n');

  return template;
}

// Market rate analysis prompt templates
export const MARKET_RATE_ANALYSIS_TEMPLATES = {
  MARKET_RATES: {
    id: 'position-market-rates',
    name: 'Market Rate Analysis',
    description: 'Analyzes salary ranges for Philippines vs USA markets',
    version: '1.0.0',
    template: `You are a senior compensation analyst specializing in Philippines and USA tech markets. Analyze the market rates for the following position:

## Position Details
${PROMPT_FRAGMENTS.JOB_CONTEXT}

## Special Instructions
{{special_instructions}}

## Analysis Requirements
1. **Philippines Market Analysis**
   - Current salary ranges in PHP (2025 market)
   - Remote work premium considerations
   - Regional variations (Manila, Cebu, Davao, etc.)
   - Experience level adjustments
   - Industry-specific factors

2. **USA Market Analysis**
   - Current salary ranges in USD (2025 market)
   - Location-based variations (if applicable)
   - Remote work market rates
   - Experience level considerations
   - Industry benchmarks

3. **Currency & Cost Considerations**
   - Current USD to PHP exchange rate context
   - Cost of living adjustments
   - Purchasing power parity factors
   - Remote work market dynamics

## Response Format
${RESPONSE_FORMATS.JSON_OBJECT}

\`\`\`json
{
  "philippines": {
    "min": number,
    "max": number,
    "currency": "PHP",
    "monthly": true,
    "factors": [
      "Key factors affecting this range"
    ],
    "regional_variations": {
      "manila": { "min": number, "max": number },
      "cebu": { "min": number, "max": number },
      "davao": { "min": number, "max": number }
    }
  },
  "usa": {
    "min": number,
    "max": number,
    "currency": "USD",
    "monthly": false,
    "factors": [
      "Key factors affecting this range"
    ]
  },
  "confidence": "high|medium|low",
  "methodology": "Brief explanation of analysis approach",
  "market_insights": [
    "Key insights about current market conditions"
  ],
  "last_updated": "2025-01-13"
}
\`\`\`

Focus on accuracy and current market conditions. Consider remote work trends and post-pandemic market shifts.`,
    variables: combineVariables(COMMON_VARIABLES.JOB_EXTENDED, ['special_instructions'])
  }
};

// Talent availability assessment prompts
export const TALENT_AVAILABILITY_TEMPLATES = {
  TALENT_POOL: {
    id: 'talent-availability-analysis',
    name: 'Talent Availability Assessment',
    description: 'Analyzes talent pool availability and hiring difficulty',
    version: '1.0.0',
    template: `

You are a senior talent acquisition expert specializing in Philippines tech markets. Assess the talent availability for this position:

## Position Details
${PROMPT_FRAGMENTS.JOB_CONTEXT}

## Special Instructions
{{special_instructions}}

## Assessment Requirements
1. **Philippines Talent Pool Analysis**
   - Available talent pool size
   - Key talent hubs and concentrations
   - Educational institutions producing relevant talent
   - Skills availability and gaps
   - Competition from other companies

2. **Market Dynamics**
   - Current hiring difficulty (1-10 scale)
   - Seasonal patterns in availability
   - Remote work impact on talent access
   - Salary expectations vs market rates
   - Typical recruitment timelines

3. **Sourcing Insights**
   - Best sourcing channels
   - Professional communities and networks
   - Key skills to emphasize in job postings
   - Common deal-breakers for candidates
   - Competitive advantages to highlight

## Response Format
${RESPONSE_FORMATS.JSON_OBJECT}

\`\`\`json
{
  "score": number, // 1-10 scale (10 = abundant talent, 1 = very scarce)
  "availability": "abundant|moderate|limited|scarce",
  "insights": [
    "Detailed insights about talent availability",
    "Market conditions and trends",
    "Competitive landscape factors"
  ],
  "sources": [
    "Key talent sources and channels",
    "Educational institutions",
    "Professional communities"
  ],
  "challenges": [
    "Expected hiring challenges",
    "Common candidate concerns",
    "Market competition factors"
  ],
  "recommendations": [
    "Sourcing strategy recommendations",
    "Positioning suggestions",
    "Timeline expectations"
  ],
  "hiring_timeline": "Expected time to fill position",
  "confidence": "high|medium|low"
}
\`\`\`

Base your analysis on current Philippine tech market conditions and remote work trends.`,
    variables: combineVariables(COMMON_VARIABLES.JOB_EXTENDED, ['special_instructions'])
  }
};

// Professional job description generation
export const JOB_DESCRIPTION_TEMPLATES = {
  PROFESSIONAL_JD: {
    id: 'professional-job-description',
    name: 'Professional Job Description Generator',
    description: 'Creates compelling, professional job descriptions',
    version: '1.0.0',
    template: `

You are an expert technical writer and talent acquisition specialist. Create a compelling, professional job description for this position:

## Position Details
${PROMPT_FRAGMENTS.JOB_CONTEXT}

## Special Instructions
{{special_instructions}}

## Job Description Requirements
1. **Compelling Opening**
   - Hook that attracts top talent
   - Company value proposition
   - Role impact and growth opportunity

2. **Clear Structure**
   - Professional formatting
   - Easy-to-scan sections
   - Logical information flow

3. **Content Sections**
   - Role overview and impact
   - Key responsibilities
   - Required qualifications
   - Preferred qualifications
   - What we offer
   - Application process

4. **Philippine Market Considerations**
   - Remote work benefits emphasis
   - Career growth opportunities
   - Professional development
   - Work-life balance
   - Cultural fit considerations

## Response Format
Return a complete, ready-to-post job description in markdown format.

Focus on attracting high-quality candidates while being honest about requirements and expectations.`,
    variables: combineVariables(COMMON_VARIABLES.JOB_EXTENDED, ['special_instructions'])
  }
};

// Role pitch generation for stakeholders
export const ROLE_PITCH_TEMPLATES = {
  STAKEHOLDER_PITCH: {
    id: 'role-pitch-generation',
    name: 'Role Pitch Generator',
    description: 'Creates compelling pitches for internal stakeholders',
    version: '1.0.0',
    template: `

You are a strategic business consultant specializing in talent acquisition ROI. Create a compelling pitch for this role to internal stakeholders:

## Position Details
${PROMPT_FRAGMENTS.JOB_CONTEXT}

## Special Instructions
{{special_instructions}}

## Pitch Requirements
1. **Business Case**
   - Strategic importance of this role
   - Impact on business objectives
   - ROI and value creation potential

2. **Market Positioning**
   - Why Philippines talent is ideal
   - Competitive advantages
   - Cost-benefit analysis

3. **Risk Mitigation**
   - Addressing common concerns
   - Success factors and metrics
   - Implementation timeline

4. **Call to Action**
   - Clear next steps
   - Required resources and support
   - Success measurements

## Target Audience
- C-level executives
- Department heads
- Finance and operations leaders

## Response Format
Return a structured pitch document with executive summary, key points, and supporting data.

Focus on business value, strategic alignment, and measurable outcomes.`,
    variables: combineVariables(COMMON_VARIABLES.JOB_EXTENDED, ['special_instructions'])
  }
};

// Cost savings analysis
export const COST_ANALYSIS_TEMPLATES = {
  SAVINGS_ANALYSIS: {
    id: 'cost-savings-analysis',
    name: 'Cost Savings Analysis',
    description: 'Calculates and presents cost savings analysis',
    version: '1.0.0',
    template: createCostAnalysisTemplate(),
    variables: [
      ...combineVariables(COMMON_VARIABLES.JOB_EXTENDED, ['special_instructions']),
      'usa_rate_min', 'usa_rate_max', 'ph_rate_min', 'ph_rate_max', 
      'markup_percentage', 'exchange_rate'
    ]
  }
};

// All position analysis templates combined
export const POSITION_ANALYSIS_TEMPLATES = {
  ...MARKET_RATE_ANALYSIS_TEMPLATES,
  ...TALENT_AVAILABILITY_TEMPLATES,
  ...JOB_DESCRIPTION_TEMPLATES,
  ...ROLE_PITCH_TEMPLATES,
  ...COST_ANALYSIS_TEMPLATES
};

// Helper functions for building contextual prompts
export function buildPositionAnalysisPrompt(
  templateId: keyof typeof POSITION_ANALYSIS_TEMPLATES,
  context: Record<string, unknown>
): string {
  const template = POSITION_ANALYSIS_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Position analysis template not found: ${templateId}`);
  }
  
  let prompt = template.template;
  
  // Replace variables in the template
  Object.entries(context).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const replacement = String(value || '');
    prompt = prompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
  });
  
  return prompt;
}

export function getPositionAnalysisContext(
  jobData: any,
  specialInstructions?: string
): Record<string, unknown> {
  return {
    title: jobData.title,
    level: jobData.level,
    department: jobData.department,
    location: jobData.location,
    employment_type: jobData.employment_type,
    location_type: jobData.location_type,
    desired_minimum_years_experience: jobData.desired_minimum_years_experience,
    currency: jobData.currency,
    target_budget_usd: jobData.target_budget_usd,
    company_name: jobData.company_name,
    time_zone: jobData.time_zone,
    contract_duration: jobData.contract_duration,
    special_instructions: specialInstructions || 'No special instructions provided.'
  };
}

// Default export for easy access
export default POSITION_ANALYSIS_TEMPLATES;