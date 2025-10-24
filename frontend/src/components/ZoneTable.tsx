import { Zone } from '../types';
import { Wifi, Users, Activity, TrendingUp } from 'lucide-react';

interface ZoneTableProps {
  zones: Zone[];
  onZoneSelect?: (zone: Zone) => void;
}

export default function ZoneTable({ zones, onZoneSelect }: ZoneTableProps) {
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-grafana-green bg-grafana-green/10';
    if (value >= thresholds.warning) return 'text-grafana-yellow bg-grafana-yellow/10';
    return 'text-grafana-red bg-grafana-red/10';
  };

  return (
    <div className="bg-grafana-panel border border-grafana-border rounded overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-grafana-bg border-b border-grafana-border">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider">
                Zone Name
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider">
                <div className="flex items-center justify-center gap-2">
                  <Wifi className="w-4 h-4" />
                  APs
                </div>
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Clients
                </div>
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider">
                Clients/AP
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider">
                <div className="flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4" />
                  Availability
                </div>
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Experience
                </div>
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-grafana-text-secondary uppercase tracking-wider">
                Netflix Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grafana-border">
            {zones.map((zone) => (
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

