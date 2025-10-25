import { useMemo } from 'react';
import { Zone } from '../types';
import MetricCard from '../components/MetricCard';
import LineChart from '../components/LineChart';
import { Wifi, Users, Activity, TrendingUp, Signal, Radio } from 'lucide-react';
import { generateTimeSeriesData } from '../utils/dataGenerator';

interface ZoneDashboardProps {
  zone: Zone;
}

export default function ZoneDashboard({ zone }: ZoneDashboardProps) {
  const timeSeriesData = useMemo(() => {
    return {
      experience: generateTimeSeriesData(24, [zone], 'experienceScore'),
      utilization: generateTimeSeriesData(24, [zone], 'utilization'),
      clients: generateTimeSeriesData(24, [zone], 'clients'),
      netflix: generateTimeSeriesData(24, [zone], 'netflixScore')
    };
  }, [zone]);

  const getStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'success';
    if (value >= thresholds.warning) return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{zone.name}</h2>
        <p className="text-slate-600">Detailed zone performance and health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="AP Availability"
          value={`${zone.apAvailability.toFixed(1)}%`}
          subtitle={`${zone.connectedAPs} / ${zone.totalAPs} APs online`}
          icon={Wifi}
          status={getStatus(zone.apAvailability, { good: 95, warning: 90 })}
          trend="stable"
        />

        <MetricCard
          title="Connected Clients"
          value={zone.clients}
          subtitle={`${zone.clientsPerAP.toFixed(2)} clients per AP`}
          icon={Users}
          status={zone.clientsPerAP > 4 ? 'warning' : 'success'}
        />

        <MetricCard
          title="Experience Score"
          value={zone.experienceScore.toFixed(1)}
          subtitle="Overall network quality"
          icon={TrendingUp}
          status={getStatus(zone.experienceScore, { good: 80, warning: 70 })}
        />

        <MetricCard
          title="Channel Utilization"
          value={`${zone.utilization.toFixed(1)}%`}
          subtitle="Average across all radios"
          icon={Activity}
          status={zone.utilization > 70 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">RF Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Signal className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-700">RxDesense</span>
              </div>
              <span className={`text-lg font-bold ${
                zone.rxDesense > 10 ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {zone.rxDesense.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-700">Channel Utilization</span>
              </div>
              <span className={`text-lg font-bold ${
                zone.utilization > 70 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {zone.utilization.toFixed(1)}%
              </span>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>RF Recommendation:</strong> {
                  zone.rxDesense > 10
                    ? 'High interference detected. Consider adjusting channel or power settings.'
                    : 'RF environment is healthy. No immediate action required.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Capacity Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Client Density</span>
                <span className="font-semibold text-slate-900">
                  {zone.clientsPerAP.toFixed(2)} / 3.0 recommended
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    zone.clientsPerAP > 4
                      ? 'bg-red-500'
                      : zone.clientsPerAP > 3
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min((zone.clientsPerAP / 5) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">AP Utilization</span>
                <span className="font-semibold text-slate-900">
                  {((zone.connectedAPs / zone.totalAPs) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(zone.connectedAPs / zone.totalAPs) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Capacity Status:</strong> {
                  zone.clientsPerAP > 4
                    ? 'Consider adding APs to reduce client density'
                    : 'Capacity is within acceptable range'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <LineChart
        data={timeSeriesData.experience}
        title="Experience Score Trend (24 Hours)"
        valueFormatter={(v) => v.toFixed(1)}
        showLegend={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          data={timeSeriesData.utilization}
          title="Channel Utilization (24 Hours)"
          height={250}
          valueFormatter={(v) => `${v.toFixed(1)}%`}
          showLegend={false}
        />

        <LineChart
          data={timeSeriesData.clients}
          title="Connected Clients (24 Hours)"
          height={250}
          valueFormatter={(v) => Math.round(v).toString()}
          showLegend={false}
        />
      </div>
    </div>
  );
}

