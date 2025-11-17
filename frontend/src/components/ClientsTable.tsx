import React, { useEffect, useMemo, useState } from 'react';
import { ClientData, HostUsageData, OSDistributionData, VenueData, Zone, AccessPoint } from '../types';
import { accessPointsApi } from '../lib/api';

interface ClientsTableProps {
  clients: ClientData[];
  hosts: HostUsageData[];
  osDistribution: OSDistributionData[];
  loading?: boolean;
  venueData?: VenueData | null;
}

type ClientSortKey =
  | 'hostname'
  | 'modelName'
  | 'ipAddress'
  | 'macAddress'
  | 'wlan'
  | 'apName'
  | 'apMac'
  | 'dataUsage';

export default function ClientsTable({ clients, hosts, osDistribution, loading = false, venueData }: ClientsTableProps) {
  // Zone filter state
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  
  // State for AP data and mapping
  const [apMacToZoneMap, setApMacToZoneMap] = useState<Map<string, string>>(new Map());
  const [apsLoading, setApsLoading] = useState<boolean>(true);

  // Get zone options from venue data
  const zoneOptions = useMemo(() => {
    if (!venueData?.zones) return [];
    return [
      { id: 'all', name: 'All Zones' },
      ...venueData.zones.map((zone: Zone) => ({ id: zone.id, name: zone.name }))
    ];
  }, [venueData]);

  // Fetch APs for all zones and build AP MAC to Zone ID mapping
  useEffect(() => {
    let isCancelled = false;

    async function fetchAllAPs() {
      if (!venueData?.zones || venueData.zones.length === 0) {
        setApsLoading(false);
        return;
      }

      try {
        setApsLoading(true);
        const map = new Map<string, string>();

        // First, try to use AP data from zone if available (from venueData)
        venueData.zones.forEach((zone: Zone) => {
          if (zone.apData?.list && Array.isArray(zone.apData.list)) {
            zone.apData.list.forEach((ap: AccessPoint) => {
              if (ap.mac) {
                map.set(ap.mac.toLowerCase(), zone.id);
              }
            });
          }
        });

        // If we don't have AP data in venueData, try fetching from API
        // Use Promise.allSettled to handle individual failures gracefully
        const apPromises = venueData.zones.map(async (zone: Zone) => {
          // Skip if we already have AP data for this zone
          if (zone.apData?.list && zone.apData.list.length > 0) {
            return;
          }

          try {
            const apData = await accessPointsApi.getAccessPoints(zone.id);
            if (apData && Array.isArray(apData)) {
              // Handle array response
              apData.forEach((ap: AccessPoint) => {
                if (ap.mac) {
                  map.set(ap.mac.toLowerCase(), zone.id);
                }
              });
            } else if (apData && typeof apData === 'object' && 'list' in apData) {
              // Handle APData response with list
              const apList = (apData as { list: AccessPoint[] }).list;
              apList.forEach((ap: AccessPoint) => {
                if (ap.mac) {
                  map.set(ap.mac.toLowerCase(), zone.id);
                }
              });
            }
          } catch (err) {
            // Silently skip zones that fail - backend may not have AP data
            // Zone filtering will still work for zones we successfully fetched
          }
        });

        // Use allSettled to continue even if some requests fail
        await Promise.allSettled(apPromises);

        if (!isCancelled) {
          setApMacToZoneMap(map);
          setApsLoading(false);
        }
      } catch (err) {
        // If everything fails, still set loading to false so UI can render
        if (!isCancelled) {
          setApsLoading(false);
        }
      }
    }

    fetchAllAPs();

    return () => {
      isCancelled = true;
    };
  }, [venueData]);

  // Filter clients by selected zone using AP MAC to Zone mapping
  const zoneFilteredClients = useMemo(() => {
    if (zoneFilter === 'all') {
      return clients;
    }
    
    // If AP mapping is not ready, return all clients
    if (apsLoading || apMacToZoneMap.size === 0) {
      return clients;
    }

    // Filter clients by matching their AP MAC to the selected zone
    return clients.filter((client: ClientData) => {
      if (!client.apMac) {
        return false; // Skip clients without AP MAC
      }
      const clientZoneId = apMacToZoneMap.get(client.apMac.toLowerCase());
      return clientZoneId === zoneFilter;
    });
  }, [clients, zoneFilter, apMacToZoneMap, apsLoading]);

  // Calculate hosts from zone-filtered clients - show top 10
  const filteredHosts = useMemo(() => {
    if (zoneFilter === 'all') {
      return hosts.slice(0, 10); // Top 10 hosts
    }
    // Group zone-filtered clients by hostname and sum data usage
    const hostMap = new Map<string, number>();
    zoneFilteredClients.forEach((client: ClientData) => {
      const hostname = client.hostname || 'Unknown';
      const currentUsage = hostMap.get(hostname) || 0;
      hostMap.set(hostname, currentUsage + (client.dataUsage || 0));
    });
    
    return Array.from(hostMap.entries())
      .map(([hostname, dataUsage]) => ({ hostname, dataUsage }))
      .sort((a, b) => b.dataUsage - a.dataUsage)
      .slice(0, 10); // Top 10 hosts
  }, [zoneFilteredClients, hosts, zoneFilter]);

  // Calculate OS distribution from zone-filtered clients - show top 10
  const filteredOSDistribution = useMemo(() => {
    if (zoneFilter === 'all') {
      return osDistribution.slice(0, 10); // Top 10 OS
    }
    // Count OS from zone-filtered clients
    const osMap = new Map<string, number>();
    zoneFilteredClients.forEach((client: ClientData) => {
      const os = client.os || 'Unknown';
      osMap.set(os, (osMap.get(os) || 0) + 1);
    });
    
    const total = zoneFilteredClients.length;
    if (total === 0) return osDistribution.slice(0, 10);
    
    // Get colors from original distribution
    const colorMap = new Map<string, string>();
    osDistribution.forEach(item => {
      colorMap.set(item.os, item.color);
    });
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let colorIndex = 0;
    
    return Array.from(osMap.entries())
      .map(([os, count]) => ({
        os,
        percentage: (count / total) * 100,
        color: colorMap.get(os) || colors[colorIndex++ % colors.length]
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10); // Top 10 OS
  }, [zoneFilteredClients, osDistribution, zoneFilter]);
  const formatDataUsage = (mb: number): string => {
    if (mb >= 1000) {
      return `${(mb / 1000).toFixed(1)}GB`;
    }
    return `${mb.toFixed(1)}MB`;
  };

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<ClientSortKey>('hostname');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [wlanFilter, setWlanFilter] = useState<string>('all');
  const [osFilter, setOsFilter] = useState<string>('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const numericSortKeys = useMemo(
    () => new Set<ClientSortKey>(['dataUsage']),
    []
  );

  const wlanOptions = useMemo(() => {
    return Array.from(new Set(zoneFilteredClients.map(c => c.wlan))).sort();
  }, [zoneFilteredClients]);

  const osOptions = useMemo(() => {
    return Array.from(new Set(zoneFilteredClients.map(c => c.os).filter(Boolean))) as string[];
  }, [zoneFilteredClients]);

  const deviceTypeOptions = useMemo(() => {
    return Array.from(new Set(zoneFilteredClients.map(c => c.deviceType).filter(Boolean))) as string[];
  }, [zoneFilteredClients]);

  useEffect(() => {
    setPage(0);
  }, [zoneFilteredClients, search, sortKey, sortDir, wlanFilter, osFilter, deviceTypeFilter, zoneFilter]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = zoneFilteredClients;
    if (wlanFilter !== 'all') {
      filtered = filtered.filter(c => c.wlan === wlanFilter);
    }
    if (osFilter !== 'all') {
      filtered = filtered.filter(c => (c.os || '').toLowerCase() === osFilter.toLowerCase());
    }
    if (deviceTypeFilter !== 'all') {
      filtered = filtered.filter(c => (c.deviceType || '') === deviceTypeFilter);
    }
    if (q) {
      filtered = filtered.filter((c) =>
        [c.hostname, c.modelName, c.ipAddress, c.macAddress, c.wlan, c.apName, c.apMac]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const aValue = (a as any)[sortKey];
      const bValue = (b as any)[sortKey];

      if (numericSortKeys.has(sortKey)) {
        const aNum =
          typeof aValue === 'number'
            ? aValue
            : Number.isFinite(Number(aValue))
            ? Number(aValue)
            : Number.NEGATIVE_INFINITY;
        const bNum =
          typeof bValue === 'number'
            ? bValue
            : Number.isFinite(Number(bValue))
            ? Number(bValue)
            : Number.NEGATIVE_INFINITY;
        if (aNum < bNum) return -1 * dir;
        if (aNum > bNum) return 1 * dir;
        return 0;
      }

      const av = (aValue ?? '').toString().toLowerCase();
      const bv = (bValue ?? '').toString().toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [
    clients,
    search,
    sortKey,
    sortDir,
    wlanFilter,
    osFilter,
    deviceTypeFilter,
    numericSortKeys,
  ]);

  const totalClients = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalClients / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedClients = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  const pageStart = totalClients === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd = Math.min((currentPage + 1) * pageSize, totalClients);

  const handleSort = (key: ClientSortKey) => {
    if (key === sortKey) {
      setSortDir((d: 'asc' | 'desc') => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderSortHeader = (
    key: ClientSortKey,
    label: string,
    align: 'left' | 'center' | 'right' = 'left'
  ) => (
    <th
      onClick={() => handleSort(key)}
      className={`px-4 py-3 text-${align} text-xs font-semibold text-grafana-text-secondary uppercase cursor-pointer select-none`}
      aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      role="columnheader"
    >
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        <span className="inline-flex flex-col leading-none ml-1">
          <span className={`${sortKey === key && sortDir === 'asc' ? 'text-grafana-text' : 'text-grafana-text-disabled'}`}>▲</span>
          <span className={`${sortKey === key && sortDir === 'desc' ? 'text-grafana-text' : 'text-grafana-text-disabled'}`}>▼</span>
        </span>
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Clients</h2>
          <p className="text-sm text-grafana-text-secondary">
            {zoneFilter === 'all'
              ? 'All clients across all zones.'
              : `Clients in ${zoneOptions.find(z => z.id === zoneFilter)?.name || 'selected zone'}.`}
          </p>
        </div>
        {venueData && zoneOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-1.5 bg-grafana-bg border border-grafana-border rounded text-sm text-grafana-text focus:outline-none focus:border-grafana-blue"
            >
              {zoneOptions.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hosts Column */}
        <div className="bg-grafana-panel border border-grafana-border rounded p-4">
          <h3 className="text-sm font-normal text-grafana-text mb-4">Hosts</h3>
          <div className="space-y-3">
            {filteredHosts.map((host, index) => {
              const maxUsage = filteredHosts.length > 0 ? Math.max(...filteredHosts.map(h => h.dataUsage)) : 1;
              const percentage = maxUsage > 0 ? (host.dataUsage / maxUsage) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-grafana-text truncate">{host.hostname}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-grafana-bg rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-grafana-text-secondary whitespace-nowrap">
                      {formatDataUsage(host.dataUsage)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model Names and OS Distribution */}
        <div className="bg-grafana-panel border border-grafana-border rounded p-4">
          <h3 className="text-sm font-normal text-grafana-text mb-4">Model Names</h3>
          
          {/* OS Distribution Pie Chart */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative" style={{ width: '200px', height: '200px' }}>
              <svg width="200" height="200" className="transform -rotate-90">
                {(() => {
                  let currentAngle = 0;
                  const centerX = 100;
                  const centerY = 100;
                  const radius = 80;
                  const innerRadius = 50;

                  return filteredOSDistribution.map((item, index) => {
                    const percentage = item.percentage;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle += angle;

                    const x1 = centerX + radius * Math.cos((startAngle - 90) * (Math.PI / 180));
                    const y1 = centerY + radius * Math.sin((startAngle - 90) * (Math.PI / 180));
                    const x2 = centerX + radius * Math.cos((endAngle - 90) * (Math.PI / 180));
                    const y2 = centerY + radius * Math.sin((endAngle - 90) * (Math.PI / 180));

                    const x3 = centerX + innerRadius * Math.cos((startAngle - 90) * (Math.PI / 180));
                    const y3 = centerY + innerRadius * Math.sin((startAngle - 90) * (Math.PI / 180));
                    const x4 = centerX + innerRadius * Math.cos((endAngle - 90) * (Math.PI / 180));
                    const y4 = centerY + innerRadius * Math.sin((endAngle - 90) * (Math.PI / 180));

                    const largeArc = angle > 180 ? 1 : 0;

                    const pathData = [
                      `M ${centerX} ${centerY}`,
                      `L ${x3} ${y3}`,
                      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${x4} ${y4}`,
                      `L ${x2} ${y2}`,
                      `A ${radius} ${radius} 0 ${largeArc} 0 ${x1} ${y1}`,
                      'Z'
                    ].join(' ');

                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={item.color}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <title>{item.os}: {item.percentage.toFixed(2)}%</title>
                      </path>
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-grafana-text-secondary">OS</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {filteredOSDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-grafana-text-secondary">{item.os}</span>
                </div>
                <span className="text-grafana-text">{item.percentage.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Data Table */}
      <div className="bg-grafana-panel border border-grafana-border rounded">
        <div className="p-4 border-b border-grafana-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-grafana-hover rounded transition-colors">
                <svg className="w-4 h-4 text-grafana-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="p-2 hover:bg-grafana-hover rounded transition-colors">
                <svg className="w-4 h-4 text-grafana-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-grafana-text hover:bg-grafana-hover rounded transition-colors">Deauthorize</button>
              <button className="px-3 py-1.5 text-sm text-grafana-text hover:bg-grafana-hover rounded transition-colors">Block</button>
              <button className="px-3 py-1.5 text-sm text-grafana-text hover:bg-grafana-hover rounded transition-colors">Disconnect</button>
              <button className="px-3 py-1.5 text-sm text-grafana-text hover:bg-grafana-hover rounded transition-colors flex items-center gap-1">
                More <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={wlanFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWlanFilter(e.target.value)}
                className="bg-grafana-bg border border-grafana-border text-grafana-text text-xs px-2.5 py-1 rounded"
              >
                <option value="all">All WLANs</option>
                {wlanOptions.map((w: string) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              <select
                value={osFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOsFilter(e.target.value)}
                className="bg-grafana-bg border border-grafana-border text-grafana-text text-xs px-2.5 py-1 rounded"
              >
                <option value="all">All OS</option>
                {osOptions.map((o: string) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <select
                value={deviceTypeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDeviceTypeFilter(e.target.value)}
                className="bg-grafana-bg border border-grafana-border text-grafana-text text-xs px-2.5 py-1 rounded"
              >
                <option value="all">All Devices</option>
                {deviceTypeOptions.map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="search"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="w-40 px-3 py-1.5 bg-grafana-bg border border-grafana-border text-grafana-text text-sm rounded"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-grafana-bg border-b border-grafana-border">
              <tr>
                {renderSortHeader('hostname', 'Hostname')}
                {renderSortHeader('modelName', 'Model Name')}
                {renderSortHeader('ipAddress', 'IP Address')}
                {renderSortHeader('macAddress', 'MAC Address')}
                {renderSortHeader('wlan', 'WLAN')}
                {renderSortHeader('apName', 'AP Name')}
                {renderSortHeader('apMac', 'AP MAC')}
                {renderSortHeader('dataUsage', 'Usage', 'right')}
              </tr>
            </thead>
            <tbody className="divide-y divide-grafana-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
                        <div className="w-8 h-8 border-4 border-grafana-border border-t-grafana-orange rounded-full animate-spin" />
                      </div>
                      <p className="text-sm text-grafana-text-secondary">Loading clients...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-sm text-grafana-text-secondary">No clients to display</p>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client: ClientData, index: number) => (
                  <tr key={`${client.macAddress}-${index}`} className="hover:bg-grafana-hover transition-colors">
                    <td className="px-4 py-3 text-sm text-grafana-text">{client.hostname.substring(0, 20)}...</td>
                    <td className="px-4 py-3 text-sm text-grafana-text-secondary">{client.modelName}</td>
                    <td className="px-4 py-3 text-sm text-grafana-text-secondary">{client.ipAddress}</td>
                    <td className="px-4 py-3 text-sm text-grafana-text">{client.macAddress}</td>
                    <td className="px-4 py-3 text-sm text-grafana-text-secondary">{client.wlan}</td>
                    <td className="px-4 py-3 text-sm text-grafana-text">{client.apName}</td>
                    <td className="px-4 py-3 text-sm text-grafana-blue">{client.apMac}</td>
                    <td className="px-4 py-3 text-sm text-right text-grafana-text">
                      {formatDataUsage(client.dataUsage || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-grafana-border">
          <div className="text-xs text-grafana-text-secondary">
            {loading
              ? 'Loading clients...'
              : totalClients === 0
              ? 'No clients to display'
              : `Showing ${pageStart}-${pageEnd} of ${totalClients}`}
          </div>
          {!loading && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-grafana-text-secondary">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="bg-grafana-bg border border-grafana-border text-grafana-text text-xs px-2 py-1 rounded"
                >
                  {[10, 25, 50, 100].map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs text-grafana-text-secondary">
                <button
                  className="px-2 py-1 border border-grafana-border rounded disabled:opacity-40 hover:bg-grafana-hover transition-colors"
                  onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                >
                  Prev
                </button>
                <span>
                  Page {totalClients === 0 ? 0 : currentPage + 1} of {totalClients === 0 ? 0 : totalPages}
                </span>
                <button
                  className="px-2 py-1 border border-grafana-border rounded disabled:opacity-40 hover:bg-grafana-hover transition-colors"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage >= totalPages - 1 || totalClients === 0}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


