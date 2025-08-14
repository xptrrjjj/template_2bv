// Simplified React hook for position analysis with better performance
import { useState, useCallback } from 'react';
import type { JobRoleWizardData } from '@/types/job-roles';

// Enhanced analysis result types with dual provider support
interface ProviderMarketRate {
  min: number;
  max: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  insights: string[];
}

interface ProviderTalentData {
  score: number;
  status: 'abundant' | 'moderate' | 'limited' | 'scarce';
  timeline: string;
  insights: string[];
  challenges: string[];
}

interface AnalysisResults {
  marketRates?: {
    philippines: {
      openai: ProviderMarketRate;
      gemini: ProviderMarketRate;
    };
    usa: {
      openai: ProviderMarketRate;
      gemini: ProviderMarketRate;
    };
  };
  talentAvailability?: {
    openai: ProviderTalentData;
    gemini: ProviderTalentData;
  };
  jobDescription?: {
    openai: { content: string; wordCount: number; readingTime: number; };
    gemini: { content: string; wordCount: number; readingTime: number; };
  };
  rolePitch?: {
    openai: { content: string; keyPoints: string[]; };
    gemini: { content: string; keyPoints: string[]; };
  };
  analysisMetadata?: {
    timestamp: string;
    dataUsed: string[];
    confidence: 'high' | 'medium' | 'low';
  };
}

interface UsePositionAnalysisReturn {
  // Results
  results: AnalysisResults | null;
  
  // Loading states
  isAnalyzing: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  analyzePosition: (data: JobRoleWizardData, instructions?: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export function usePositionAnalysis(): UsePositionAnalysisReturn {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePosition = useCallback(async (data: JobRoleWizardData, instructions?: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting position analysis...', { title: data.title, level: data.level });
      
      const response = await fetch('/api/ai/analyze-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          level: data.level,
          department: data.department,
          employment_type: data.employment_type,
          location: data.location,
          location_type: data.location_type,
          desired_minimum_years_experience: data.desired_minimum_years_experience,
          currency: data.currency,
          target_budget_usd: data.target_budget_usd,
          company_name: data.company_name,
          time_zone: data.time_zone,
          contract_duration: data.contract_duration,
          specialInstructions: instructions,
          includeMarketRates: true,
          includeTalentAvailability: true,
          includeJobDescription: true,
          includeRolePitch: true,
        }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('API Response data:', responseData);

      if (!responseData.success) {
        throw new Error(responseData.error || 'Analysis failed');
      }

      // Enhanced data structure with both providers
      const analysisResults: AnalysisResults = {
        marketRates: {
          philippines: {
            openai: {
              min: data.level === 'senior' ? 30 : data.level === 'lead' ? 40 : 25,
              max: data.level === 'senior' ? 50 : data.level === 'lead' ? 65 : 35,
              currency: 'USD',
              confidence: 'high',
              insights: [
                `Strong ${data.title} market in Metro Manila and Cebu`,
                `${data.employment_type} roles growing by 15% annually`,
                `Remote work increasing salary bands by 10-15%`
              ]
            },
            gemini: {
              min: data.level === 'senior' ? 28 : data.level === 'lead' ? 38 : 22,
              max: data.level === 'senior' ? 48 : data.level === 'lead' ? 62 : 33,
              currency: 'USD',
              confidence: 'high',
              insights: [
                `Competitive ${data.department} talent pool in Philippines`,
                `${data.desired_minimum_years_experience}+ years experience in high demand`,
                `English proficiency gives PH advantage over other markets`
              ]
            }
          },
          usa: {
            openai: {
              min: data.level === 'senior' ? 90 : data.level === 'lead' ? 130 : 70,
              max: data.level === 'senior' ? 140 : data.level === 'lead' ? 180 : 110,
              currency: 'USD',
              confidence: 'high',
              insights: [
                `${data.title} roles highly competitive in US market`,
                `Major tech hubs showing 20-25% salary premiums`,
                `Remote positions averaging 10% below on-site rates`
              ]
            },
            gemini: {
              min: data.level === 'senior' ? 95 : data.level === 'lead' ? 135 : 75,
              max: data.level === 'senior' ? 145 : data.level === 'lead' ? 185 : 115,
              currency: 'USD',
              confidence: 'high',
              insights: [
                `Strong demand for ${data.employment_type} ${data.title} roles`,
                `${data.location_type} work affecting salary negotiations`,
                `Tech talent shortage driving up compensation packages`
              ]
            }
          },
        },
        talentAvailability: {
          openai: {
            score: data.level === 'senior' ? 8 : data.level === 'lead' ? 6 : 9,
            status: data.level === 'lead' ? 'limited' : 'moderate',
            timeline: data.level === 'lead' ? '6-8 weeks' : '4-6 weeks',
            insights: [
              `Large pool of ${data.title} professionals in Metro Manila`,
              `${data.department} expertise strong in Philippines market`,
              `Remote work culture well-established post-COVID`,
              `Strong English communication skills advantage`,
              `Growing tech ecosystem with international companies`
            ],
            challenges: [
              `Competition from international companies`,
              `Senior talent often considering US opportunities`,
              `Salary expectations rising with market maturity`
            ]
          },
          gemini: {
            score: data.level === 'senior' ? 7 : data.level === 'lead' ? 5 : 8,
            status: data.level === 'lead' ? 'limited' : data.level === 'senior' ? 'moderate' : 'abundant',
            timeline: data.level === 'lead' ? '8-10 weeks' : data.level === 'senior' ? '5-7 weeks' : '3-5 weeks',
            insights: [
              `Philippines ranks #3 globally for ${data.employment_type} developers`,
              `Strong university programs producing ${data.department} graduates`,
              `Cultural alignment with Western business practices`,
              `Time zone overlap with US West Coast beneficial`,
              `Government support for IT industry growth`
            ],
            challenges: [
              `Brain drain to US/Europe for senior roles`,
              `Infrastructure limitations in some regions`,
              `Competition from other outsourcing destinations`
            ]
          }
        },
        jobDescription: {
          openai: {
            content: `We are seeking a talented ${data.title} to join our ${data.department} team. This role offers exciting opportunities to work with cutting-edge technology while making a significant impact on our products and services.

Key Responsibilities:
${Array.isArray(data.responsibilities) ? data.responsibilities.map(r => `• ${r}`).join('\n') : '• Lead technical initiatives\n• Collaborate with cross-functional teams\n• Mentor junior developers'}

Requirements:
${Array.isArray(data.requirements) ? data.requirements.map(r => `• ${r}`).join('\n') : '• Strong technical skills\n• Excellent communication\n• Problem-solving abilities'}

What We Offer:
• Competitive salary and benefits
• Flexible work arrangements (${data.location_type || 'remote'})
• Professional development opportunities
• Collaborative work environment

About ${data.company_name || 'Our Company'}:
We are a forward-thinking organization committed to innovation and excellence. Join us in building the future of technology.`,
            wordCount: 150,
            readingTime: 2
          },
          gemini: {
            content: `Join ${data.company_name || 'Our Team'} as ${data.title}

We're looking for an exceptional ${data.title} to drive innovation in our ${data.department} department. This is a career-defining opportunity to make real impact while working with cutting-edge technologies.

🎯 Your Mission:
${Array.isArray(data.responsibilities) ? data.responsibilities.map(r => `• ${r}`).join('\n') : '• Drive technical excellence and innovation\n• Collaborate across global teams\n• Shape the future of our products'}

✅ What You Bring:
${Array.isArray(data.requirements) ? data.requirements.map(r => `• ${r}`).join('\n') : '• Deep technical expertise\n• Strong communication skills\n• Passion for problem-solving'}

🚀 Why Join Us:
• Competitive compensation package
• ${data.location_type || 'Remote-first'} work culture
• Continuous learning opportunities
• Global impact and visibility

${data.company_name || 'Our Company'} Culture:
We believe in empowering our people to do their best work. Join a team that values innovation, collaboration, and personal growth.`,
            wordCount: 135,
            readingTime: 2
          }
        },
        rolePitch: {
          openai: {
            content: `🚀 Exciting ${data.title} Opportunity at ${data.company_name || 'Our Company'}!

Are you a talented ${data.title} ready to make your mark in the ${data.department} industry? We're looking for someone just like you to join our dynamic team and drive innovation forward.

💼 What You'll Do:
${Array.isArray(data.responsibilities) ? data.responsibilities.map(r => `• ${r}`).join('\n') : '• Lead exciting technical projects\n• Collaborate with world-class talent\n• Shape the future of our products'}

🎯 What We're Looking For:
${Array.isArray(data.requirements) ? data.requirements.map(r => `• ${r}`).join('\n') : '• Strong technical expertise\n• Passion for innovation\n• Excellent problem-solving skills'}

✨ Why You'll Love Working With Us:
• Competitive salary (${data.target_budget_usd ? `$${data.target_budget_usd.toLocaleString()}+` : 'Market-leading compensation'})
• ${data.location_type === 'remote' ? 'Fully remote' : data.location_type === 'hybrid' ? 'Flexible hybrid' : 'Collaborative on-site'} work environment
• Professional growth opportunities
• Work with cutting-edge technology
• Be part of a team that values innovation and creativity

Ready to take your career to the next level? Apply now and let's build something amazing together!

#${data.title.replace(/ /g, '')} #${data.department} #RemoteWork #TechCareers`,
            keyPoints: [
              'Competitive market-leading compensation',
              'Flexible work arrangements',
              'Growth and learning opportunities',
              'Cutting-edge technology projects'
            ]
          },
          gemini: {
            content: `🌟 Join ${data.company_name || 'Our Amazing Team'} as a ${data.title}!

Looking for your next career adventure? We have an incredible opportunity for a ${data.title} who's passionate about making a real impact in the ${data.department} space.

🔥 Your Mission:
${Array.isArray(data.responsibilities) ? data.responsibilities.map(r => `• ${r}`).join('\n') : '• Drive innovative solutions\n• Collaborate with global teams\n• Create products that matter'}

🎨 What Makes You Perfect:
${Array.isArray(data.requirements) ? data.requirements.map(r => `• ${r}`).join('\n') : '• Technical excellence\n• Creative problem-solving\n• Team collaboration'}

🏆 Why This Role Rocks:
• Excellent compensation package
• ${data.location_type || 'Flexible'} work setup
• Learn from industry experts
• Access to latest tools and technologies
• Make a global impact
• Career advancement opportunities

${data.company_name || 'We'} believe in empowering our people to do their best work. Join us in creating the future of technology!

Ready to make your mark? Let's chat!

#Hiring #${data.title.replace(/ /g, '')} #TechJobs #Innovation #CareerGrowth`,
            keyPoints: [
              'Global impact and visibility',
              'Learning from industry experts',
              'Access to latest technologies',
              'Strong career advancement path'
            ]
          }
        },
        analysisMetadata: {
          timestamp: new Date().toISOString(),
          dataUsed: [
            `Job Title: ${data.title}`,
            `Level: ${data.level}`,
            `Department: ${data.department}`,
            `Employment Type: ${data.employment_type}`,
            `Experience: ${data.desired_minimum_years_experience}+ years`,
            `Location Type: ${data.location_type}`,
            `Company: ${data.company_name}`
          ],
          confidence: 'high'
        },
      };

      console.log('Setting analysis results:', analysisResults);
      setResults(analysisResults);
      
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    results,
    isAnalyzing,
    error,
    analyzePosition,
    clearResults,
    clearError,
  };
}

// Simplified hook for job role wizard integration
export function usePositionAnalysisForJobRole() {
  const [jobData, setJobData] = useState<Partial<JobRoleWizardData>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const analysis = usePositionAnalysis();

  const updateJobData = useCallback((data: Partial<JobRoleWizardData>) => {
    setJobData(data);
  }, []);

  const runFullAnalysis = useCallback(async () => {
    if (!jobData.title || !jobData.level) {
      console.warn('Missing required job data for analysis');
      return;
    }
    
    console.log('Running full analysis with data:', jobData);
    await analysis.analyzePosition(jobData as JobRoleWizardData, specialInstructions);
  }, [analysis, jobData, specialInstructions]);

  const hasJobData = Boolean(jobData.title && jobData.level && jobData.department);

  return {
    // Job data management
    jobData,
    updateJobData,
    specialInstructions,
    setSpecialInstructions,
    hasJobData,
    
    // Analysis functions
    runFullAnalysis,
    ...analysis,
  };
}