/**
 * TestDome API Integration Service
 * Handles communication with TestDome API for test management
 */

export interface TestDomeApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TestDomeTestSummary {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  skills: string[];
  type: 'Programming' | 'Knowledge' | 'Multiple Choice';
  languages?: string[]; // for programming tests
}

export interface TestDomeInvitation {
  testId: string;
  candidateEmail: string;
  candidateName: string;
  invitationUrl: string;
  expirationDate: string;
}

class TestDomeService {
  private apiPassword: string;
  private userEmail: string;
  private baseUrl: string = 'https://api.testdome.com';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(apiPassword?: string, userEmail?: string) {
    this.apiPassword = apiPassword || process.env.NEXT_PUBLIC_TESTDOME_API_KEY || '';
    this.userEmail = userEmail || process.env.NEXT_PUBLIC_TESTDOME_ACCOUNT || '';
    
    if (!this.apiPassword || !this.userEmail) {
      console.warn('TestDome API credentials not provided. TestDome integration will not work.');
    }
  }

  /**
   * Authenticate with TestDome OAuth2 and get access token
   */
  private async authenticate(): Promise<TestDomeApiResponse<string>> {
    if (!this.apiPassword || !this.userEmail) {
      return { success: false, error: 'TestDome API credentials not configured' };
    }

    try {
      const body = new URLSearchParams({
        username: this.userEmail,
        password: this.apiPassword,
        grant_type: 'password'
      });

      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: `TestDome authentication failed: ${errorData.error_description || response.statusText}` 
        };
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Token expires in 30 minutes (1800 seconds), set expiry 5 minutes early for safety
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
      
      return { success: true, data: data.access_token };
    } catch (error) {
      return { 
        success: false, 
        error: `TestDome authentication request failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<TestDomeApiResponse<string>> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return { success: true, data: this.accessToken };
    }
    
    return await this.authenticate();
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<TestDomeApiResponse<T>> {
    const tokenResponse = await this.getAccessToken();
    if (!tokenResponse.success) {
      return { success: false, error: tokenResponse.error };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${tokenResponse.data}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        return { 
          success: false, 
          error: `TestDome API error: ${response.status} ${response.statusText}` 
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: `TestDome API request failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get all available tests from TestDome
   */
  async getAvailableTests(): Promise<TestDomeApiResponse<TestDomeTestSummary[]>> {
    const response = await this.makeRequest<any>('/v3/tests');
    
    if (response.success && response.data?.value) {
      return { success: true, data: response.data.value };
    }
    return response;
  }

  /**
   * Get detailed information about a specific test
   */
  async getTestDetails(testId: string): Promise<TestDomeApiResponse<TestDomeTestSummary>> {
    return this.makeRequest<TestDomeTestSummary>(`/v3/tests/${testId}`);
  }

  /**
   * Create an invitation for a candidate to take a test
   */
  async createInvitation(params: {
    testId: string;
    candidateEmail: string;
    candidateName: string;
    validDays?: number; // Default 7 days
  }): Promise<TestDomeApiResponse<TestDomeInvitation>> {
    return this.makeRequest<TestDomeInvitation>('/v3/invitations', {
      method: 'POST',
      body: JSON.stringify({
        testId: params.testId,
        candidate: {
          email: params.candidateEmail,
          name: params.candidateName,
        },
        validDays: params.validDays || 7,
      }),
    });
  }

  /**
   * Get test results for a specific invitation
   */
  async getTestResults(invitationId: string): Promise<TestDomeApiResponse<any>> {
    return this.makeRequest(`/v3/invitations/${invitationId}/results`);
  }

  /**
   * Search tests by skills or keywords
   */
  async searchTests(query: string, skills?: string[]): Promise<TestDomeApiResponse<TestDomeTestSummary[]>> {
    const params = new URLSearchParams({
      q: query,
      ...(skills && skills.length > 0 && { skills: skills.join(',') }),
    });
    
    const response = await this.makeRequest<any>(`/v3/tests/search?${params}`);
    if (response.success && response.data?.value) {
      return { success: true, data: response.data.value };
    }
    return response;
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    const response = await this.makeRequest('/v3/tests?$top=1');
    return response.success;
  }

}

export const testDomeService = new TestDomeService();