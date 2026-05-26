import type { ApiRequestData, IApiResponse } from './types';

declare global {
  interface Window {
    __userStore?: any;
    __isRedirecting?: boolean;
  }
}


/**
 * Base FetchFactory
 * Direct fetch with centralized token injection from Zustand.
 */
export class FetchFactory {
  protected async call<TResponse>(
    method: string,
    url: string,
    data?: ApiRequestData,
  ): Promise<TResponse> {
    const resolvedUrl = new URL(url, typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin);

    if (data?.urlHash) {
      Object.entries(data.urlHash).forEach(([key, value]) => {
        resolvedUrl.pathname = resolvedUrl.pathname.replace(`:${key}`, String(value));
      });
    }

    if (data?.query) {
      Object.entries(data.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          resolvedUrl.searchParams.set(key, String(value));
        }
      });
    }

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...data?.headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers: defaultHeaders,
    };

    if (data?.body && method !== 'GET') {
      fetchOptions.body =
        data.body instanceof FormData
          ? data.body
          : JSON.stringify(data.body);

      // Browser sets Content-Type for FormData automatically
      if (data.body instanceof FormData) {
        delete defaultHeaders['Content-Type'];
      }
    }

    try {
      const response = await fetch(`${resolvedUrl.pathname}${resolvedUrl.search}`, fetchOptions);

      // Handle raw JSON response
      let responseData: any;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        const errorMessage =
          responseData?.error?.message ||
          responseData?.message ||
          `Request failed with status ${response.status}`;

        // Global 401/403 Handling
        if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined' && !window.__isRedirecting) {
            window.__isRedirecting = true;
            const bypassPaths = ['/sign-in', '/sign-up'];
            const isBypassPath = bypassPaths.some(p => window.location.pathname.startsWith(p));

            if (!isBypassPath) {
              window.location.href = `/sign-in?redirectedFrom=${window.location.pathname}`;
            }

            setTimeout(() => { window.__isRedirecting = false; }, 1000);
        }

        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  }
}

export default FetchFactory;
