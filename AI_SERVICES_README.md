# AI Service Infrastructure Documentation

This document describes the comprehensive AI service infrastructure implemented for OpenAI integration in the recruitment application.

## 🏗️ Architecture Overview

The AI service infrastructure follows SOLID and DRY principles with a modular, dependency-injection based design:

```
src/services/ai/
├── types.ts                      # Type definitions and interfaces
├── openai-client.ts              # OpenAI client with error handling & rate limiting
├── prompts.ts                    # Centralized prompt management system
├── skill-suggestion-service.ts   # Main skill generation service
└── index.ts                      # Clean exports and factory functions
```

## 🚀 Quick Start

### 1. Environment Setup

Add your OpenAI API key to `.env.local`:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Basic Usage

```typescript
import { createAIServices } from '@/services/ai';

// Create AI service instances
const aiServices = createAIServices({
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000
});

// Generate comprehensive skills for a job role
const context = {
  title: 'Senior Software Engineer',
  level: 'senior',
  department: 'Engineering',
  employment_type: 'full-time',
  location: 'San Francisco',
  location_type: 'hybrid' as const,
  desired_minimum_years_experience: 5,
  currency: 'USD',
  target_budget_usd: 150000,
  company_name: 'TechCorp Inc.',
  time_zone: 'PST',
  contract_duration: 'rolling'
};

const result = await aiServices.skillSuggestionService.generateSkills(context);

if (result.success) {
  console.log('Requirements:', result.data.requirements);
  console.log('Preferred Qualifications:', result.data.preferred_qualifications);
  console.log('Responsibilities:', result.data.responsibilities);
}
```

### 3. Using the React Hook

```typescript
import { useAISkillsForJobRole } from '@/hooks/useAISkillGeneration';

function JobRoleForm() {
  const {
    generateFromBasicInfo,
    generatedSkills,
    isGenerating,
    generationError,
    acceptGeneratedSkills
  } = useAISkillsForJobRole();

  const handleGenerateSkills = async () => {
    const result = await generateFromBasicInfo(basicInfoData, companyName);
    // Skills are automatically stored in generatedSkills
  };

  const handleAcceptSkills = () => {
    const skills = acceptGeneratedSkills();
    // Use skills in your form
  };
}
```

## 📋 Core Components

### 1. OpenAI Client (`openai-client.ts`)

**Features:**
- ✅ Rate limiting and automatic retries with exponential backoff
- ✅ Comprehensive error handling with typed error codes
- ✅ Request/response metrics and health monitoring
- ✅ Environment variable integration
- ✅ Configurable timeouts and model parameters

**Key Methods:**
```typescript
// Generate AI completion
const response = await client.generateCompletion(prompt, options);

// Health check
const isHealthy = await client.isHealthy();

// Get performance metrics
const metrics = client.getMetrics();
```

### 2. Prompt Manager (`prompts.ts`)

**Features:**
- ✅ Template-based prompt system with variable substitution
- ✅ Built-in templates for requirements, qualifications, and responsibilities
- ✅ Template validation and variable checking
- ✅ Easy template customization and extension

**Key Methods:**
```typescript
// Compile a prompt with context
const compiled = promptManager.compilePrompt('job_requirements', context);

// Register custom templates
promptManager.registerTemplate(customTemplate);

// List available templates
const templates = promptManager.listTemplates();
```

### 3. Skill Suggestion Service (`skill-suggestion-service.ts`)

**Features:**
- ✅ Comprehensive skill generation (requirements + qualifications + responsibilities)
- ✅ Individual skill type generation
- ✅ Response parsing and validation
- ✅ Confidence scoring and quality assessment
- ✅ Duplicate filtering and count limiting

**Key Methods:**
```typescript
// Generate all skill types at once
const allSkills = await service.generateSkills(context);

// Generate specific skill type
const requirements = await service.generateByType({
  context,
  type: 'requirements',
  count: 8,
  existing: currentRequirements
});
```

## 🔧 Configuration Options

### OpenAI Client Configuration

```typescript
interface OpenAIClientConfig {
  apiKey: string;           // OpenAI API key
  model: string;            // Model to use (default: 'gpt-4o-mini')
  temperature: number;      // Response randomness (0-2, default: 0.7)
  maxTokens: number;        // Max response tokens (default: 2000)
  timeout: number;          // Request timeout in ms (default: 30000)
}
```

### Retry Configuration

```typescript
interface RetryConfig {
  max_attempts: number;      // Maximum retry attempts (default: 3)
  base_delay_ms: number;     // Base delay between retries (default: 1000ms)
  max_delay_ms: number;      // Maximum delay (default: 10000ms)
  backoff_multiplier: number; // Backoff multiplier (default: 2)
}
```

## 🎯 Skill Generation Context

The skill generation uses comprehensive job context:

```typescript
interface SkillSuggestionContext {
  title: string;                                    // Job title
  level: string;                                    // Seniority level
  department: string;                               // Department/team
  employment_type: string;                          // Employment type
  location: string;                                 // Job location
  location_type: 'remote' | 'hybrid' | 'on-site'; // Location type
  desired_minimum_years_experience: number;        // Min experience
  currency: string;                                 // Currency code
  target_budget_usd?: number;                       // Budget in USD
  company_name: string;                             // Company name
  time_zone?: string;                               // Time zone requirement
  contract_duration: string;                        // Contract duration
}
```

## 📊 Generated Skills Structure

```typescript
interface GeneratedSkills {
  requirements: string[];              // Essential skills/qualifications
  preferred_qualifications: string[];  // Nice-to-have qualifications
  responsibilities: string[];           // Key responsibilities
  metadata: {
    generated_at: string;              // Generation timestamp
    confidence_scores: Record<SuggestionType, number>; // Quality scores
    model_used: string;                // AI model used
  };
}
```

## 🚨 Error Handling

The system includes comprehensive error handling with typed error codes:

```typescript
// Error codes
export const AI_ERROR_CODES = {
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  API_KEY_INVALID: 'API_KEY_INVALID',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  INVALID_PROMPT: 'INVALID_PROMPT',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// Error response structure
interface AIServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: AIErrorCode;
    message: string;
    details?: unknown;
  };
}
```

## 📈 Monitoring & Metrics

### Service Metrics

```typescript
interface AIServiceMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time_ms: number;
  rate_limit_hits: number;
  last_request_time: number;
}
```

### Health Checks

```typescript
// Check individual service health
const isHealthy = await aiServices.skillSuggestionService.isHealthy();

// Check all services health
const healthStatus = await checkAIServicesHealth(aiServices);
console.log('Overall health:', healthStatus.overall);
```

## 🔌 API Integration

### REST API Endpoint

```typescript
// POST /api/ai/generate-skills
{
  "title": "Senior Software Engineer",
  "level": "senior",
  "department": "Engineering",
  "employment_type": "full-time",
  "location": "San Francisco",
  "location_type": "hybrid",
  "desired_minimum_years_experience": 5,
  "currency": "USD",
  "target_budget_usd": 150000,
  "company_name": "TechCorp Inc.",
  "contract_duration": "rolling"
}

// Response
{
  "success": true,
  "data": {
    "requirements": ["5+ years of software engineering experience", ...],
    "preferred_qualifications": ["Experience with microservices", ...],
    "responsibilities": ["Design and implement scalable systems", ...],
    "metadata": {
      "generated_at": "2024-01-15T10:30:00Z",
      "confidence_scores": { ... },
      "model_used": "gpt-4o-mini"
    }
  }
}

// GET /api/ai/generate-skills (Health check)
{
  "healthy": true,
  "environment": { ... },
  "ai_services": { ... }
}
```

## 🎨 Custom Prompt Templates

You can create custom prompt templates:

```typescript
const customTemplate: PromptTemplate = {
  id: 'custom_requirements',
  name: 'Custom Requirements Generator',
  description: 'Generates requirements with custom focus',
  version: '1.0.0',
  variables: ['title', 'level', 'department'],
  template: `
    Generate requirements for {{title}} at {{level}} level in {{department}}.
    Focus on specific technical skills and domain expertise.
    
    Return only a JSON array: ["requirement 1", "requirement 2", ...]
  `
};

promptManager.registerTemplate(customTemplate);
```

## 🔐 Security Considerations

- ✅ API keys are only accessible server-side
- ✅ Client-side components use API routes, never direct OpenAI calls
- ✅ Input validation on all API endpoints
- ✅ Rate limiting protection
- ✅ Error messages don't expose sensitive information

## 🧪 Testing

### Environment Validation

```typescript
import { validateAIEnvironment } from '@/services/ai';

const validation = validateAIEnvironment();
if (!validation.isValid) {
  console.error('AI Environment issues:', validation.errors);
}
```

### Service Health Monitoring

```typescript
import { checkAIServicesHealth } from '@/services/ai';

const health = await checkAIServicesHealth(aiServices);
console.log('Services healthy:', health.overall);
```

## 📝 Best Practices

1. **Always check health** before making requests in production
2. **Use the React hooks** for UI integration instead of direct service calls
3. **Handle errors gracefully** with user-friendly fallbacks
4. **Monitor metrics** to track usage and performance
5. **Validate context data** before generating skills
6. **Cache results** when appropriate to reduce API calls
7. **Use appropriate temperature settings** (0.7 for creative content, lower for factual)

## 🔧 Troubleshooting

### Common Issues

1. **"API key invalid"**
   - Check OPENAI_API_KEY in .env.local
   - Ensure the key starts with "sk-"
   - Verify the key has sufficient credits

2. **"Rate limit exceeded"**
   - The service automatically retries with backoff
   - Check your OpenAI usage dashboard
   - Consider upgrading your OpenAI plan

3. **"Request timeout"**
   - Increase timeout in configuration
   - Check network connectivity
   - Try with simpler prompts

4. **"Parsing error"**
   - The AI response format was invalid
   - Check prompt templates for clarity
   - Review recent API changes from OpenAI

### Debug Mode

Set `NODE_ENV=development` to enable debug logging:

```typescript
const aiServices = createAIServicesWithLogging(config, new ConsoleLogger());
```

This comprehensive AI service infrastructure provides a robust, scalable foundation for generating high-quality job requirements, qualifications, and responsibilities using OpenAI's language models.