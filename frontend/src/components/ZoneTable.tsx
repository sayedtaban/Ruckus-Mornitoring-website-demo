import { useMemo, useState } from 'react';
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
              <th onClick={() => handleSort('name')} className="px-6 py-4 text-left text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider cursor-pointer select-none">
                Zone Name {sortKey === 'name' && (<span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>)}
              </th>
              <th onClick={() => handleSort('connectedAPs')} className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider cursor-pointer select-none">
                <div className="flex items-center justify-center gap-2">
                  <Wifi className="w-4 h-4" />
                  APs
                </div>
                {sortKey === 'connectedAPs' && (<span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>)}
              </th>
              <th onClick={() => handleSort('clients')} className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider cursor-pointer select-none">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Clients
                </div>
                {sortKey === 'clients' && (<span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>)}
              </th>
              <th onClick={() => handleSort('clientsPerAP')} className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider cursor-pointer select-none">
                Clients/AP {sortKey === 'clientsPerAP' && (<span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>)}
              </th>
              <th onClick={() => handleSort('apAvailability')} className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider cursor-pointer select-none">
                <div className="flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4" />
                  Availability
                </div>
                {sortKey === 'apAvailability' && (<span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>)}
              </th>
              <th onClick={() => handleSort('experienceScore')} className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider cursor-pointer select-none">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Experience
                </div>
                {sortKey === 'experienceScore' && (<span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>)}
              </th>
              <th onClick={() => handleSort('netflixScore')} className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider cursor-pointer select-none">
                Netflix Score {sortKey === 'netflixScore' && (<span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>)}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grafana-border">
            {displayedZones.map((zone) => (
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

