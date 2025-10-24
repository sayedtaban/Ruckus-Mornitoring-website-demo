import { AnomalyData } from '../types';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';

interface AnomalyListProps {
  anomalies: AnomalyData[];
  maxItems?: number;
}

export default function AnomalyList({ anomalies, maxItems = 10 }: AnomalyListProps) {
  const displayedAnomalies = anomalies.slice(0, maxItems);

  const severityConfig = {
    critical: {
      icon: XCircle,
      bgColor: 'bg-grafana-red/10',
      borderColor: 'border-grafana-red/30',
      textColor: 'text-grafana-red',
      iconColor: 'text-grafana-red',
      badgeColor: 'bg-grafana-red/20 text-grafana-red'
    },
    major: {
      icon: AlertTriangle,
      bgColor: 'bg-grafana-orange/10',
      borderColor: 'border-grafana-orange/30',
      textColor: 'text-grafana-orange',
      iconColor: 'text-grafana-orange',
      badgeColor: 'bg-grafana-orange/20 text-grafana-orange'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-grafana-yellow/10',
      borderColor: 'border-grafana-yellow/30',
      textColor: 'text-grafana-yellow',
      iconColor: 'text-grafana-yellow',
      badgeColor: 'bg-grafana-yellow/20 text-grafana-yellow'
    },
    info: {
      icon: Info,
      bgColor: 'bg-grafana-blue/10',
      borderColor: 'border-grafana-blue/30',
      textColor: 'text-grafana-blue',
      iconColor: 'text-grafana-blue',
      badgeColor: 'bg-grafana-blue/20 text-grafana-blue'
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const severityCounts = anomalies.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-grafana-panel border border-grafana-border rounded">
      <div className="p-6 border-b border-grafana-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-grafana-text">Active Anomalies</h3>
          <div className="flex items-center gap-2">
            {Object.entries(severityCounts).map(([severity, count]) => {
              const config = severityConfig[severity as keyof typeof severityConfig];
              return (
                <span
                  key={severity}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.badgeColor}`}
                >
                  {severity}: {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="divide-y divide-grafana-border">
        {displayedAnomalies.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-grafana-green/10 mb-4">
              <Info className="w-8 h-8 text-grafana-green" />
            </div>
            <p className="text-grafana-text-secondary font-medium">No active anomalies detected</p>
            <p className="text-sm text-grafana-text-secondary mt-1">All systems operating normally</p>
          </div>
        ) : (
          displayedAnomalies.map((anomaly) => {
            const config = severityConfig[anomaly.severity];
            const Icon = config.icon;

            return (
              <div
                key={anomaly.id}
                className={`p-4 hover:bg-grafana-hover transition-colors border-l-4 ${config.borderColor}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${config.badgeColor}`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-grafana-text-secondary">
                        {formatTimestamp(anomaly.timestamp)}
                      </span>
                    </div>

                    <p className={`font-medium mb-1 ${config.textColor}`}>
                      {anomaly.description}
                    </p>

                    <div className="flex items-center gap-3 text-sm text-grafana-text-secondary">
                      <span className="font-medium">{anomaly.affectedZone}</span>
                      <span className="text-grafana-text-disabled">•</span>
                      <span className="text-grafana-text-disabled">{anomaly.type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 text-sm font-medium text-grafana-text hover:bg-grafana-hover rounded-lg transition-colors">
                    Investigate
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {anomalies.length > maxItems && (
        <div className="p-4 border-t border-grafana-border bg-grafana-bg">
          <button className="w-full text-sm font-medium text-grafana-blue hover:text-grafana-blue/80 transition-colors">
            View all {anomalies.length} anomalies →
          </button>
        </div>
      )}
    </div>
  );
}

