export interface Radio {
  band: '2.4GHz' | '5GHz';
  channel: number;
  txPower: number;
  noiseFloor: number;
  clientCount: number;
}

export interface AccessPoint {
  mac: string;
  name: string;
  model: string;
  status: 'online' | 'offline';
  ip: string;
  zoneId: string;
  zoneName: string;
  firmwareVersion: string;
  serialNumber: string;
  clientCount: number;
  channelUtilization: number;
  airtimeUtilization: number;
  cpuUtilization: number;
  memoryUtilization: number;
  radios: Radio[];
}

export interface APData {
  total: number;
  list: AccessPoint[];
}

export interface Zone {
  id: string;
  name: string;
  totalAPs: number;
  connectedAPs: number;
  disconnectedAPs: number;
  clients: number;
  apAvailability: number;
  clientsPerAP: number;
  experienceScore: number;
  utilization: number;
  rxDesense: number;
  netflixScore: number;
  apData?: APData;
}

export interface VenueData {
  name: string;
  totalZones: number;
  totalAPs: number;
  totalClients: number;
  avgExperienceScore: number;
  slaCompliance: number;
  zones: Zone[];
}

export interface CauseCodeData {
  code: number;
  description: string;
  count: number;
  impactScore: number;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  zone?: string;
}

export interface AnomalyData {
  id: string;
  timestamp: string;
  type: string;
  severity: 'critical' | 'major' | 'warning' | 'info';
  description: string;
  affectedZone: string;
  metric: string;
}

export interface ClientData {
  hostname: string;
  modelName: string;
  ipAddress: string;
  macAddress: string;
  wlan: string;
  apName: string;
  apMac: string;
  dataUsage: number;
  os?: string;
  deviceType?: 'phone' | 'laptop' | 'tablet' | 'other';
}

export interface HostUsageData {
  hostname: string;
  dataUsage: number;
}

export interface OSDistributionData {
  os: string;
  percentage: number;
  color: string;
}

export interface LoadData {
  timestamp: string;
  band24G: number;
  band5G: number;
  band6G5G: number;
}

export interface BandLoadData {
  band: '2.4G' | '5G' | '6G/5G';
  color: string;
  data: LoadData[];
}

