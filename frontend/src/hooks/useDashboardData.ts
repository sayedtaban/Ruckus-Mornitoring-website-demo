import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  venueApi,
  causeCodesApi,
  anomaliesApi,
  clientsApi,
  hostsApi,
  osDistributionApi,
  loadApi
} from '../lib/api';
import {
  VenueData,
  CauseCodeData,
  AnomalyData,
  ClientData,
  HostUsageData,
  OSDistributionData,
  BandLoadData
} from '../types';

type ClientListResponse = {
  data: ClientData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

// 20 minutes in milliseconds
const CACHE_TIME = 20 * 60 * 1000;
const REFETCH_INTERVAL = 20 * 60 * 1000;
const STALE_TIME = 20 * 60 * 1000;

export function useVenueData() {
  const { user } = useAuth();
  return useQuery<VenueData>({
    queryKey: ['venue'],
    queryFn: () => venueApi.getVenue() as Promise<VenueData>,
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME, // cacheTime in v5 is now gcTime
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Use cached data if available
  });
}

export function useCauseCodesData() {
  const { user } = useAuth();
  return useQuery<CauseCodeData[]>({
    queryKey: ['causeCodes'],
    queryFn: () => causeCodesApi.getCauseCodes() as Promise<CauseCodeData[]>,
    enabled: !!user,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useAnomaliesData() {
  const { user } = useAuth();
  return useQuery<AnomalyData[]>({
    queryKey: ['anomalies'],
    queryFn: () => anomaliesApi.getAnomalies() as Promise<AnomalyData[]>,
    enabled: !!user,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useClientsData() {
  const { user } = useAuth();
  return useQuery<ClientListResponse>({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients({ limit: 10000 }) as Promise<ClientListResponse>, // Load all clients
    enabled: !!user,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useHostsData() {
  const { user } = useAuth();
  return useQuery<HostUsageData[]>({
    queryKey: ['hosts'],
    queryFn: () => hostsApi.getHosts({ limit: 20 }) as Promise<HostUsageData[]>,
    enabled: !!user,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useOSDistributionData() {
  const { user } = useAuth();
  return useQuery<OSDistributionData[]>({
    queryKey: ['osDistribution'],
    queryFn: () => osDistributionApi.getOSDistribution() as Promise<OSDistributionData[]>,
    enabled: !!user,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useLoadData() {
  const { user } = useAuth();
  return useQuery<{ bands: BandLoadData[] } | BandLoadData[]>({
    queryKey: ['load'],
    queryFn: () => loadApi.getLoad() as Promise<{ bands: BandLoadData[] } | BandLoadData[]>,
    enabled: !!user,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

