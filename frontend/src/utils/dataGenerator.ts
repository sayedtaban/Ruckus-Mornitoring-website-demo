import { Zone, VenueData, CauseCodeData, TimeSeriesData, AnomalyData, AccessPoint, APData, Radio, ClientData, HostUsageData, OSDistributionData, LoadData, BandLoadData } from '../types';

const zoneNames = [
  'BC83386-P - Dogwood',
  'CA28283 - Ventana Residences',
  'FL01313 - Palomar Core MEC',
  'FL21908-P - Pier Sixty-Six',
  'FL21966-P - Town Hollywood',
  'FL28242-P - Serenity Lane',
  'FL28243-P - Imperial Village',
  'FL28244-P - Sunpointe Place',
  'FL28245-P - ParkVillage I and',
  'FL29325-P - Harbor Cay',
  'GA29532-P - Signal House',
  'IL23336-P - Concordia Village',
  'IL23640-P - Lutheran Hillside',
  'IL62034-P - Meridian Village',
  'IN28254-P - EMC2',
  'MO23626-P - Lenoir Woods',
  'MO63144-P - Mason Pointe',
  'MO63304-P - Breeze Park',
  'MOXXXXX-P - Mason Pointe',
  'NC29384-P - SAU',
  'SBA Lab',
  'Staging Zone',
  'TN21944-P - Opus East Memphis',
  'TX29328-P - The Gabriel'
];

const causeCodeDescriptions: Record<number, string> = {
  1: 'Unspecified reason',
  2: 'Previous authentication no longer valid',
  3: 'Deauthenticated - leaving or left BSS',
  4: 'Disassociated due to inactivity',
  5: 'Disassociated - AP unable to handle all STAs',
  6: 'Class 2 frame from non-authenticated STA',
  7: 'Class 3 frame from non-associated STA',
  8: 'Disassociated - STA has left BSS',
  25: 'Disassociated due to insufficient QoS',
  34: 'Disassociated for unspecified QoS reason',
  45: 'Peer unreachable',
  47: 'Requested from peer'
};

function generateRandomValue(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Real values from the gauge dashboard image
const venueValues: Record<string, number> = {
  'BC83386-P - Dogwood': 653,
  'CA28283 - Ventana Residences': 541,
  'FL01313 - Palomar Core MEC': 0,
  'FL21908-P - Pier Sixty-Six': 999,
  'FL21966-P - Town Hollywood': 2019,
  'FL28242-P - Serenity Lane': 5,
  'FL28243-P - Imperial Village': 363,
  'FL28244-P - Sunpointe Place': 0,
  'FL28245-P - ParkVillage I and': 2,
  'FL29325-P - Harbor Cay': 0,
  'GA29532-P - Signal House': 921,
  'IL23336-P - Concordia Village': 688,
  'IL23640-P - Lutheran Hillside': 371,
  'IL62034-P - Meridian Village': 0,
  'IN28254-P - EMC2': 23,
  'MO23626-P - Lenoir Woods': 668,
  'MO63144-P - Mason Pointe': 0,
  'MO63304-P - Breeze Park': 402,
  'MOXXXXX-P - Mason Pointe': 0,
  'NC29384-P - SAU': 0,
  'SBA Lab': 0,
  'Staging Zone': 0,
  'TN21944-P - Opus East Memphis': 687,
  'TX29328-P - The Gabriel': 843
};

function generateZone(name: string, index: number): Zone {
  // Use the real value from the image, or generate a realistic one if not found
  const baseClients = venueValues[name] || Math.floor(generateRandomValue(50, 100));
  
  // Handle zero-value zones (offline or inactive zones)
  if (baseClients === 0) {
    return {
      id: `zone-${index}`,
      name,
      totalAPs: Math.floor(generateRandomValue(10, 50)),
      connectedAPs: 0, // All APs disconnected for zero zones
      disconnectedAPs: Math.floor(generateRandomValue(10, 50)),
      clients: 0,
      apAvailability: 0, // No availability for zero zones
      clientsPerAP: 0,
      experienceScore: 0, // No experience score for offline zones
      utilization: 0,
      rxDesense: 0,
      netflixScore: 0
    };
  }
  
  // Scale APs based on client count - more clients = more APs
  const totalAPs = Math.max(10, Math.floor(baseClients / 4) + Math.floor(generateRandomValue(5, 25)));
  const disconnectedAPs = Math.floor(generateRandomValue(0, Math.min(3, totalAPs * 0.05)));
  const connectedAPs = totalAPs - disconnectedAPs;
  const clients = baseClients;
  const apAvailability = (connectedAPs / totalAPs) * 100;
  const clientsPerAP = clients / connectedAPs;

  // Experience score inversely related to client density and utilization
  // Critical zones (like 2019 clients) get very low scores
  let baseExperienceScore;
  if (baseClients > 1500) {
    baseExperienceScore = Math.max(20, 40 - (clientsPerAP * 3)); // Critical zones
  } else if (baseClients > 800) {
    baseExperienceScore = Math.max(40, 70 - (clientsPerAP * 4)); // High load zones
  } else {
    baseExperienceScore = Math.max(60, 100 - (clientsPerAP * 5)); // Normal zones
  }
  
  const experienceScore = Math.max(
    0,
    Math.min(100, baseExperienceScore + generateRandomValue(-5, 5))
  );

  // Utilization based on client density - critical zones get very high utilization
  let utilization;
  if (baseClients > 1500) {
    utilization = Math.min(99, Math.max(85, clientsPerAP * 20 + generateRandomValue(5, 15))); // Critical
  } else if (baseClients > 800) {
    utilization = Math.min(95, Math.max(70, clientsPerAP * 18 + generateRandomValue(0, 10))); // High
  } else {
    utilization = Math.min(95, Math.max(20, clientsPerAP * 15 + generateRandomValue(-10, 10))); // Normal
  }
  
  const rxDesense = generateRandomValue(2, Math.min(25, clientsPerAP * 3));

  const netflixScore = Math.max(
    0,
    experienceScore - (rxDesense * 2) - (utilization > 70 ? 15 : 0)
  );

  return {
    id: `zone-${index}`,
    name,
    totalAPs,
    connectedAPs,
    disconnectedAPs,
    clients,
    apAvailability,
    clientsPerAP: parseFloat(clientsPerAP.toFixed(2)),
    experienceScore: parseFloat(experienceScore.toFixed(1)),
    utilization: parseFloat(utilization.toFixed(1)),
    rxDesense: parseFloat(rxDesense.toFixed(1)),
    netflixScore: parseFloat(netflixScore.toFixed(1))
  };
}

export function generateVenueData(): VenueData {
  const zones = zoneNames.map((name, index) => generateZone(name, index));

  const avgExperienceScore = zones.reduce((sum, zone) => sum + zone.experienceScore, 0) / zones.length;
  const slaCompliance = zones.filter(z => z.apAvailability >= 95).length / zones.length * 100;

  return {
    name: 'GA29532-P - Signal House',
    totalZones: zones.length,
    totalAPs: 4597,
    totalClients: 6875,
    totalClusters: 2,
    totalSwitches: 100,
    avgExperienceScore: parseFloat(avgExperienceScore.toFixed(1)),
    slaCompliance: parseFloat(slaCompliance.toFixed(1)),
    zones
  };
}

// Generate global metrics matching the dashboard image
export function generateGlobalMetrics() {
  const zones = zoneNames.map((name, index) => generateZone(name, index));
  
  const totalAPs = zones.reduce((sum, zone) => sum + zone.totalAPs, 0);
  const connectedAPs = zones.reduce((sum, zone) => sum + zone.connectedAPs, 0);
  const totalClients = zones.reduce((sum, zone) => sum + zone.clients, 0);
  const avgClientsPerAP = totalClients / connectedAPs;
  const apAvailability = (connectedAPs / totalAPs) * 100;
  const densityFactor = avgClientsPerAP / 10; // Normalize density factor
  const connectionStability = apAvailability; // Use AP availability as connection stability proxy
  
  // Calculate network health score based on experience scores and availability
  const avgExperienceScore = zones.reduce((sum, zone) => sum + zone.experienceScore, 0) / zones.length;
  const networkHealthScore = (avgExperienceScore + apAvailability) / 2;

  return {
    networkHealthScore: parseFloat(networkHealthScore.toFixed(1)),
    totalAPs: Math.floor(totalAPs / 1000 * 10) / 10, // Convert to K format (6.35K)
    connectedAPs: Math.floor(connectedAPs / 1000 * 10) / 10, // Convert to K format (4.26K)
    totalClients: Math.floor(totalClients / 1000 * 10) / 10, // Convert to K format (9.19K)
    avgClientsPerAP: parseFloat(avgClientsPerAP.toFixed(2)),
    apAvailability: parseFloat(apAvailability.toFixed(1)),
    densityFactor: parseFloat(densityFactor.toFixed(3)),
    connectionStability: parseFloat(connectionStability.toFixed(1))
  };
}

// Generate stability scores for zones
export function generateStabilityScores(zones: Zone[]) {
  return zones.map(zone => {
    // Calculate stability score based on experience score, availability, and density
    const densityPenalty = zone.clientsPerAP > 4 ? 20 : zone.clientsPerAP > 2 ? 10 : 0;
    const availabilityBonus = zone.apAvailability > 95 ? 10 : zone.apAvailability > 90 ? 5 : 0;
    
    let stabilityScore = zone.experienceScore - densityPenalty + availabilityBonus;
    
    // Handle zero-density zones
    if (zone.clientsPerAP === 0) {
      stabilityScore = generateRandomValue(80, 100); // Offline zones get high stability
    }
    
    return {
      zoneName: zone.name,
      stabilityScore: Math.max(0, Math.min(100, parseFloat(stabilityScore.toFixed(2))))
    };
  }).sort((a, b) => b.stabilityScore - a.stabilityScore); // Sort by highest stability first
}

// Generate AP distribution data for pie chart
export function generateAPDistribution(zones: Zone[]) {
  const totalAPs = zones.reduce((sum, zone) => sum + zone.totalAPs, 0);
  
  return zones.map(zone => ({
    zoneName: zone.name,
    apCount: zone.totalAPs,
    percentage: parseFloat(((zone.totalAPs / totalAPs) * 100).toFixed(1))
  })).sort((a, b) => b.apCount - a.apCount); // Sort by highest AP count first
}

// Generate client density data for gauge charts
export function generateClientDensity(zones: Zone[]) {
  return zones.map(zone => ({
    zoneName: zone.name,
    clientDensity: parseFloat(zone.clientsPerAP.toFixed(2)),
    clients: zone.clients,
    totalAPs: zone.totalAPs,
    connectedAPs: zone.connectedAPs
  }));
}

// Generate density factor data
export function generateDensityFactor(zones: Zone[]) {
  return zones.map(zone => ({
    zoneName: zone.name,
    densityFactor: parseFloat((zone.clientsPerAP / 10).toFixed(3)), // Normalize to 0-1 scale
    clientsPerAP: zone.clientsPerAP
  })).sort((a, b) => b.densityFactor - a.densityFactor); // Sort by highest density first
}

export function generateCauseCodeData(): CauseCodeData[] {
  return Object.entries(causeCodeDescriptions).map(([code, description]) => {
    const codeNum = parseInt(code);
    let baseCount = generateRandomValue(10, 100);

    if (codeNum === 25) {
      baseCount = generateRandomValue(150, 300);
    }

    const impactScore = codeNum === 25 ? generateRandomValue(70, 95) : generateRandomValue(20, 60);

    return {
      code: codeNum,
      description,
      count: Math.floor(baseCount),
      impactScore: parseFloat(impactScore.toFixed(1))
    };
  });
}

export function generateTimeSeriesData(
  hours: number,
  zones: Zone[],
  metric: 'experienceScore' | 'utilization' | 'netflixScore' | 'clients'
): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];
  const now = new Date();

  zones.forEach(zone => {
    const baseValue = zone[metric];

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const variance = generateRandomValue(-5, 5);
      const value = Math.max(0, baseValue + variance);

      data.push({
        timestamp: timestamp.toISOString(),
        value: parseFloat(value.toFixed(1)),
        zone: zone.name
      });
    }
  });

  return data;
}

export function generateAnomalies(zones: Zone[]): AnomalyData[] {
  const anomalies: AnomalyData[] = [];
  const now = new Date();

  zones.forEach((zone, index) => {
    if (zone.clientsPerAP > 4) {
      anomalies.push({
        id: `anomaly-${index}-1`,
        timestamp: new Date(now.getTime() - generateRandomValue(0, 24) * 60 * 60 * 1000).toISOString(),
        type: 'high_client_density',
        severity: zone.clientsPerAP > 5 ? 'critical' : 'major',
        description: `High client density detected: ${zone.clientsPerAP.toFixed(2)} clients per AP`,
        affectedZone: zone.name,
        metric: 'clients_per_ap'
      });
    }

    if (zone.rxDesense > 10) {
      anomalies.push({
        id: `anomaly-${index}-2`,
        timestamp: new Date(now.getTime() - generateRandomValue(0, 24) * 60 * 60 * 1000).toISOString(),
        type: 'interference',
        severity: 'warning',
        description: `High RxDesense detected: ${zone.rxDesense.toFixed(1)}%`,
        affectedZone: zone.name,
        metric: 'rx_desense'
      });
    }

    if (zone.experienceScore < 70) {
      anomalies.push({
        id: `anomaly-${index}-3`,
        timestamp: new Date(now.getTime() - generateRandomValue(0, 24) * 60 * 60 * 1000).toISOString(),
        type: 'poor_experience',
        severity: 'critical',
        description: `Poor experience score: ${zone.experienceScore.toFixed(1)}`,
        affectedZone: zone.name,
        metric: 'experience_score'
      });
    }
  });

  return anomalies.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function generateMACAddress(): string {
  const chars = '0123456789ABCDEF';
  const parts = Array.from({ length: 6 }, () => {
    return Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  });
  return parts.join(':');
}

function generateIPAddress(zoneIndex: number, apIndex: number): string {
  return `192.168.${Math.floor(zoneIndex / 10) + 1}.${apIndex + 100}`;
}

function generateSerialNumber(): string {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateFirmwareVersion(): string {
  const versions = ['6.1.0.0.1234', '6.1.0.0.1235', '6.0.9.0.1200', '6.1.1.0.1240', '6.0.8.0.1199'];
  return versions[Math.floor(Math.random() * versions.length)];
}

const apModels = ['R750', 'R850', 'T350', 'T370', 'H550'];

function generateAPData(zone: Zone, zoneIndex: number): APData {
  const apCount = zone.connectedAPs;
  const apList: AccessPoint[] = [];
  
  const availableModels = [...apModels];
  
  for (let i = 0; i < apCount; i++) {
    const model = availableModels[Math.floor(Math.random() * availableModels.length)];
    const isOnline = i >= zone.disconnectedAPs;
    
    const clients5GHz = Math.floor(zone.clients * 0.8 / zone.connectedAPs);
    const clients2_4GHz = zone.clients / zone.connectedAPs - clients5GHz;
    
    const radios: Radio[] = [
      {
        band: '5GHz',
        channel: [36, 40, 44, 48, 149, 153, 157, 161][Math.floor(Math.random() * 8)],
        txPower: Math.floor(generateRandomValue(15, 23)),
        noiseFloor: Math.floor(generateRandomValue(-100, -80)),
        clientCount: Math.max(0, Math.floor(clients5GHz * generateRandomValue(0.8, 1.2)))
      },
      {
        band: '2.4GHz',
        channel: [1, 6, 11][Math.floor(Math.random() * 3)],
        txPower: Math.floor(generateRandomValue(12, 20)),
        noiseFloor: Math.floor(generateRandomValue(-95, -75)),
        clientCount: Math.max(0, Math.floor(clients2_4GHz * generateRandomValue(0.8, 1.2)))
      }
    ];
    
    const ap: AccessPoint = {
      mac: generateMACAddress(),
      name: `AP-${zone.name.substring(0, 2)}-${String(i + 1).padStart(2, '0')}`,
      model,
      status: isOnline ? 'online' : 'offline',
      ip: generateIPAddress(zoneIndex, i),
      zoneId: zone.id,
      zoneName: zone.name,
      firmwareVersion: generateFirmwareVersion(),
      serialNumber: generateSerialNumber(),
      clientCount: isOnline ? Math.max(0, Math.floor(zone.clients / zone.connectedAPs * generateRandomValue(0.5, 1.5))) : 0,
      channelUtilization: isOnline ? Math.floor(generateRandomValue(30, 85)) : 0,
      airtimeUtilization: isOnline ? Math.floor(generateRandomValue(40, 90)) : 0,
      cpuUtilization: isOnline ? Math.floor(generateRandomValue(20, 60)) : 0,
      memoryUtilization: isOnline ? Math.floor(generateRandomValue(40, 75)) : 0,
      radios
    };
    
    apList.push(ap);
  }
  
  return {
    total: apCount,
    list: apList
  };
}

export function generateAPDataForZones(zones: Zone[]): Zone[] {
  return zones.map((zone, index) => ({
    ...zone,
    apData: generateAPData(zone, index)
  }));
}

// Client data generation
const osList = [
  { os: 'iOS', percentage: 26.48, color: '#8B5CF6' },
  { os: 'Android', percentage: 18.35, color: '#3B82F6' },
  { os: 'Unknown', percentage: 27.13, color: '#1E3A5F' },
  { os: 'Chrome OS/Chromebook', percentage: 7.2, color: '#10B981' },
  { os: 'macOS', percentage: 5.57, color: '#D1D5DB' },
  { os: 'Windows', percentage: 3.44, color: '#6B7280' }
];

function generateClientHostname(): string {
  const types = [
    'android-', 'TIVO-', '00:16:78:0b:9c', 'wlan0', '00:1d:43:10:e3', 
    'BRW', '00:24:a3:a6:18:fa', '001003', 'android-c6b9e', 
    'WNS010-', 'HS', 'DESKTOP-', 'iPhone', 'Samsung', 'AZULFD', 
    'Harry-s-', 'MacBook', 'Surface', 'ThinkPad'
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  
  if (type === 'android-') {
    return `${type}${Math.random().toString(36).substring(7)}`;
  }
  if (type === 'TIVO-') {
    return `${type}${Math.floor(Math.random() * 9000000) + 1000000}`;
  }
  if (type === 'BRW') {
    return `${type}${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
  }
  if (type === 'HS') {
    return `${type}${Math.floor(Math.random() * 200) + 100}`;
  }
  if (type.includes('DESKTOP-')) {
    return `${type}${Math.random().toString(36).substring(7).toUpperCase()}`;
  }
  if (type === 'WNS010-') {
    return `${type}${['FUBO', 'NETFLIX', 'HULU'][Math.floor(Math.random() * 3)]}`;
  }
  if (type.includes('iPhone') || type.includes('Samsung')) {
    return `${type}${Math.floor(Math.random() * 10)}`;
  }
  if (type.includes('MacBook') || type.includes('Surface') || type.includes('ThinkPad')) {
    return `${type}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  }
  
  return type;
}

function generateOSFromDevice(hostname: string): string {
  const osMap: { [key: string]: string } = {
    'android-': 'Android',
    'Android': 'Android',
    'iPhone': 'iOS',
    'Samsung': 'Android',
    'Galaxy': 'Android',
    'DESKTOP-': 'Windows (10)',
    'MacBook': 'macOS',
    'Mac-': 'macOS',
    'Surface': 'Windows (10)',
    'ThinkPad': 'Windows (10)',
    'Chromebook': 'Chrome OS',
    'TIVO-': 'Debian',
    'HS': 'Unknown',
    'wlan0': 'Unknown',
    'WNS010-': 'Amazon Ki...',
    'BRW': 'Brother Pri...'
  };
  
  for (const key in osMap) {
    if (hostname.includes(key)) {
      return osMap[key];
    }
  }
  
  return 'Unknown';
}

export function generateClientData(count: number): ClientData[] {
  const apList = [
    { name: 'ALMC - Unit6508', mac: '80:BC:37:1E:F1:A0' },
    { name: 'Common_AP151', mac: '2C:AB:46:13:BB:10' },
    { name: 'b6-u309', mac: 'D0:4F:58:37:91:40' },
    { name: 'u1309', mac: 'D0:4F:58:38:81:60' },
    { name: 'b14-u208', mac: 'D0:4F:58:38:36:00' },
    { name: 'Bradford_u501', mac: '80:BC:37:1E:6B:50' },
    { name: 'Patriot - Unit3...', mac: '34:15:93:1B:84:40' },
    { name: 'b6-u204', mac: 'C0:C7:0A:1B:32:30' },
    { name: 'Patio - Unit230...', mac: '34:15:93:1B:43:B0' },
    { name: 'President - Uni...', mac: '34:15:93:1B:44:50' },
    { name: 'b13-u111', mac: 'C0:C7:0A:1B:AA:70' },
    { name: 'Condo1_Main...', mac: 'C8:A6:08:0B:E5:D0' },
    { name: 'b3-u208', mac: '80:BC:37:1F:4F:70' },
    { name: 'IL Phone Roo...', mac: 'C0:C7:0A:1B:64:90' },
    { name: 'Commons_AP', mac: '2C:AB:46:08:B4:10' },
    { name: 'Eastwood_u486', mac: '34:15:93:1B:78:42' },
    { name: 'u-C4', mac: '34:15:93:1B:5E:8A' },
    { name: 'AL_Room 22', mac: 'B0:7C:51:36:0F:92' }
  ];

  const wlanList = ['LSSGuest', '@Town...', '@Signa...', '@Conc...', '@PierSi...', '@Breez...', 'LSS VOICE', 'LSS DATA', 'LSS GUEST'];

  const clients: ClientData[] = [];
  
  for (let i = 0; i < count; i++) {
    const hostname = generateClientHostname();
    const ap = apList[Math.floor(Math.random() * apList.length)];
    const wlan = wlanList[Math.floor(Math.random() * wlanList.length)];
    const os = generateOSFromDevice(hostname);
    
    // Generate IP address in various ranges like the image
    const ipRanges = [
      () => `10.${Math.floor(Math.random() * 3) + 160}.${Math.floor(Math.random() * 50) + 50}.${Math.floor(Math.random() * 100) + 100} /::`,
      () => `172.16.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1} /::`,
      () => `172.17.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1} /::`,
      () => `172.24.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 250) + 1} /::`,
      () => `10.165.241.${Math.floor(Math.random() * 100) + 100} /::`,
      () => `10.163.240.${Math.floor(Math.random() * 100) + 50} /::`
    ];
    const ipAddress = ipRanges[Math.floor(Math.random() * ipRanges.length)]();
    
    // Determine device type based on hostname
    let deviceType: 'phone' | 'laptop' | 'tablet' | 'other' = 'other';
    if (hostname.includes('iPhone') || hostname.includes('Samsung') || hostname.includes('android-')) {
      deviceType = 'phone';
    } else if (hostname.includes('DESKTOP-') || hostname.includes('MacBook') || hostname.includes('Surface')) {
      deviceType = 'laptop';
    } else if (hostname.includes('TIVO-') || hostname.includes('WNS010-') || hostname.includes('BRW')) {
      deviceType = 'other';
    }
    
    const client: ClientData = {
      hostname,
      modelName: os === 'Unknown' ? 'Generic_A...' : os,
      ipAddress,
      macAddress: generateMACAddress(),
      wlan,
      apName: ap.name,
      apMac: ap.mac,
      dataUsage: generateRandomValue(100, 2000),
      os,
      deviceType
    };
    
    clients.push(client);
  }
  
  return clients.sort((a, b) => b.dataUsage - a.dataUsage);
}

export function generateHostUsageData(count: number = 10): HostUsageData[] {
  const hosts: HostUsageData[] = [];
  
  for (let i = 0; i < count; i++) {
    hosts.push({
      hostname: generateClientHostname(),
      dataUsage: generateRandomValue(200, 1500)
    });
  }
  
  return hosts.sort((a, b) => b.dataUsage - a.dataUsage);
}

export function generateOSDistribution(): OSDistributionData[] {
  return osList;
}

// Load data generation based on the time-series chart
export function generateLoadData(hours: number = 1): LoadData[] {
  const data: LoadData[] = [];
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hours);
  
  // Generate data points every minute for the specified hours
  const totalMinutes = hours * 60;
  
  for (let i = 0; i <= totalMinutes; i++) {
    const timestamp = new Date(startTime.getTime() + i * 60000);
    
    // Base values that follow the pattern from the image
    const timeRatio = i / totalMinutes;
    
    // 2.4G band - highest values, follows the main trend
    const base24G = 0.3 + Math.sin(timeRatio * Math.PI * 2) * 0.2;
    const noise24G = (Math.random() - 0.5) * 0.1;
    const band24G = Math.max(0, base24G + noise24G);
    
    // 5G band - second highest, follows similar pattern but lower magnitude
    // Increased capacity - higher base value and larger range
    const base5G = 0.25 + Math.sin(timeRatio * Math.PI * 2) * 0.15;
    const noise5G = (Math.random() - 0.5) * 0.08;
    const band5G = Math.max(0, base5G + noise5G);
    
    // 6G/5G band - very low values, thin layer
    const base6G5G = 0.02 + Math.sin(timeRatio * Math.PI * 2) * 0.01;
    const noise6G5G = (Math.random() - 0.5) * 0.005;
    const band6G5G = Math.max(0, base6G5G + noise6G5G);
    
    data.push({
      timestamp: timestamp.toISOString(),
      band24G: Math.round(band24G * 100) / 100,
      band5G: Math.round(band5G * 100) / 100,
      band6G5G: Math.round(band6G5G * 100) / 100
    });
  }
  
  return data;
}

export function generateBandLoadData(hours: number = 1): BandLoadData[] {
  const loadData = generateLoadData(hours);
  
  return [
    {
      band: '2.4G',
      color: '#1E3A5F', // Dark blue
      data: loadData.map(d => ({
        timestamp: d.timestamp,
        band24G: d.band24G,
        band5G: 0,
        band6G5G: 0
      }))
    },
    {
      band: '5G',
      color: '#10B981', // Teal
      data: loadData.map(d => ({
        timestamp: d.timestamp,
        band24G: 0,
        band5G: d.band5G,
        band6G5G: 0
      }))
    },
    {
      band: '6G/5G',
      color: '#3B82F6', // Light blue
      data: loadData.map(d => ({
        timestamp: d.timestamp,
        band24G: 0,
        band5G: 0,
        band6G5G: d.band6G5G
      }))
    }
  ];
}

