/**
 * Centralized Authentication Interceptor
 * Handles 401 errors globally and manages token cleanup/redirects
 */

interface AuthInterceptorConfig {
  onUnauthorized?: () => void;
  redirectUrl?: string;
}

class AuthInterceptor {
  private static instance: AuthInterceptor;
  private config: AuthInterceptorConfig;
  private originalFetch: typeof fetch;

  private constructor() {
    this.config = {
      redirectUrl: '/login',
    };
    
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.originalFetch = window.fetch;
      this.setupInterceptor();
    } else {
      // Fallback for server-side
      this.originalFetch = global.fetch || fetch;
    }
  }

  static getInstance(): AuthInterceptor {
    if (!AuthInterceptor.instance) {
      AuthInterceptor.instance = new AuthInterceptor();
    }
    return AuthInterceptor.instance;
  }

  /**
   * Configure the interceptor
   */
  configure(config: AuthInterceptorConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Setup the global fetch interceptor
   */
  private setupInterceptor(): void {
    if (typeof window === 'undefined') return;

    const originalFetch = this.originalFetch.bind(window);
    const handleUnauthorized = this.handleUnauthorized.bind(this);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await originalFetch(input, init);

      // Check for 401 Unauthorized
      if (response.status === 401) {
        handleUnauthorized();
      }

      return response;
    };
  }

  /**
   * Handle unauthorized access
   */
  private handleUnauthorized(): void {
    console.log('🔒 Authentication expired - cleaning up and redirecting...');
    
    // Clear all authentication data
    this.clearAuthData();
    
    // Call custom handler if provided
    if (this.config.onUnauthorized) {
      this.config.onUnauthorized();
    }
    
    // Redirect to login
    if (this.config.redirectUrl) {
      window.location.href = this.config.redirectUrl;
    }
  }

  /**
   * Clear all authentication-related data
   */
  private clearAuthData(): void {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    });
  }

  /**
   * Manually trigger logout (for use in logout buttons, etc.)
   */
  logout(): void {
    this.handleUnauthorized();
  }

  /**
   * Check if a response is unauthorized
   */
  isUnauthorized(response: Response): boolean {
    return response.status === 401;
  }

  /**
   * Restore original fetch (for cleanup)
   */
  restore(): void {
    if (typeof window !== 'undefined') {
      window.fetch = this.originalFetch;
    }
  }
}

// Export singleton instance
export const authInterceptor = AuthInterceptor.getInstance();

// Export class for testing
export { AuthInterceptor };