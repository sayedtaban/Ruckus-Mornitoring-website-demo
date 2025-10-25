import { useMemo } from 'react';
import { VenueData, CauseCodeData } from '../types';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import { generateTimeSeriesData } from '../utils/dataGenerator';
import { Activity, AlertTriangle, TrendingDown, Radio } from 'lucide-react';

interface NetflixScoreDashboardProps {
  venueData: VenueData;
  causeCodeData: CauseCodeData[];
}

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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-grafana-bg border-b border-grafana-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">Zone</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-grafana-text-secondary uppercase">Netflix Score</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-grafana-text-secondary uppercase">Utilization</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-grafana-text-secondary uppercase">RxDesense</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-grafana-text-secondary uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grafana-border">
              {[...venueData.zones]
                .sort((a, b) => b.netflixScore - a.netflixScore)
                .map((zone, idx) => (
                  <tr key={zone.id} className="hover:bg-grafana-hover transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                        idx < 3
                          ? 'bg-grafana-green/20 text-grafana-green'
                          : idx >= venueData.zones.length - 3
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

