import { useEffect, useState } from 'react';
import { Zone, TimeSeriesData, APData } from '../types';
import MetricCard from '../components/MetricCard';
import LineChart from '../components/LineChart';
import { Wifi, Users, Activity, TrendingUp, Signal, Radio } from 'lucide-react';
import { accessPointsApi, timeSeriesApi } from '../lib/api';

interface ZoneDashboardProps {
  zone: Zone;
}

export default function ZoneDashboard({ zone }: ZoneDashboardProps) {
  const [experienceSeries, setExperienceSeries] = useState<TimeSeriesData[]>([]);
  const [utilizationSeries, setUtilizationSeries] = useState<TimeSeriesData[]>([]);
  const [netflixSeries, setNetflixSeries] = useState<TimeSeriesData[]>([]);
  const [apPage, setApPage] = useState(0);
  const [apPageSize, setApPageSize] = useState(10);
  const [apData, setApData] = useState<APData | null>(null);
  const [apLoading, setApLoading] = useState(false);
  const [apError, setApError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchSeries() {
      try {
        const [experience, utilization, netflix] = await Promise.all([
          timeSeriesApi.getTimeSeries({ metric: 'experienceScore', zoneIds: zone.id }),
          timeSeriesApi.getTimeSeries({ metric: 'utilization', zoneIds: zone.id }),
          timeSeriesApi.getTimeSeries({ metric: 'netflixScore', zoneIds: zone.id })
        ]);

        if (!isCancelled) {
          setExperienceSeries(experience as TimeSeriesData[]);
          setUtilizationSeries(utilization as TimeSeriesData[]);
          setNetflixSeries(netflix as TimeSeriesData[]);
        }
      } catch (err) {
        console.error(`Failed to fetch time series data for zone ${zone.id}`, err);
        if (!isCancelled) {
          setExperienceSeries([]);
          setUtilizationSeries([]);
          setNetflixSeries([]);
        }
      }
    }

    fetchSeries();

    return () => {
      isCancelled = true;
    };
  }, [zone.id]);

  useEffect(() => {
    setApPage(0);
  }, [zone.id, apPageSize]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchAccessPoints() {
      try {
        setApLoading(true);
        setApError(null);
        const response = (await accessPointsApi.getAccessPoints(zone.id, {
          limit: apPageSize,
          offset: apPage * apPageSize,
        })) as APData;

        if (isCancelled) {
          return;
        }

        setApData(response);

        const pagination = response.pagination;
        const total = pagination?.total ?? response.total ?? 0;
        const limitUsed = pagination?.limit ?? apPageSize;
        const offsetUsed = pagination?.offset ?? apPage * apPageSize;

        if (total > 0 && offsetUsed >= total) {
          const lastPage = Math.max(Math.ceil(total / limitUsed) - 1, 0);
          if (apPage !== lastPage) {
            setApPage(lastPage);
          }
        }
      } catch (error) {
        console.error(`Failed to load access points for zone ${zone.id}`, error);
        if (!isCancelled) {
          setApError('Failed to load access point data.');
          setApData(null);
        }
      } finally {
        if (!isCancelled) {
          setApLoading(false);
        }
      }
    }

    fetchAccessPoints();

    return () => {
      isCancelled = true;
    };
  }, [zone.id, apPage, apPageSize]);

  const pagination = apData?.pagination;
  const totalAps = pagination?.total ?? apData?.total ?? 0;
  const limitUsed = pagination?.limit ?? apPageSize;
  const offsetUsed = pagination?.offset ?? apPage * apPageSize;
  const totalApPages =
    limitUsed > 0 ? Math.max(1, Math.ceil(totalAps / limitUsed)) : 1;
  const currentApPage = totalAps === 0 ? 0 : Math.floor(offsetUsed / limitUsed);
  const pagedAps = apData?.list ?? [];
  const apRangeStart = totalAps === 0 ? 0 : offsetUsed + 1;
  const apRangeEnd =
    totalAps === 0 ? 0 : Math.min(offsetUsed + pagedAps.length, totalAps);

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

      {experienceSeries.length > 0 ? (
        <LineChart
          data={experienceSeries}
          title="Experience Score Trend (24 Hours)"
          valueFormatter={(v) => v.toFixed(1)}
          showLegend={false}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-sm text-slate-500">
          No experience score time series available for this zone.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {utilizationSeries.length > 0 ? (
          <LineChart
            data={utilizationSeries}
            title="Channel Utilization (24 Hours)"
            height={250}
            valueFormatter={(v) => `${v.toFixed(1)}%`}
            showLegend={false}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-sm text-slate-500">
            No utilization time series available for this zone.
          </div>
        )}

        {netflixSeries.length > 0 ? (
          <LineChart
            data={netflixSeries}
            title="Netflix Experience (24 Hours)"
            height={250}
            valueFormatter={(v) => v.toFixed(1)}
            showLegend={false}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-sm text-slate-500">
            No Netflix score time series available for this zone.
          </div>
        )}
      </div>

      <div className="bg-black rounded-xl border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Access Points</h3>
            <p className="text-xs text-slate-400">
              Showing {apRangeStart}-{apRangeEnd} of {totalAps} APs in this zone
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>Rows per page</span>
            <select
              value={limitUsed}
              onChange={(event) => setApPageSize(Number(event.target.value))}
              className="border border-slate-600 bg-black rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <thead>
              <tr className="bg-slate-900 text-slate-300 uppercase text-xs">
                <th className="px-4 py-3 text-left font-semibold tracking-wide">Name</th>
                <th className="px-4 py-3 text-left font-semibold tracking-wide">MAC</th>
                <th className="px-4 py-3 text-left font-semibold tracking-wide">Model</th>
                <th className="px-4 py-3 text-left font-semibold tracking-wide">Status</th>
                <th className="px-4 py-3 text-right font-semibold tracking-wide">Clients</th>
                <th className="px-4 py-3 text-right font-semibold tracking-wide">Channel Util</th>
                <th className="px-4 py-3 text-right font-semibold tracking-wide">Airtime Util</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {apError && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-rose-400 text-sm">
                    {apError}
                  </td>
                </tr>
              )}
              {apLoading && !apError && pagedAps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">
                    Loading access points…
                  </td>
                </tr>
              )}
              {!apLoading && !apError && pagedAps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">
                    No access point data available for this zone.
                  </td>
                </tr>
              )}
              {pagedAps.map((ap) => (
                <tr key={ap.mac} className="hover:bg-slate-800 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{ap.name}</td>
                  <td className="px-4 py-3">{ap.mac}</td>
                  <td className="px-4 py-3">{ap.model}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ap.status === 'online'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ap.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {ap.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-200">
                    {ap.clientCount === undefined ? '—' : ap.clientCount}
                  </td>
                  <td className="px-4 py-3 text-right">{ap.channelUtilization.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right">{ap.airtimeUtilization.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <span className="text-xs text-slate-400">
            Page {totalAps === 0 ? 0 : currentApPage + 1} of {totalAps === 0 ? 0 : totalApPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-xs border border-slate-600 rounded disabled:opacity-40 hover:bg-slate-800 transition-colors text-slate-200"
              onClick={() => setApPage(Math.max(currentApPage - 1, 0))}
              disabled={currentApPage === 0 || totalAps === 0}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 text-xs border border-slate-600 rounded disabled:opacity-40 hover:bg-slate-800 transition-colors text-slate-200"
              onClick={() => setApPage(Math.min(currentApPage + 1, totalApPages - 1))}
              disabled={totalAps === 0 || currentApPage >= totalApPages - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

