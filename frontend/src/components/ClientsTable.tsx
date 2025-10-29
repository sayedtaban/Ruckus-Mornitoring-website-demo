import { ClientData, HostUsageData, OSDistributionData } from '../types';

interface ClientsTableProps {
  clients: ClientData[];
  hosts: HostUsageData[];
  osDistribution: OSDistributionData[];
}

export default function ClientsTable({ clients, hosts, osDistribution }: ClientsTableProps) {
  const formatDataUsage = (mb: number): string => {
    if (mb >= 1000) {
      return `${(mb / 1000).toFixed(1)}GB`;
    }
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-grafana-text">Clients</h2>
        <div className="flex items-center gap-2">
          <select className="bg-grafana-bg border border-grafana-border text-grafana-text text-sm px-3 py-2 rounded">
            <option>Last report</option>
            <option>Last 24h</option>
            <option>Last 7d</option>
            <option>Last 30d</option>
          </select>
          <select className="bg-grafana-bg border border-grafana-border text-grafana-text text-sm px-3 py-2 rounded">
            <option>All zones</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hosts Column */}
        <div className="bg-grafana-panel border border-grafana-border rounded p-4">
          <h3 className="text-sm font-normal text-grafana-text mb-4">Hosts</h3>
          <div className="space-y-3">
            {hosts.map((host, index) => {
              const maxUsage = Math.max(...hosts.map(h => h.dataUsage));
              const percentage = (host.dataUsage / maxUsage) * 100;
              
              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-grafana-text truncate">{host.hostname}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-grafana-bg rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-grafana-text-secondary whitespace-nowrap">
                      {formatDataUsage(host.dataUsage)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model Names and OS Distribution */}
        <div className="bg-grafana-panel border border-grafana-border rounded p-4">
          <h3 className="text-sm font-normal text-grafana-text mb-4">Model Names</h3>
          
          {/* OS Distribution Pie Chart */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative" style={{ width: '200px', height: '200px' }}>
              <svg width="200" height="200" className="transform -rotate-90">
                {(() => {
                  let currentAngle = 0;
                  const centerX = 100;
                  const centerY = 100;
                  const radius = 80;
                  const innerRadius = 50;

                  return osDistribution.map((item, index) => {
                    const percentage = item.percentage;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle += angle;

                    const x1 = centerX + radius * Math.cos((startAngle - 90) * (Math.PI / 180));
                    const y1 = centerY + radius * Math.sin((startAngle - 90) * (Math.PI / 180));
                    const x2 = centerX + radius * Math.cos((endAngle - 90) * (Math.PI / 180));
                    const y2 = centerY + radius * Math.sin((endAngle - 90) * (Math.PI / 180));

                    const x3 = centerX + innerRadius * Math.cos((startAngle - 90) * (Math.PI / 180));
                    const y3 = centerY + innerRadius * Math.sin((startAngle - 90) * (Math.PI / 180));
                    const x4 = centerX + innerRadius * Math.cos((endAngle - 90) * (Math.PI / 180));
                    const y4 = centerY + innerRadius * Math.sin((endAngle - 90) * (Math.PI / 180));

                    const largeArc = angle > 180 ? 1 : 0;

                    const pathData = [
                      `M ${centerX} ${centerY}`,
                      `L ${x3} ${y3}`,
                      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${x4} ${y4}`,
                      `L ${x2} ${y2}`,
                      `A ${radius} ${radius} 0 ${largeArc} 0 ${x1} ${y1}`,
                      'Z'
                    ].join(' ');

                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={item.color}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <title>{item.os}: {item.percentage.toFixed(2)}%</title>
                      </path>
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-grafana-text-secondary">OS</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {osDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-grafana-text-secondary">{item.os}</span>
                </div>
                <span className="text-grafana-text">{item.percentage.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Data Table */}
      <div className="bg-grafana-panel border border-grafana-border rounded">
        <div className="p-4 border-b border-grafana-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-grafana-hover rounded transition-colors">
                <svg className="w-4 h-4 text-grafana-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="p-2 hover:bg-grafana-hover rounded transition-colors">
                <svg className="w-4 h-4 text-grafana-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-grafana-text hover:bg-grafana-hover rounded transition-colors">Deauthorize</button>
              <button className="px-3 py-1.5 text-sm text-grafana-text hover:bg-grafana-hover rounded transition-colors">Block</button>
              <button className="px-3 py-1.5 text-sm text-grafana-text hover:bg-grafana-hover rounded transition-colors">Disconnect</button>
              <button className="px-3 py-1.5 text-sm text-grafana-text hover:bg-grafana-hover rounded transition-colors flex items-center gap-1">
                More <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="search"
              className="px-3 py-1.5 bg-grafana-bg border border-grafana-border text-grafana-text text-sm rounded"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-grafana-bg border-b border-grafana-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">Hostname</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">Model Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">
                  MAC Address
                  <svg className="w-3 h-3 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">WLAN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">AP Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grafana-text-secondary uppercase">AP MAC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grafana-border">
              {clients.map((client, index) => (
                <tr key={index} className="hover:bg-grafana-hover transition-colors">
                  <td className="px-4 py-3 text-sm text-grafana-text">{client.hostname.substring(0, 20)}...</td>
                  <td className="px-4 py-3 text-sm text-grafana-text-secondary">{client.modelName}</td>
                  <td className="px-4 py-3 text-sm text-grafana-text-secondary">{client.ipAddress}</td>
                  <td className="px-4 py-3 text-sm text-grafana-text">{client.macAddress}</td>
                  <td className="px-4 py-3 text-sm text-grafana-text-secondary">{client.wlan}</td>
                  <td className="px-4 py-3 text-sm text-grafana-text">{client.apName}</td>
                  <td className="px-4 py-3 text-sm text-grafana-blue">{client.apMac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


