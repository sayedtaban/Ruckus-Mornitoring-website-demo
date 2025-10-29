import { Zone } from '../types';

interface APTableProps {
  zones: Zone[];
}

export default function APTable({ zones }: APTableProps) {
  // Get top 3 worst zones by experience score
  const top3WorstZones = [...zones]
    .sort((a, b) => a.experienceScore - b.experienceScore)
    .slice(0, 3);

  return (
    <div className="bg-grafana-panel border border-grafana-border rounded p-4">
      <h3 className="text-sm font-normal text-grafana-text mb-4">Access Points - Top 3 Worst Zones</h3>

      <div className="space-y-6">
        {top3WorstZones.map((zone) => {
          const badgeColor = 
            zone.experienceScore >= 80 ? 'bg-grafana-green/20 text-grafana-green border-grafana-green/30' :
            zone.experienceScore >= 70 ? 'bg-grafana-yellow/20 text-grafana-yellow border-grafana-yellow/30' :
            'bg-grafana-red/20 text-grafana-red border-grafana-red/30';

          return (
            <div key={zone.id} className="border-b border-grafana-border pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-base font-medium text-grafana-text">{zone.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${badgeColor}`}>
                    {zone.experienceScore.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {/* Location */}
                <div>
                  <p className="text-xs text-grafana-text-secondary mb-2">Location</p>
                  <p className="text-sm text-grafana-text">{zone.name}</p>
                </div>

                {/* Connected Clients */}
                <div>
                  <p className="text-xs text-grafana-text-secondary mb-2">Connected Clients</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex flex-wrap gap-1">
                      {zone.apData?.list.slice(0, 3).map((ap, idx) => (
                        <div key={ap.mac} className="flex items-center gap-1 text-xs text-grafana-text">
                          <div className="w-2 h-2 rounded-full bg-grafana-blue" />
                          <span>{ap.name}: {ap.clientCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Busy APs */}
                <div>
                  <p className="text-xs text-grafana-text-secondary mb-2">Top Busy APs</p>
                  <div className="space-y-1">
                    {zone.apData?.list
                      .sort((a, b) => b.clientCount - a.clientCount)
                      .slice(0, 3)
                      .map((ap) => (
                        <div key={ap.mac} className="flex items-center gap-2">
                          <div className="text-xs text-grafana-text">{ap.name}</div>
                          <div className="flex-1 h-2 bg-grafana-bg rounded">
                            <div 
                              className="h-full bg-grafana-blue rounded"
                              style={{ width: `${(ap.clientCount / Math.max(...(zone.apData?.list.map(a => a.clientCount) || [1]))) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Traffic Volume */}
                <div>
                  <p className="text-xs text-grafana-text-secondary mb-2">Traffic Volume</p>
                  <div className="text-sm text-grafana-text">
                    {(zone.clients * 2.5).toFixed(1)} Mbps
                  </div>
                </div>

                {/* Roaming Issues */}
                <div>
                  <p className="text-xs text-grafana-text-secondary mb-2">Roaming Issues</p>
                  <div className="space-y-1">
                    <span className="text-sm text-grafana-red">{zone.utilization.toFixed(0)}%</span>
                    <br />
                    <span className="text-sm text-grafana-yellow">{(zone.utilization * 1.1).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


