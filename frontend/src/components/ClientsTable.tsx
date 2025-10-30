import React, { useMemo, useState } from 'react';
import { ClientData, HostUsageData, OSDistributionData } from '../types';

interface ClientsTableProps {
  clients: ClientData[];
  hosts: HostUsageData[];
  osDistribution: OSDistributionData[];
}

type ClientSortKey = 'hostname' | 'modelName' | 'ipAddress' | 'macAddress' | 'wlan' | 'apName' | 'apMac';

export default function ClientsTable({ clients, hosts, osDistribution }: ClientsTableProps) {
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

  const wlanOptions = useMemo(() => {
    return Array.from(new Set(clients.map(c => c.wlan))).sort();
  }, [clients]);

  const osOptions = useMemo(() => {
    return Array.from(new Set(clients.map(c => c.os).filter(Boolean))) as string[];
  }, [clients]);

  const deviceTypeOptions = useMemo(() => {
    return Array.from(new Set(clients.map(c => c.deviceType).filter(Boolean))) as string[];
  }, [clients]);

  const visibleClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = clients;
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
      const av = (a as any)[sortKey]?.toString().toLowerCase();
      const bv = (b as any)[sortKey]?.toString().toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [clients, search, sortKey, sortDir]);

  const handleSort = (key: ClientSortKey) => {
    if (key === sortKey) {
      setSortDir((d: 'asc' | 'desc') => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderSortHeader = (key: ClientSortKey, label: string, align: 'left' | 'center' = 'left') => (
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
        <h2 className="text-2xl font-bold text-grafana-text">Clients</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hosts Column */}
        <div className="bg-grafana-panel border border-grafana-border rounded p-4">
          <h3 className="text-sm font-normal text-grafana-text mb-4">Hosts</h3>
          <div className="space-y-3">
            {hosts.map((host, index) => {
              const maxUsage = Math.max(...hosts.map(h => h.dataUsage));
              const percentage = (host.dataUsage / maxUsage) * 100;
              
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

                  return osDistribution.map((item, index) => {
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
            {osDistribution.map((item, index) => (
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
                className="px-3 py-1.5 bg-grafana-bg border border-grafana-border text-grafana-text text-sm rounded"
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
              </tr>
            </thead>
            <tbody className="divide-y divide-grafana-border">
              {visibleClients.map((client: ClientData, index: number) => (
                <tr key={index} className="hover:bg-grafana-hover transition-colors">
                  <td className="px-4 py-3 text-sm text-grafana-text">{client.hostname.substring(0, 20)}...</td>
                  <td className="px-4 py-3 text-sm text-grafana-text-secondary">{client.modelName}</td>
                  <td className="px-4 py-3 text-sm text-grafana-text-secondary">{client.ipAddress}</td>
                  <td className="px-4 py-3 text-sm text-grafana-text">{client.macAddress}</td>
                  <td className="px-4 py-3 text-sm text-grafana-text-secondary">{client.wlan}</td>
                  <td className="px-4 py-3 text-sm text-grafana-text">{client.apName}</td>
                  <td className="px-4 py-3 text-sm text-grafana-blue">{client.apMac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


