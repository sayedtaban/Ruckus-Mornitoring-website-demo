import React, { useMemo, useState } from 'react';
import { VenueData, CauseCodeData } from '../types';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import { generateTimeSeriesData } from '../utils/dataGenerator';
import { Activity, AlertTriangle, TrendingDown, Radio } from 'lucide-react';

interface NetflixScoreDashboardProps {
  venueData: VenueData;
  causeCodeData: CauseCodeData[];
}

type RankSortKey = 'name' | 'netflixScore' | 'utilization' | 'rxDesense' | 'cc25Risk';
type NFClassification = 'all' | 'good' | 'fair' | 'poor';
type CC25Filter = 'all' | 'high-risk' | 'critical';

export default function NetflixScoreDashboard({ venueData, causeCodeData }: NetflixScoreDashboardProps) {
  const topZones = useMemo(() => {
    return [...venueData.zones]
      .sort((a, b) => b.netflixScore - a.netflixScore)
      .slice(0, 3);
  }, [venueData.zones]);

  const netflixTimeSeriesData = useMemo(() => {
    return generateTimeSeriesData(24, topZones, 'netflixScore');
  }, [topZones]);

  const avgNetflixScore = venueData.zones.reduce((sum, z) => sum + z.netflixScore, 0) / venueData.zones.length;
  const cause25Data = causeCodeData.find(c => c.code === 25);

  const stabilityMetrics = useMemo(() => {
    const avgUtilization = venueData.zones.reduce((sum, z) => sum + z.utilization, 0) / venueData.zones.length;
    const avgRxDesense = venueData.zones.reduce((sum, z) => sum + z.rxDesense, 0) / venueData.zones.length;
    const highUtilizationZones = venueData.zones.filter(z => z.utilization > 80).length;

    return { avgUtilization, avgRxDesense, highUtilizationZones };
  }, [venueData.zones]);

  const classifyZone = (score: number): Exclude<NFClassification, 'all'> => {
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    return 'poor';
  };

  const [nfClass, setNfClass] = useState<NFClassification>('all');
  const [cc25Filter, setCc25Filter] = useState<CC25Filter>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<RankSortKey>('netflixScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Calculate CC25 Risk score per zone (combines Netflix score, utilization, RxDesense)
  const zonesWithRisk = useMemo(() => {
    return venueData.zones.map(zone => {
      // Risk score: lower Netflix score + higher utilization + higher RxDesense = higher risk
      const cc25Risk = (100 - zone.netflixScore) * 0.5 + zone.utilization * 0.3 + zone.rxDesense * 0.2;
      return { ...zone, cc25Risk };
    });
  }, [venueData.zones]);

  // Venue performance summary
  const venuePerformance = useMemo(() => {
    const highRiskZones = zonesWithRisk.filter((z: typeof zonesWithRisk[number]) => z.cc25Risk > 50);
    const criticalZones = zonesWithRisk.filter((z: typeof zonesWithRisk[number]) => z.netflixScore < 70 && (z.utilization > 70 || z.rxDesense > 10));
    const worstZones = [...zonesWithRisk].sort((a: typeof zonesWithRisk[number], b: typeof zonesWithRisk[number]) => a.netflixScore - b.netflixScore).slice(0, 3);
    
    return {
      highRiskZones: highRiskZones.length,
      criticalZones: criticalZones.length,
      worstZones: worstZones.map((z: typeof zonesWithRisk[number]) => ({ name: z.name, score: z.netflixScore })),
      avgRisk: zonesWithRisk.reduce((sum: number, z: typeof zonesWithRisk[number]) => sum + z.cc25Risk, 0) / zonesWithRisk.length
    };
  }, [zonesWithRisk]);

  const displayedZones = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = zonesWithRisk;
    
    if (nfClass !== 'all') {
      filtered = filtered.filter((z: typeof zonesWithRisk[number]) => classifyZone(z.netflixScore) === nfClass);
    }
    
    // CC25 Risk Filter
    if (cc25Filter === 'high-risk') {
      filtered = filtered.filter((z: typeof zonesWithRisk[number]) => z.cc25Risk > 50 || z.netflixScore < 70);
    } else if (cc25Filter === 'critical') {
      filtered = filtered.filter((z: typeof zonesWithRisk[number]) => z.netflixScore < 70 && (z.utilization > 70 || z.rxDesense > 10));
    }
    
    if (q) {
      filtered = filtered.filter((z: typeof zonesWithRisk[number]) => z.name.toLowerCase().includes(q));
    }
    
    const dir = sortDir === 'asc' ? 1 : -1;
    const toVal = (z: typeof filtered[number]) => {
      if (sortKey === 'name') return z.name.toLowerCase();
      if (sortKey === 'cc25Risk') return z.cc25Risk;
      return (z as any)[sortKey];
    };
    
    return [...filtered].sort((a, b) => {
      const av = toVal(a);
      const bv = toVal(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [zonesWithRisk, nfClass, cc25Filter, search, sortKey, sortDir]);

  const handleSort = (key: RankSortKey) => {
    if (key === sortKey) {
      setSortDir((d: 'asc' | 'desc') => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const renderSortHeader = (key: RankSortKey, label: string, align: 'left' | 'center' = 'left') => (
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
      <div>
        <h2 className="text-2xl font-bold text-grafana-text mb-2">Netflix Streaming Score</h2>
        <p className="text-grafana-text-secondary">
          Video streaming stability analysis based on QoS metrics and 802.11 cause codes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              Venue Avg
            </span>
          </div>
          <p className="text-sm opacity-90 mb-1">Netflix Stability Score</p>
          <p className="text-4xl font-bold">{avgNetflixScore.toFixed(1)}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-75">
              {avgNetflixScore >= 80 ? 'Excellent streaming quality' : avgNetflixScore >= 70 ? 'Good streaming quality' : 'Degraded streaming quality'}
            </p>
          </div>
        </div>

        <div className="bg-grafana-panel border border-grafana-border rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-grafana-red/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-grafana-red" />
            </div>
            <span className="text-xs font-semibold text-grafana-red bg-grafana-red/20 px-2 py-1 rounded">
              CODE 25
            </span>
          </div>
          <p className="text-sm text-grafana-text-secondary mb-1">QoS Disconnects</p>
          <p className="text-3xl font-bold text-grafana-text">{cause25Data?.count || 0}</p>
          <div className="mt-3 pt-3 border-t border-grafana-border">
            <p className="text-xs text-grafana-text-secondary">Impact: {cause25Data?.impactScore.toFixed(1) || 0}</p>
          </div>
        </div>

        <div className="bg-grafana-panel border border-grafana-border rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-grafana-yellow/20 rounded-lg">
              <TrendingDown className="w-6 h-6 text-grafana-yellow" />
            </div>
          </div>
          <p className="text-sm text-grafana-text-secondary mb-1">High Utilization Zones</p>
          <p className="text-3xl font-bold text-grafana-text">{stabilityMetrics.highUtilizationZones}</p>
          <div className="mt-3 pt-3 border-t border-grafana-border">
            <p className="text-xs text-grafana-text-secondary">
              {stabilityMetrics.avgUtilization.toFixed(1)}% avg utilization
            </p>
          </div>
        </div>

        <div className="bg-grafana-panel border border-grafana-border rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-grafana-blue/20 rounded-lg">
              <Radio className="w-6 h-6 text-grafana-blue" />
            </div>
          </div>
          <p className="text-sm text-grafana-text-secondary mb-1">Avg RxDesense</p>
          <p className="text-3xl font-bold text-grafana-text">
            {stabilityMetrics.avgRxDesense.toFixed(1)}%
          </p>
          <div className="mt-3 pt-3 border-t border-grafana-border">
            <p className="text-xs text-grafana-text-secondary">
              {stabilityMetrics.avgRxDesense > 10 ? 'High interference' : 'Normal interference'}
            </p>
          </div>
        </div>
      </div>

      {/* Venue Performance Summary */}
      <div className="bg-grafana-panel border border-grafana-border rounded p-6">
        <h3 className="text-lg font-semibold text-grafana-text mb-4">Venue Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-grafana-red/10 border border-grafana-red/30 rounded-lg">
            <p className="text-xs text-grafana-text-secondary mb-1">High CC25 Risk Zones</p>
            <p className="text-3xl font-bold text-grafana-red">{venuePerformance.highRiskZones}</p>
            <p className="text-xs text-grafana-text-secondary mt-1">Zones with risk score &gt; 50</p>
          </div>
          <div className="p-4 bg-grafana-red/10 border border-grafana-red/30 rounded-lg">
            <p className="text-xs text-grafana-text-secondary mb-1">Critical Zones</p>
            <p className="text-3xl font-bold text-grafana-red">{venuePerformance.criticalZones}</p>
            <p className="text-xs text-grafana-text-secondary mt-1">Low score + high utilization/RxDesense</p>
          </div>
          <div className="p-4 bg-grafana-bg border border-grafana-border rounded-lg">
            <p className="text-xs text-grafana-text-secondary mb-1">Avg CC25 Risk Score</p>
            <p className="text-3xl font-bold text-grafana-text">{venuePerformance.avgRisk.toFixed(1)}</p>
            <p className="text-xs text-grafana-text-secondary mt-1">Lower is better</p>
          </div>
          <div className="p-4 bg-grafana-bg border border-grafana-border rounded-lg">
            <p className="text-xs text-grafana-text-secondary mb-2">Worst Performing Zones</p>
            <div className="space-y-1.5">
              {venuePerformance.worstZones.map((zone: { name: string; score: number }, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-grafana-red/20 text-grafana-red' : 'bg-grafana-yellow/20 text-grafana-yellow'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-grafana-text truncate">{zone.name.substring(0, 20)}</span>
                  </div>
                  <span className="text-grafana-text-secondary font-semibold">{zone.score.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LineChart
        data={netflixTimeSeriesData}
        title="Netflix Stability Score - Top 3 Best Performing Zones (24 Hours)"
        valueFormatter={(v) => v.toFixed(1)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart data={causeCodeData} title="802.11 Disconnect Cause Codes" highlightCode={25} />

        <div className="bg-grafana-panel border border-grafana-border rounded p-6">
          <h3 className="text-lg font-semibold text-grafana-text mb-4">
            Streaming Impact Analysis
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-grafana-red/10 border border-grafana-red/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-grafana-red mt-0.5" />
                <div>
                  <p className="font-semibold text-grafana-text mb-1">Cause Code 25: QoS Issues</p>
                  <p className="text-sm text-grafana-text-secondary leading-relaxed">
                    This cause code indicates disassociation due to insufficient QoS resources,
                    directly impacting video streaming quality. High counts suggest network
                    congestion or resource constraints.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-grafana-text">Netflix Score Calculation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-3 bg-grafana-bg rounded-lg">
                  <span className="text-grafana-text-secondary">Base Experience Score</span>
                  <span className="font-semibold text-grafana-text">Weight: 50%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-grafana-bg rounded-lg">
                  <span className="text-grafana-text-secondary">RxDesense Impact</span>
                  <span className="font-semibold text-grafana-text">Weight: 30%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-grafana-bg rounded-lg">
                  <span className="text-grafana-text-secondary">Utilization Impact</span>
                  <span className="font-semibold text-grafana-text">Weight: 20%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-grafana-blue/10 border border-grafana-blue/30 rounded-lg">
              <p className="text-sm text-grafana-text font-medium mb-2">Recommendations</p>
              <ul className="text-sm text-grafana-text-secondary space-y-1 list-disc list-inside">
                <li>Monitor zones with Netflix scores below 70</li>
                <li>Investigate high Cause Code 25 events</li>
                <li>Implement QoS policies for streaming traffic</li>
                <li>Consider capacity upgrades for high-utilization zones</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-grafana-panel border border-grafana-border rounded p-6">
        <h3 className="text-lg font-semibold text-grafana-text mb-4">Zone Stability Rankings</h3>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-grafana-text-secondary">Filter:</span>
            {(['all','good','fair','poor'] as NFClassification[]).map(c => (
              <button
                key={c}
                onClick={() => setNfClass(c)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  nfClass === c
                    ? 'bg-grafana-hover border-grafana-border text-grafana-text'
                    : 'bg-grafana-bg border-transparent text-grafana-text-secondary hover:border-grafana-border'
                }`}
                aria-pressed={nfClass === c}
              >
                {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
            <span className="text-xs text-grafana-text-secondary ml-2">CC25 Risk:</span>
            {(['all', 'high-risk', 'critical'] as CC25Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setCc25Filter(f)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  cc25Filter === f
                    ? 'bg-grafana-red/20 border-grafana-red text-grafana-red'
                    : 'bg-grafana-bg border-transparent text-grafana-text-secondary hover:border-grafana-border'
                }`}
                aria-pressed={cc25Filter === f}
              >
                {f === 'all' ? 'All' : f === 'high-risk' ? 'High Risk' : 'Critical'}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search zone"
            className="px-2.5 py-1 bg-grafana-bg border border-grafana-border text-grafana-text text-xs rounded"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-grafana-bg border-b border-grafana-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">Rank</th>
                {renderSortHeader('name', 'Zone', 'left')}
                {renderSortHeader('netflixScore', 'Netflix Score', 'center')}
                {renderSortHeader('utilization', 'Utilization', 'center')}
                {renderSortHeader('rxDesense', 'RxDesense', 'center')}
                {renderSortHeader('cc25Risk', 'CC25 Risk', 'center')}
                <th className="px-4 py-3 text-center text-xs font-semibold text-grafana-text-secondary uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grafana-border">
              {displayedZones.map((zone: typeof zonesWithRisk[number], idx: number) => (
                  <tr key={zone.id} className="hover:bg-grafana-hover transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                        idx < 3
                          ? 'bg-grafana-green/20 text-grafana-green'
                          : idx >= displayedZones.length - 3
                          ? 'bg-grafana-red/20 text-grafana-red'
                          : 'bg-grafana-bg text-grafana-text-secondary'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-grafana-text">{zone.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-grafana-text">{zone.netflixScore.toFixed(1)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={zone.utilization > 70 ? 'text-grafana-yellow font-semibold' : 'text-grafana-text-secondary'}>
                        {zone.utilization.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={zone.rxDesense > 10 ? 'text-grafana-red font-semibold' : 'text-grafana-text-secondary'}>
                        {zone.rxDesense.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        zone.cc25Risk > 60
                          ? 'bg-grafana-red/20 text-grafana-red'
                          : zone.cc25Risk > 40
                          ? 'bg-grafana-yellow/20 text-grafana-yellow'
                          : 'bg-grafana-green/20 text-grafana-green'
                      }`}>
                        {zone.cc25Risk.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        zone.netflixScore >= 80
                          ? 'bg-grafana-green/20 text-grafana-green'
                          : zone.netflixScore >= 70
                          ? 'bg-grafana-yellow/20 text-grafana-yellow'
                          : 'bg-grafana-red/20 text-grafana-red'
                      }`}>
                        {zone.netflixScore >= 80 ? 'Excellent' : zone.netflixScore >= 70 ? 'Good' : 'Poor'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

