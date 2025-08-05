/**
 * Centralized pagination handler for TeamTailor API
 * Implements cursor-based pagination following links.next
 */

import { TeamTailorClient, RequestOptions } from './client';
import { 
  TeamTailorPaginatedResponse, 
  PaginationConfig, 
  PaginationOptions 
} from './types';
import { PaginationError } from './errors';

export class TeamTailorPaginator<T> {
  private client: TeamTailorClient;
  private config: Required<PaginationConfig>;
  private visitedUrls: Set<string> = new Set();
  
  constructor(
    client: TeamTailorClient,
    config?: PaginationConfig
  ) {
    this.client = client;
    this.config = {
      maxPages: config?.maxPages ?? 1000,
      delayBetweenRequests: config?.delayBetweenRequests ?? 200,
      retryFailedPages: config?.retryFailedPages ?? true,
      maxRetries: config?.maxRetries ?? 3,
      pageSize: config?.pageSize ?? 30,
      onPageFetched: config?.onPageFetched ?? (() => {}),
    };
  }
  
  /**
   * Fetch all pages from a paginated endpoint
   */
  async getAllPages(
    endpoint: string,
    options?: PaginationOptions
  ): Promise<T[]> {
    this.visitedUrls.clear();
    const allData: T[] = [];
    let currentPage = 1;
    let totalPages: number | null = null;
    
    // Build initial request options with page size
    const requestOptions: RequestOptions = {
      ...options,
      params: {
        ...options?.filter,
        page: { size: this.config.pageSize },
        ...(options?.include && { include: options.include }),
        ...(options?.sort && { sort: options.sort }),
      },
    };
    
    // Start with the initial endpoint
    let nextUrl: string | null = this.client.buildUrl(endpoint, requestOptions.params);
    
    while (nextUrl && currentPage <= this.config.maxPages) {
      // Check for circular references
      if (this.visitedUrls.has(nextUrl)) {
        throw new PaginationError(
          'Circular reference detected in pagination',
          {
            currentPage,
            totalPages: totalPages ?? undefined,
            recordCount: allData.length,
            error: `URL already visited: ${nextUrl}`,
          },
          endpoint
        );
      }
      
      this.visitedUrls.add(nextUrl);
      
      try {
        // Fetch the page
        const pageData = await this.getPage(nextUrl);
        
        // Extract data
        if (pageData.data && Array.isArray(pageData.data)) {
          allData.push(...pageData.data);
        }
        
        // Update total pages from first response
        if (totalPages === null && pageData.meta?.['page-count']) {
          totalPages = pageData.meta['page-count'];
        }
        
        // Call progress callback
        this.config.onPageFetched(pageData, currentPage, totalPages ?? 0);
        
        // Get next page URL
        nextUrl = pageData.links?.next || null;
        currentPage++;
        
        // Add delay between requests to avoid hitting rate limits
        if (nextUrl && this.config.delayBetweenRequests > 0) {
          await this.delay(this.config.delayBetweenRequests);
        }
        
      } catch (error) {
        if (this.config.retryFailedPages) {
          // Retry logic is handled by the client
          throw error;
        } else {
          throw new PaginationError(
            `Failed to fetch page ${currentPage}`,
            {
              currentPage,
              totalPages: totalPages ?? undefined,
              recordCount: allData.length,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            endpoint
          );
        }
      }
    }
    
    // Validate final record count if available
    if (totalPages !== null) {
      const firstPageData = await this.getPage(
        this.client.buildUrl(endpoint, { ...requestOptions.params, page: { size: 1 } })
      );
      const expectedCount = firstPageData.meta?.['record-count'];
      
      if (expectedCount !== undefined && allData.length !== expectedCount) {
        console.warn(
          `Pagination warning: Expected ${expectedCount} records but got ${allData.length}`
        );
      }
    }
    
    return allData;
  }
  
  /**
   * Fetch a single page by URL
   */
  async getPage(url: string): Promise<TeamTailorPaginatedResponse<T>> {
    // Extract the path from the full URL
    const urlObj = new URL(url);
    const endpoint = urlObj.pathname;
    
    // Convert URL params back to object format
    const params: Record<string, any> = {};
    urlObj.searchParams.forEach((value, key) => {
      // Handle nested params like page[size]
      const matches = key.match(/^(.+)\[(.+)\]$/);
      if (matches) {
        const [, parent, child] = matches;
        if (!params[parent]) {
          params[parent] = {};
        }
        params[parent][child] = value;
      } else {
        params[key] = value;
      }
    });
    
    // Make the request
    const response = await this.client.get<TeamTailorPaginatedResponse<T>>(
      endpoint,
      { params }
    );
    
    // Validate pagination response structure
    this.validatePaginationResponse(response);
    
    return response;
  }
  
  /**
   * Validate that the response has the expected pagination structure
   */
  private validatePaginationResponse(response: TeamTailorPaginatedResponse<T>): void {
    if (!response || typeof response !== 'object') {
      throw new PaginationError('Invalid pagination response: not an object');
    }
    
    if (!Array.isArray(response.data)) {
      throw new PaginationError('Invalid pagination response: data is not an array');
    }
    
    if (!response.meta || typeof response.meta !== 'object') {
      throw new PaginationError('Invalid pagination response: meta is missing or invalid');
    }
    
    if (!response.links || typeof response.links !== 'object') {
      throw new PaginationError('Invalid pagination response: links is missing or invalid');
    }
  }
  
  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Reset the paginator state
   */
  reset(): void {
    this.visitedUrls.clear();
  }
}

/**
 * Create a paginator instance for a specific resource type
 */
export function createPaginator<T>(
  client: TeamTailorClient,
  config?: PaginationConfig
): TeamTailorPaginator<T> {
  return new TeamTailorPaginator<T>(client, config);
}

/**
 * Helper function to fetch all pages from an endpoint
 * This is used by the client's getAllPaginated method
 */
export async function fetchAllPages<T>(
  client: TeamTailorClient,
  endpoint: string,
  options?: PaginationOptions & { paginationConfig?: PaginationConfig }
): Promise<T[]> {
  const { paginationConfig, ...requestOptions } = options || {};
  const paginator = createPaginator<T>(client, paginationConfig);
  return paginator.getAllPages(endpoint, requestOptions);
}