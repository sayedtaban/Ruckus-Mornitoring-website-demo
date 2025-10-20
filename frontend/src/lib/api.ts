/**
 * API client for communicating with the backend FastAPI server
 */

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
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
  async getAccessPoints(zoneId: string) {
    return fetchApi(`/zones/${zoneId}/aps`);
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

