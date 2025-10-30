import { useMemo } from 'react';
import { VenueData, BandLoadData } from '../types';
import MetricCard from '../components/MetricCard';
import LineChart from '../components/LineChart';
import ZoneTable from '../components/ZoneTable';
import APTable from '../components/APTable';
import PieChart from '../components/PieChart';
import LoadChart from '../components/LoadChart';
import { generateTimeSeriesData } from '../utils/dataGenerator';

interface VenueDashboardProps {
  venueData: VenueData;
  onZoneSelect: (zoneId: string) => void;
  loadData: BandLoadData[];
}

export default function VenueDashboard({ venueData, onZoneSelect, loadData }: VenueDashboardProps) {
  const worstZones = useMemo(() => {
    return [...venueData.zones]
      .sort((a, b) => a.experienceScore - b.experienceScore)
      .slice(0, 3);
  }, [venueData.zones]);

  const timeSeriesData = useMemo(() => {
    return {
      experience: generateTimeSeriesData(24, worstZones, 'experienceScore'),
      utilization: generateTimeSeriesData(24, worstZones, 'utilization')
    };
  }, [worstZones]);

  // Generate summary statistics
  const summaryStats = useMemo(() => {
    const laptopPercentage = 29;
    const phonePercentage = 24;
    const otherPercentage = 100 - laptopPercentage - phonePercentage;

    const onlineAPs = venueData.zones.reduce((sum, z) => sum + z.connectedAPs, 0);
    const offlineAPs = venueData.zones.reduce((sum, z) => sum + z.disconnectedAPs, 0);
    const totalAPs = onlineAPs + offlineAPs;
    const onlinePercentage = (onlineAPs / totalAPs) * 100;
    const offlinePercentage = (offlineAPs / totalAPs) * 100;

    const ghz5Percentage = 56;
    const ghz24Percentage = 37;

    return {
      laptops: laptopPercentage,
      phones: phonePercentage,
      other: otherPercentage,
      onlineAPs: onlinePercentage,
      offlineAPs: offlinePercentage,
      ghz5: ghz5Percentage,
      ghz24: ghz24Percentage
    };
  }, [venueData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Access Points"
          value={venueData.totalAPs}
          trendValue="0.00%"
          subtitle="vs previous 7 days"
          trend="stable"
        />

        <MetricCard
          title="Connected Clients"
          value={venueData.totalClients.toLocaleString()}
          trendValue="14.90%"
          subtitle="vs previous 7 days"
          trend="down"
          status="error"
        />

        <MetricCard
          title="Avg Experience Score"
          value={venueData.avgExperienceScore.toFixed(1)}
          trendValue="0.23%"
          subtitle="vs previous 7 days"
          trend="down"
        />

        <MetricCard
          title="SLA Compliance"
          value={`${venueData.slaCompliance.toFixed(0)}%`}
          trendValue="2.1%"
          subtitle="vs previous 7 days"
          trend="up"
        />
      </div>

      <div className="bg-grafana-panel border border-grafana-border rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-normal text-grafana-text">Network Performance Trends</h3>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-grafana-orange text-white text-xs font-medium rounded hover:bg-grafana-orange-light transition-colors">
              Last 24h
            </button>
            <button className="px-3 py-1 bg-grafana-bg text-grafana-text-secondary text-xs font-medium rounded hover:bg-grafana-hover hover:text-grafana-text transition-colors">
              Last 7d
            </button>
            <button className="px-3 py-1 bg-grafana-bg text-grafana-text-secondary text-xs font-medium rounded hover:bg-grafana-hover hover:text-grafana-text transition-colors">
              Last 30d
            </button>
          </div>
        </div>
        <div className="h-124 grid grid-cols-2 gap-4">
          <LineChart
            data={timeSeriesData.experience}
            title=""
            valueFormatter={(v) => v.toFixed(1)}
          />
          <LoadChart data={loadData} title="Load" timeRange="" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-grafana-panel border border-grafana-border rounded p-4">
          <h3 className="text-sm font-normal text-grafana-text mb-4">Zone Health Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-grafana-text-secondary">Optimal Performance</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2 bg-grafana-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-grafana-green"
                    style={{ width: `${(venueData.zones.filter(z => z.experienceScore >= 80).length / venueData.totalZones) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-grafana-text w-8 text-right">
                  {venueData.zones.filter(z => z.experienceScore >= 80).length}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-grafana-text-secondary">Fair Performance</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2 bg-grafana-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-grafana-yellow"
                    style={{ width: `${(venueData.zones.filter(z => z.experienceScore >= 70 && z.experienceScore < 80).length / venueData.totalZones) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-grafana-text w-8 text-right">
                  {venueData.zones.filter(z => z.experienceScore >= 70 && z.experienceScore < 80).length}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-grafana-text-secondary">Needs Attention</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2 bg-grafana-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-grafana-red"
                    style={{ width: `${(venueData.zones.filter(z => z.experienceScore < 70).length / venueData.totalZones) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-grafana-text w-8 text-right">
                  {venueData.zones.filter(z => z.experienceScore < 70).length}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-grafana-text-secondary">High Utilization</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2 bg-grafana-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-grafana-orange"
                    style={{ width: `${(venueData.zones.filter(z => z.utilization > 70).length / venueData.totalZones) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-grafana-text w-8 text-right">
                  {venueData.zones.filter(z => z.utilization > 70).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-grafana-panel border border-grafana-border rounded p-4">
          <h3 className="text-sm font-normal text-grafana-text mb-4">Zone Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-grafana-bg rounded border border-grafana-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-grafana-green" />
                <span className="text-xs font-medium text-grafana-text">Good</span>
              </div>
              <p className="text-2xl font-normal text-grafana-text">{venueData.zones.filter(z => z.experienceScore >= 80).length}</p>
              <p className="text-xs text-grafana-text-secondary mt-1">zones</p>
            </div>
            <div className="text-center p-3 bg-grafana-bg rounded border border-grafana-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-grafana-yellow" />
                <span className="text-xs font-medium text-grafana-text">Fair</span>
              </div>
              <p className="text-2xl font-normal text-grafana-text">{venueData.zones.filter(z => z.experienceScore >= 70 && z.experienceScore < 80).length}</p>
              <p className="text-xs text-grafana-text-secondary mt-1">zones</p>
            </div>
            <div className="text-center p-3 bg-grafana-bg rounded border border-grafana-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-grafana-red" />
                <span className="text-xs font-medium text-grafana-text">Poor</span>
              </div>
              <p className="text-2xl font-normal text-grafana-text">{venueData.zones.filter(z => z.experienceScore < 70).length}</p>
              <p className="text-xs text-grafana-text-secondary mt-1">zones</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-grafana-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-grafana-text-secondary mb-1">Total Zones</p>
                <p className="text-lg font-normal text-grafana-text">{venueData.totalZones}</p>
              </div>
              <div>
                <p className="text-xs text-grafana-text-secondary mb-1">Avg Utilization</p>
                <p className="text-lg font-normal text-grafana-text">
                  {(venueData.zones.reduce((sum, z) => sum + z.utilization, 0) / venueData.zones.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ZoneTable zones={venueData.zones} onZoneSelect={(zone) => onZoneSelect(zone.id)} />

      <APTable zones={venueData.zones} />
    </div>
  );
}

