import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trendValue,
  trend,
  status = 'info'
}: MetricCardProps) {
  const getTrendColor = () => {
    if (!trend) return 'text-grafana-text-secondary';
    if (trend === 'up') return status === 'error' ? 'text-grafana-red' : 'text-grafana-green';
    if (trend === 'down') return status === 'success' ? 'text-grafana-green' : 'text-grafana-red';
    return 'text-grafana-text-secondary';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '';
  };

  return (
    <div className="bg-grafana-panel border border-grafana-border rounded hover:border-grafana-orange/50 transition-colors p-4">
      <div className="mb-3">
        <h3 className="text-xs font-normal text-grafana-text-secondary uppercase tracking-wide">
          {title}
        </h3>
      </div>

      <div className="mb-2">
        <p className="text-3xl font-normal text-grafana-text">{value}</p>
      </div>

      {(subtitle || trendValue) && (
        <div className="flex items-center gap-2 text-sm">
          {trendValue && (
            <span className={`font-normal flex items-center gap-1 ${getTrendColor()}`}>
              <span>{getTrendIcon()}</span>
              <span>{trendValue}</span>
            </span>
          )}
          {subtitle && (
            <span className="text-grafana-text-secondary text-xs">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

