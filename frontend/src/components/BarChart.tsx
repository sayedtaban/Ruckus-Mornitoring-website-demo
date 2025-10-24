import { CauseCodeData } from '../types';

interface BarChartProps {
  data: CauseCodeData[];
  title: string;
  highlightCode?: number;
}

export default function BarChart({ data, title, highlightCode = 25 }: BarChartProps) {
  const maxCount = Math.max(...data.map(d => d.count));
  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="bg-grafana-panel border border-grafana-border rounded p-6">
      <h3 className="text-lg font-semibold text-grafana-text mb-6">{title}</h3>

      <div className="space-y-4">
        {sortedData.map((item) => {
          const isHighlighted = item.code === highlightCode;
          const percentage = (item.count / maxCount) * 100;

          return (
            <div key={item.code} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm ${
                    isHighlighted
                      ? 'bg-grafana-red/20 text-grafana-red ring-2 ring-grafana-red/30'
                      : 'bg-grafana-bg text-grafana-text-secondary'
                  }`}>
                    {item.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isHighlighted ? 'text-grafana-text' : 'text-grafana-text'
                    }`}>
                      {item.description}
                    </p>
                    {isHighlighted && (
                      <p className="text-xs text-grafana-red mt-0.5">High impact on streaming</p>
                    )}
                  </div>
                </div>
                <span className={`text-lg font-bold ml-4 ${
                  isHighlighted ? 'text-grafana-red' : 'text-grafana-text'
                }`}>
                  {item.count}
                </span>
              </div>

              <div className="relative h-8 bg-grafana-bg rounded-lg overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${
                    isHighlighted
                      ? 'bg-gradient-to-r from-grafana-red to-grafana-red/80'
                      : 'bg-gradient-to-r from-grafana-blue to-grafana-blue/80'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-semibold text-white drop-shadow-sm">
                    {percentage.toFixed(0)}% of max
                  </span>
                </div>
              </div>

              {isHighlighted && (
                <div className="mt-2 flex items-center gap-2 px-2">
                  <div className="flex-1 h-1 bg-gradient-to-r from-grafana-yellow via-grafana-orange to-grafana-red rounded-full" />
                  <span className="text-xs font-semibold text-grafana-red">
                    Impact Score: {item.impactScore}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-grafana-border">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-grafana-red" />
            <span className="text-grafana-text-secondary">Code {highlightCode}: QoS-related disconnects</span>
          </div>
          <span className="text-grafana-text-secondary">
            Total Events: {data.reduce((sum, d) => sum + d.count, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

