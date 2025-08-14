// React hook for AI-powered skill generation
import { useState, useCallback } from 'react';
import type { GeneratedSkills } from '@/services/ai';

interface UseAISkillGenerationOptions {
  onSuccess?: (skills: GeneratedSkills) => void;
  onError?: (error: string) => void;
}

interface SkillGenerationRequest {
  title: string;
  level: string;
  department: string;
  employment_type: string;
  location: string;
  location_type: 'remote' | 'hybrid' | 'on-site';
  desired_minimum_years_experience: number;
  currency: string;
  target_budget_usd?: number;
  company_name: string;
  time_zone?: string;
  contract_duration: string;
}

interface SkillGenerationResponse {
  success: boolean;
  data?: GeneratedSkills;
  metadata?: {
    timestamp: string;
    service_metrics: Record<string, unknown>;
  };
  error?: string;
  details?: string;
}

interface AIServiceHealthResponse {
  healthy: boolean;
  environment: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  ai_services: {
    available: boolean;
    healthy?: boolean;
    metrics?: Record<string, unknown>;
  };
  error?: string;
}

export function useAISkillGeneration(options: UseAISkillGenerationOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<GeneratedSkills | null>(null);

  const generateSkills = useCallback(async (request: SkillGenerationRequest): Promise<GeneratedSkills | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SkillGenerationResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || data.details || 'Failed to generate skills');
      }

      setLastGenerated(data.data);
      options.onSuccess?.(data.data);

      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const checkHealth = useCallback(async (): Promise<AIServiceHealthResponse | null> => {
    try {
      const response = await fetch('/api/ai/generate-skills', {
        method: 'GET'
      });

      return await response.json();
    } catch (err) {
      console.error('Failed to check AI service health:', err);
      return null;
    }
  }, []);

  const resetState = useCallback(() => {
    setError(null);
    setLastGenerated(null);
  }, []);

  return {
    generateSkills,
    checkHealth,
    resetState,
    loading,
    error,
    lastGenerated,
    isIdle: !loading && !error && !lastGenerated
  };
}

// Hook for form integration with job role wizard
export function useAISkillsForJobRole() {
  const [generatedSkills, setGeneratedSkills] = useState<GeneratedSkills | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { generateSkills, loading, error } = useAISkillGeneration({
    onSuccess: (skills) => {
      setGeneratedSkills(skills);
      setGenerationError(null);
    },
    onError: (errorMessage) => {
      setGenerationError(errorMessage);
      setGeneratedSkills(null);
    }
  });

  const generateFromBasicInfo = useCallback(async (
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
  ) => {
    setIsGenerating(true);
    
    try {
      const result = await generateSkills({
        ...basicInfo,
        company_name: companyName
      });

      return result;
    } finally {
      setIsGenerating(false);
    }
  }, [generateSkills]);

  const acceptGeneratedSkills = useCallback(() => {
    if (!generatedSkills) return null;

    return {
      requirements: [...generatedSkills.requirements],
      preferred_qualifications: [...generatedSkills.preferred_qualifications],
      responsibilities: [...generatedSkills.responsibilities]
    };
  }, [generatedSkills]);

  const clearGenerated = useCallback(() => {
    setGeneratedSkills(null);
    setGenerationError(null);
  }, []);

  return {
    generatedSkills,
    isGenerating: isGenerating || loading,
    generationError: generationError || error,
    generateFromBasicInfo,
    acceptGeneratedSkills,
    clearGenerated,
    hasGenerated: Boolean(generatedSkills)
  };
}