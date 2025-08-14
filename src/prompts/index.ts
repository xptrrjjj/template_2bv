// Clean exports for all prompt management functionality
// Main entry point for the restructured prompt system

// Skills generation prompts (primary focus for current integration)
export {
  SKILL_GENERATION_TEMPLATES,
  REQUIREMENTS_PROMPT,
  PREFERRED_QUALIFICATIONS_PROMPT,
  RESPONSIBILITIES_PROMPT,
  COMPREHENSIVE_SKILLS_PROMPT,
  buildContextualSkillPrompt,
  getExperienceLevelContext,
  getDepartmentContext
} from './skills-generation';

// Position analysis prompts (comprehensive market insights)
export {
  POSITION_ANALYSIS_TEMPLATES,
  MARKET_RATE_ANALYSIS_TEMPLATES,
  TALENT_AVAILABILITY_TEMPLATES,
  JOB_DESCRIPTION_TEMPLATES as POSITION_JOB_DESCRIPTION_TEMPLATES,
  ROLE_PITCH_TEMPLATES,
  COST_ANALYSIS_TEMPLATES,
  buildPositionAnalysisPrompt,
  getPositionAnalysisContext
} from './position-analysis';

// Future expansion prompts (for reference)
export { JOB_DESCRIPTION_TEMPLATES } from './job-description';
export { REQUIREMENTS_ANALYSIS_TEMPLATES } from './requirements-analysis';

// Base template utilities
export {
  buildPromptTemplate,
  validateTemplateVariables,
  combineVariables,
  createSkillsTemplate,
  COMMON_VARIABLES,
  PROMPT_FRAGMENTS,
  RESPONSE_FORMATS
} from './templates/base';

// Default export for easy access to all templates
import { SKILL_GENERATION_TEMPLATES } from './skills-generation';
import { JOB_DESCRIPTION_TEMPLATES } from './job-description';
import { REQUIREMENTS_ANALYSIS_TEMPLATES } from './requirements-analysis';
import { POSITION_ANALYSIS_TEMPLATES } from './position-analysis';

const allPrompts = {
  SKILL_GENERATION_TEMPLATES,
  JOB_DESCRIPTION_TEMPLATES,
  REQUIREMENTS_ANALYSIS_TEMPLATES,
  POSITION_ANALYSIS_TEMPLATES
};

export default allPrompts;