/**
 * API client for communicating with the backend FastAPI server
 */

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');

/**
 * Get stored auth token
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Set auth token
 */
function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Generic fetch wrapper with error handling and auth token
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API Error (${response.status})`;
      
      try {
        // Read response as text first
        const errorText = await response.text();
        
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(errorText);
          // Extract the detail field from FastAPI error responses
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = errorText;
          }
        } catch {
          // If not JSON, use the text as-is (if available)
          errorMessage = errorText || errorMessage;
        }
      } catch {
        // If reading fails, use status-based message
        if (response.status === 401) {
          errorMessage = 'Incorrect username or password';
        } else if (response.status === 400) {
          errorMessage = 'Invalid request';
        } else if (response.status === 500) {
          errorMessage = 'Server error';
        }
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

/**
 * Venue API
 */
export const venueApi = {
  /**
   * Get venue data including all zones
   */
  async getVenue() {
    return fetchApi('/venue');
  },
};

/**
 * Access Points API
 */
export const accessPointsApi = {
  /**
   * Get access points for a specific zone
   */
  async getAccessPoints(
    zoneId: string,
    params?: {
      limit?: number;
      offset?: number;
      sort?:
        | 'clients'
        | 'name'
        | 'channelUtilization'
        | 'airtimeUtilization'
        | 'cpuUtilization'
        | 'memoryUtilization';
    }
  ) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.sort) queryParams.set('sort', params.sort);

    const queryString = queryParams.toString();
    return fetchApi(
      `/zones/${zoneId}/aps${queryString ? `?${queryString}` : ''}`
    );
  },
};

/**
 * Clients API
 */
export const clientsApi = {
  /**
   * Get clients with optional filtering
   */
  async getClients(params?: {
    zoneId?: string;
    apId?: string;
    limit?: number;
    offset?: number;
    sort?: 'dataUsage' | 'hostname' | 'timestamp';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.zoneId) queryParams.set('zoneId', params.zoneId);
    if (params?.apId) queryParams.set('apId', params.apId);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.sort) queryParams.set('sort', params.sort);
    
    const queryString = queryParams.toString();
    return fetchApi(`/clients${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * Anomalies API
 */
export const anomaliesApi = {
  /**
   * Get anomalies with optional filtering
   */
  async getAnomalies(params?: {
    severity?: 'critical' | 'major' | 'warning' | 'info';
    zoneId?: string;
    limit?: number;
    sort?: 'timestamp' | 'severity';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.severity) queryParams.set('severity', params.severity);
    if (params?.zoneId) queryParams.set('zoneId', params.zoneId);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.sort) queryParams.set('sort', params.sort);
    
    const queryString = queryParams.toString();
    return fetchApi(`/anomalies${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * Cause Codes API
 */
export const causeCodesApi = {
  /**
   * Get disconnect cause codes
   */
  async getCauseCodes(params?: {
    limit?: number;
    sort?: 'count' | 'impactScore';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.sort) queryParams.set('sort', params.sort);
    
    const queryString = queryParams.toString();
    return fetchApi(`/cause-codes${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * Host Usage API
 */
export const hostsApi = {
  /**
   * Get top hosts by data usage
   */
  async getHosts(params?: {
    limit?: number;
    sort?: 'desc' | 'asc';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.sort) queryParams.set('sort', params.sort);
    
    const queryString = queryParams.toString();
    return fetchApi(`/hosts${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * OS Distribution API
 */
export const osDistributionApi = {
  /**
   * Get OS distribution statistics
   */
  async getOSDistribution() {
    return fetchApi('/os-distribution');
  },
};

/**
 * Load/Band Utilization API
 */
export const loadApi = {
  /**
   * Get band load data
   */
  async getLoad(params?: {
    hours?: number;
    zoneId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.hours) queryParams.set('hours', params.hours.toString());
    if (params?.zoneId) queryParams.set('zoneId', params.zoneId);
    
    const queryString = queryParams.toString();
    return fetchApi(`/load${queryString ? `?${queryString}` : ''}`);
  },
};

/**
 * Time Series API
 */
export const timeSeriesApi = {
  /**
   * Get time series data for metrics
   */
  async getTimeSeries(params: {
    metric: 'experienceScore' | 'utilization' | 'netflixScore';
    zoneIds?: string;
    startTime?: string;
    endTime?: string;
    interval?: number;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.set('metric', params.metric);
    if (params.zoneIds) queryParams.set('zoneIds', params.zoneIds);
    if (params.startTime) queryParams.set('startTime', params.startTime);
    if (params.endTime) queryParams.set('endTime', params.endTime);
    if (params.interval) queryParams.set('interval', params.interval.toString());
    
    return fetchApi(`/time-series?${queryParams.toString()}`);
  },
};

/**
 * Health check API
 */
export const healthApi = {
  /**
   * Check API health
   */
  async getHealth() {
    return fetchApi('/health');
  },
};

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(username: string, password: string) {
    return fetchApi<{ id: number; username: string; email: string; is_active: boolean }>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Login and get access token
   */
  async login(username: string, password: string) {
    const response = await fetchApi<{ access_token: string; token_type: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (response.access_token) {
      setAuthToken(response.access_token);
    }
    return response;
  },

  /**
   * Logout (clear token)
   */
  async logout() {
    setAuthToken(null);
    return fetchApi('/logout', {
      method: 'POST',
    });
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    return fetchApi<{ id: number; username: string; email: string; is_active: boolean }>('/me');
  },

  /**
   * Check if session is valid
   */
  async checkSession() {
    try {
      const response = await fetchApi<{ valid: boolean }>('/session');
      return response.valid;
    } catch {
      return false;
    }
  },
};

// Export token management functions
export { getAuthToken, setAuthToken };


