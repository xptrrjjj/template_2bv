// Clean exports for AI provider system
export type {
  AIProvider,
  AIProviderInfo,
  AIProviderConfig,
  AIProviderFactory,
  AIProviderManager,
  ProviderError,
  ProviderSelectionStrategy,
  ProviderSelectionConfig
} from './base';

export {
  BaseAIProvider,
  isProviderError,
  shouldRetryWithProvider,
  shouldFailover
} from './base';

export {
  OpenAIProvider,
  createOpenAIProvider,
  getDefaultOpenAIConfig,
  validateOpenAIConfig
} from './openai';

export {
  GeminiProvider,
  createGeminiProvider,
  getDefaultGeminiConfig,
  validateGeminiConfig
} from './gemini';

export {
  AIProviderFactoryImpl,
  AIProviderManagerImpl,
  createAIProviderFactory,
  createAIProviderManager,
  createProvidersFromEnvironment,
  type SupportedProviderType
} from './factory';

// Default export for easy access
import { createAIProviderFactory, createAIProviderManager, createProvidersFromEnvironment } from './factory';
import { createOpenAIProvider } from './openai';
import { createGeminiProvider } from './gemini';

const aiProviders = {
  createAIProviderFactory,
  createAIProviderManager,
  createProvidersFromEnvironment,
  createOpenAIProvider,
  createGeminiProvider
};

export default aiProviders;