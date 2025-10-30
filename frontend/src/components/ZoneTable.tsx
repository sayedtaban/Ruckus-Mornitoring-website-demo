import React, { useMemo, useState } from 'react';
import { Zone } from '../types';
import { Wifi, Users, Activity, TrendingUp } from 'lucide-react';

interface ZoneTableProps {
  zones: Zone[];
  onZoneSelect?: (zone: Zone) => void;
}

type SortKey = 'name' | 'connectedAPs' | 'clients' | 'clientsPerAP' | 'apAvailability' | 'experienceScore' | 'netflixScore';

type Classification = 'all' | 'good' | 'fair' | 'poor';

export default function ZoneTable({ zones, onZoneSelect }: ZoneTableProps) {
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-grafana-green bg-grafana-green/10';
    if (value >= thresholds.warning) return 'text-grafana-yellow bg-grafana-yellow/10';
    return 'text-grafana-red bg-grafana-red/10';
  };

  const classifyZone = (zone: Zone): Exclude<Classification, 'all'> => {
    if (zone.experienceScore >= 80) return 'good';
    if (zone.experienceScore >= 70) return 'fair';
    return 'poor';
  };

  const [classificationFilter, setClassificationFilter] = useState<Classification>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const displayedZones = useMemo(() => {
    let filtered = zones;
    if (classificationFilter !== 'all') {
      filtered = zones.filter((z) => classifyZone(z) === classificationFilter);
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    const compare = (a: Zone, b: Zone) => {
      const aVal = sortKey === 'name' ? a.name.toLowerCase() : (a as any)[sortKey];
      const bVal = sortKey === 'name' ? b.name.toLowerCase() : (b as any)[sortKey];
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    };

    return [...filtered].sort(compare);
  }, [zones, classificationFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev: 'asc' | 'desc') => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderSortHeader = (
    key: SortKey,
    label: string,
    align: 'left' | 'center' = 'left',
    icon?: React.ReactNode
  ) => (
    <th
      onClick={() => handleSort(key)}
      className={`px-6 py-4 text-${align} text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider cursor-pointer select-none`}
      aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      role="columnheader"
    >
      <span className={`inline-flex items-center ${align === 'center' ? 'justify-center' : ''} gap-2`}>
        {icon}
        <span>{label}</span>
        <span className="inline-flex flex-col leading-none ml-1">
          <span className={`${sortKey === key && sortDir === 'asc' ? 'text-grafana-text' : 'text-grafana-text-disabled'}`}>▲</span>
          <span className={`${sortKey === key && sortDir === 'desc' ? 'text-grafana-text' : 'text-grafana-text-disabled'}`}>▼</span>
        </span>
      </span>
    </th>
  );

  return (
    <div className="bg-grafana-panel border border-grafana-border rounded overflow-hidden">
      <div className="p-3 border-b border-grafana-border flex items-center gap-2">
        <span className="text-xs text-grafana-text-secondary">Filter:</span>
        {(['all', 'good', 'fair', 'poor'] as Classification[]).map((c) => (
          <button
            key={c}
            onClick={() => setClassificationFilter(c)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              classificationFilter === c
                ? 'bg-grafana-hover border-grafana-border text-grafana-text'
                : 'bg-grafana-bg border-transparent text-grafana-text-secondary hover:border-grafana-border'
            }`}
            aria-pressed={classificationFilter === c}
          >
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-grafana-bg border-b border-grafana-border">
            <tr>
              {renderSortHeader('name', 'Zone Name', 'left')}
              {renderSortHeader('connectedAPs', 'APs', 'center', <Wifi className="w-4 h-4" />)}
              {renderSortHeader('clients', 'Clients', 'center', <Users className="w-4 h-4" />)}
              {renderSortHeader('clientsPerAP', 'Clients/AP', 'center')}
              {renderSortHeader('apAvailability', 'Availability', 'center', <Activity className="w-4 h-4" />)}
              {renderSortHeader('experienceScore', 'Experience', 'center', <TrendingUp className="w-4 h-4" />)}
              {renderSortHeader('netflixScore', 'Netflix Score', 'center')}
            </tr>
          </thead>
          <tbody className="divide-y divide-grafana-border">
            {displayedZones.map((zone: Zone) => (
              <tr
                key={zone.id}
                onClick={() => onZoneSelect?.(zone)}
                className="hover:bg-grafana-hover transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-grafana-text">{zone.name}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-sm">
                    <span className="font-semibold text-grafana-text">{zone.connectedAPs}</span>
                    <span className="text-grafana-text-secondary">/{zone.totalAPs}</span>
                  </div>
                  {zone.disconnectedAPs > 0 && (
                    <div className="text-xs text-grafana-red mt-1">
                      {zone.disconnectedAPs} offline
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-semibold text-grafana-text">{zone.clients}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(zone.clientsPerAP > 3 ? 0 : 100, { good: 50, warning: 25 })
                  }`}>
                    {zone.clientsPerAP.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(zone.apAvailability, { good: 95, warning: 90 })
                  }`}>
                    {zone.apAvailability.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(zone.experienceScore, { good: 80, warning: 70 })
                  }`}>
                    {zone.experienceScore.toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(zone.netflixScore, { good: 80, warning: 70 })
                  }`}>
                    {zone.netflixScore.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

