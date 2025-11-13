import { useEffect, useMemo, useState } from 'react';
import { VenueData, BandLoadData, TimeSeriesData, Zone } from '../types';
import MetricCard from '../components/MetricCard';
import LineChart from '../components/LineChart';
import ZoneTable from '../components/ZoneTable';
import APTable from '../components/APTable';
import LoadChart from '../components/LoadChart';
import { timeSeriesApi } from '../lib/api';

interface VenueDashboardProps {
  venueData: VenueData;
  onZoneSelect: (zoneId: string) => void;
  loadData: BandLoadData[];
}

export default function VenueDashboard({ venueData, onZoneSelect, loadData }: VenueDashboardProps) {
  const getDomainName = (zone: Zone): string => {
    const domain = zone.domainName?.trim();
    if (domain) {
      return domain;
    }
    const name = zone.name || '';
    const [prefix] = name.split(' - ');
    return prefix.trim() || zone.name;
  };

  const domainOptions = useMemo(() => {
    const seen = new Set<string>();
    venueData.zones.forEach((zone) => {
      const domain = getDomainName(zone);
      if (domain) {
        seen.add(domain);
      }
    });
    return ['total', ...Array.from(seen).sort((a, b) => a.localeCompare(b))];
  }, [venueData.zones]);

  const [domainFilter, setDomainFilter] = useState<string>('total');

  const [experienceSeries, setExperienceSeries] = useState<TimeSeriesData[]>([]);

  useEffect(() => {
    if (domainFilter !== 'total' && !domainOptions.includes(domainFilter)) {
      setDomainFilter('total');
    }
  }, [domainFilter, domainOptions]);

  const filteredZones = useMemo(() => {
    if (domainFilter === 'total') {
      return venueData.zones;
    }
    return venueData.zones.filter(
      (zone) => getDomainName(zone) === domainFilter
    );
  }, [domainFilter, venueData.zones]);

  const zoneSummary = useMemo(() => {
    const zones = filteredZones;
    const totalZones = zones.length;
    const totalAPs = zones.reduce((sum, zone) => sum + zone.totalAPs, 0);
    const totalClients = zones.reduce((sum, zone) => sum + zone.clients, 0);
    const avgExperienceScore = totalZones
      ? zones.reduce((sum, zone) => sum + zone.experienceScore, 0) / totalZones
      : 0;
    const slaHits = zones.filter((zone) => zone.apAvailability >= 95).length;
    const slaCompliance = totalZones ? (slaHits / totalZones) * 100 : 0;
    const goodZones = zones.filter((zone) => zone.experienceScore >= 80).length;
    const fairZones = zones.filter(
      (zone) => zone.experienceScore >= 70 && zone.experienceScore < 80
    ).length;
    const poorZones = totalZones - goodZones - fairZones;
    const highUtilZones = zones.filter((zone) => zone.utilization > 70).length;
    const avgUtilization = totalZones
      ? zones.reduce((sum, zone) => sum + zone.utilization, 0) / totalZones
      : 0;

    return {
      totalZones,
      totalAPs,
      totalClients,
      avgExperienceScore,
      slaCompliance,
      goodZones,
      fairZones,
      poorZones,
      highUtilZones,
      avgUtilization,
    };
  }, [filteredZones]);

  const worstZones = useMemo(() => {
    return [...filteredZones]
      .sort((a, b) => a.experienceScore - b.experienceScore)
      .slice(0, 3);
  }, [filteredZones]);

  const zoneIds = useMemo(
    () => worstZones.map((zone) => zone.id).join(','),
    [worstZones]
  );

  const hasLoadData = useMemo(
    () => loadData.some((band) => Array.isArray(band.data) && band.data.length > 0),
    [loadData]
  );

  useEffect(() => {
    let isCancelled = false;

    async function fetchTimeSeries() {
      if (!zoneIds) {
        setExperienceSeries([]);
        return;
      }

      try {
        const experience = await timeSeriesApi.getTimeSeries({ metric: 'experienceScore', zoneIds });

        if (!isCancelled) {
          setExperienceSeries(experience as TimeSeriesData[]);
        }
      } catch (err) {
        console.error('Failed to fetch venue time series data', err);
        if (!isCancelled) {
          setExperienceSeries([]);
        }
      }
    }

    fetchTimeSeries();

    return () => {
      isCancelled = true;
    };
  }, [zoneIds]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-grafana-text">Network Overview</h2>
          <p className="text-sm text-grafana-text-secondary">
            {domainFilter === 'total'
              ? 'Aggregated venue performance across all zones.'
              : `Performance metrics for domain ${domainFilter}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            id="domain-filter"
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
            className="px-3 py-1.5 bg-grafana-bg border border-grafana-border rounded text-sm text-grafana-text focus:outline-none focus:border-grafana-blue"
          >
            {domainOptions.map((domain) => (
              <option key={domain} value={domain}>
                {domain === 'total' ? 'Total' : domain}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <MetricCard
          title="Total Access Points"
          value={zoneSummary.totalAPs.toLocaleString()}
          trendValue="0.00%"
          subtitle="vs previous 7 days"
          trend="stable"
        />


        <MetricCard
          title="Connected Clients"
          value={zoneSummary.totalClients.toLocaleString()}
          trendValue="14.90%"
          subtitle="vs previous 7 days"
          trend="down"
          status="error"
        />
      
        <MetricCard
          title="Avg Experience Score"
          value={zoneSummary.avgExperienceScore.toFixed(1)}
          trendValue="0.23%"
          subtitle="vs previous 7 days"
          trend="down"
        />

        <MetricCard
          title="SLA Compliance"
          value={`${zoneSummary.slaCompliance.toFixed(0)}%`}
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
          {experienceSeries.length > 0 ? (
            <LineChart
              data={experienceSeries}
              title=""
              valueFormatter={(v) => v.toFixed(1)}
            />
          ) : (
            <div className="bg-grafana-bg border border-dashed border-grafana-border rounded flex items-center justify-center text-xs text-grafana-text-secondary">
              No experience score trend data available.
            </div>
          )}
          {hasLoadData ? (
            <LoadChart data={loadData} title="Load" timeRange="" />
          ) : (
            <div className="bg-grafana-bg border border-dashed border-grafana-border rounded flex items-center justify-center text-xs text-grafana-text-secondary">
              No load data available.
            </div>
          )}
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
                    style={{
                      width: `${
                        zoneSummary.totalZones
                          ? (zoneSummary.goodZones / zoneSummary.totalZones) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-grafana-text w-8 text-right">
                  {zoneSummary.goodZones}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-grafana-text-secondary">Fair Performance</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2 bg-grafana-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-grafana-yellow"
                    style={{
                      width: `${
                        zoneSummary.totalZones
                          ? (zoneSummary.fairZones / zoneSummary.totalZones) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-grafana-text w-8 text-right">
                  {zoneSummary.fairZones}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-grafana-text-secondary">Needs Attention</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2 bg-grafana-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-grafana-red"
                    style={{
                      width: `${
                        zoneSummary.totalZones
                          ? (zoneSummary.poorZones / zoneSummary.totalZones) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-grafana-text w-8 text-right">
                  {zoneSummary.poorZones}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-grafana-text-secondary">High Utilization</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 h-2 bg-grafana-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-grafana-orange"
                    style={{
                      width: `${
                        zoneSummary.totalZones
                          ? (zoneSummary.highUtilZones / zoneSummary.totalZones) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-grafana-text w-8 text-right">
                  {zoneSummary.highUtilZones}
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
              <p className="text-2xl font-normal text-grafana-text">{zoneSummary.goodZones}</p>
              <p className="text-xs text-grafana-text-secondary mt-1">zones</p>
            </div>
            <div className="text-center p-3 bg-grafana-bg rounded border border-grafana-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-grafana-yellow" />
                <span className="text-xs font-medium text-grafana-text">Fair</span>
              </div>
              <p className="text-2xl font-normal text-grafana-text">{zoneSummary.fairZones}</p>
              <p className="text-xs text-grafana-text-secondary mt-1">zones</p>
            </div>
            <div className="text-center p-3 bg-grafana-bg rounded border border-grafana-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-grafana-red" />
                <span className="text-xs font-medium text-grafana-text">Poor</span>
              </div>
              <p className="text-2xl font-normal text-grafana-text">{zoneSummary.poorZones}</p>
              <p className="text-xs text-grafana-text-secondary mt-1">zones</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-grafana-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-grafana-text-secondary mb-1">Total Zones</p>
                <p className="text-lg font-normal text-grafana-text">{zoneSummary.totalZones}</p>
              </div>
              <div>
                <p className="text-xs text-grafana-text-secondary mb-1">Avg Utilization</p>
                <p className="text-lg font-normal text-grafana-text">
                  {zoneSummary.avgUtilization.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ZoneTable zones={filteredZones} onZoneSelect={(zone) => onZoneSelect(zone.id)} />

      <APTable zones={filteredZones} />
    </div>
  );
}

