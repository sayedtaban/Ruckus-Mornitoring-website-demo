import { useMemo } from 'react';
import { VenueData, AnomalyData } from '../types';
import AnomalyList from '../components/AnomalyList';
import LineChart from '../components/LineChart';
import { AlertTriangle, TrendingUp, Activity, XCircle } from 'lucide-react';
import { generateTimeSeriesData } from '../utils/dataGenerator';

interface AnomalyDashboardProps {
  venueData: VenueData;
  anomalies: AnomalyData[];
}

export default function AnomalyDashboard({ venueData, anomalies }: AnomalyDashboardProps) {
  const severityCounts = useMemo(() => {
    return {
      critical: anomalies.filter(a => a.severity === 'critical').length,
      major: anomalies.filter(a => a.severity === 'major').length,
      warning: anomalies.filter(a => a.severity === 'warning').length,
      info: anomalies.filter(a => a.severity === 'info').length
    };
  }, [anomalies]);

  const affectedZones = useMemo(() => {
    const zoneIds = new Set(anomalies.map(a => a.affectedZone));
    return venueData.zones.filter(z => zoneIds.has(z.name));
  }, [anomalies, venueData.zones]);

  const experienceTimeSeriesData = useMemo(() => {
    if (affectedZones.length === 0) return [];
    return generateTimeSeriesData(24, affectedZones.slice(0, 3), 'experienceScore');
  }, [affectedZones]);

  const anomalyTypeBreakdown = useMemo(() => {
    const breakdown = anomalies.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [anomalies]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-grafana-text mb-2">Anomaly Detection</h2>
        <p className="text-grafana-text-secondary">
          ML-powered anomaly detection showing deviations from baseline behavior
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Critical Anomalies</p>
          <p className="text-4xl font-bold">{severityCounts.critical}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-75">Immediate attention required</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Major Anomalies</p>
          <p className="text-4xl font-bold">{severityCounts.major}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-75">Should be investigated soon</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Warning Level</p>
          <p className="text-4xl font-bold">{severityCounts.warning}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-75">Monitor for escalation</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Affected Zones</p>
          <p className="text-4xl font-bold">{affectedZones.length}</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-75">
              {((affectedZones.length / venueData.zones.length) * 100).toFixed(0)}% of total zones
            </p>
          </div>
        </div>
      </div>

      {experienceTimeSeriesData.length > 0 && (
        <LineChart
          data={experienceTimeSeriesData}
          title="Experience Score - Affected Zones with Detected Anomalies (24 Hours)"
          valueFormatter={(v) => v.toFixed(1)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnomalyList anomalies={anomalies} maxItems={8} />

        <div className="bg-grafana-panel border border-grafana-border rounded p-6">
          <h3 className="text-lg font-semibold text-grafana-text mb-4">Anomaly Type Breakdown</h3>

          <div className="space-y-3 mb-6">
            {anomalyTypeBreakdown.map((item) => {
              const percentage = (item.count / anomalies.length) * 100;
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-grafana-text-secondary capitalize">
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-bold text-grafana-text">{item.count}</span>
                  </div>
                  <div className="relative h-8 bg-grafana-bg rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-grafana-blue to-grafana-blue/80 rounded-lg transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-semibold text-white drop-shadow-sm">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 pt-4 border-t border-grafana-border">
            <div>
              <h4 className="font-semibold text-grafana-text mb-3">Detection Methodology</h4>
              <div className="space-y-2 text-sm text-grafana-text-secondary">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-grafana-blue mt-2" />
                  <p>
                    <strong className="text-grafana-text">Baseline Learning:</strong> System learns normal
                    behavior patterns over 7-day rolling window
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-grafana-blue mt-2" />
                  <p>
                    <strong className="text-grafana-text">Threshold Detection:</strong> Flags deviations
                    exceeding 2 standard deviations from baseline
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-grafana-blue mt-2" />
                  <p>
                    <strong className="text-grafana-text">Correlation Analysis:</strong> Groups related
                    anomalies to identify systemic issues
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-grafana-blue/10 border border-grafana-blue/30 rounded-lg">
              <p className="text-sm text-grafana-text font-medium mb-2">Recommended Actions</p>
              <ul className="text-sm text-grafana-text-secondary space-y-1 list-disc list-inside">
                <li>Prioritize critical anomalies first</li>
                <li>Investigate patterns in affected zones</li>
                <li>Review infrastructure changes in last 24h</li>
                <li>Set up alerts for recurring anomalies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-grafana-panel border border-grafana-border rounded p-6">
        <h3 className="text-lg font-semibold text-grafana-text mb-4">Anomaly Timeline</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-grafana-border" />
          <div className="space-y-6">
            {anomalies.slice(0, 10).map((anomaly, idx) => {
              const severityColors = {
                critical: 'bg-grafana-red',
                major: 'bg-grafana-orange',
                warning: 'bg-grafana-yellow',
                info: 'bg-grafana-blue'
              };

              const date = new Date(anomaly.timestamp);
              const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <div key={anomaly.id} className="relative pl-12">
                  <div className={`absolute left-2 w-4 h-4 rounded-full ${severityColors[anomaly.severity]} ring-4 ring-grafana-bg`} />
                  <div className="bg-grafana-bg rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-grafana-text-secondary">{dateStr} at {timeStr}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        anomaly.severity === 'critical'
                          ? 'bg-grafana-red/20 text-grafana-red'
                          : anomaly.severity === 'major'
                          ? 'bg-grafana-orange/20 text-grafana-orange'
                          : anomaly.severity === 'warning'
                          ? 'bg-grafana-yellow/20 text-grafana-yellow'
                          : 'bg-grafana-blue/20 text-grafana-blue'
                      }`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-grafana-text mb-1">{anomaly.description}</p>
                    <p className="text-sm text-grafana-text-secondary">{anomaly.affectedZone}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
