import { TimeSeriesData } from '../types';
import { useMemo } from 'react';

interface LineChartProps {
  data: TimeSeriesData[];
  title: string;
  height?: number;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
}

export default function LineChart({
  data,
  title,
  height = 300,
  showLegend = true,
  valueFormatter = (v) => v.toFixed(1)
}: LineChartProps) {
  const { chartData, zones, maxValue, minValue } = useMemo(() => {
    const uniqueZones = Array.from(new Set(data.map(d => d.zone).filter(Boolean))) as string[];
    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));

    const dataByZone = uniqueZones.map(zone => ({
      zone,
      points: data.filter(d => d.zone === zone)
    }));

    return {
      chartData: dataByZone,
      zones: uniqueZones,
      maxValue: max,
      minValue: min
    };
  }, [data]);

  const zoneColors = [
    'rgb(59, 130, 246)',
    'rgb(16, 185, 129)',
    'rgb(245, 158, 11)',
    'rgb(239, 68, 68)',
    'rgb(139, 92, 246)',
    'rgb(236, 72, 153)',
    'rgb(20, 184, 166)',
    'rgb(251, 146, 60)'
  ];

  const chartWidth = 800;
  const chartHeight = height;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const yScale = (value: number) => {
    const range = maxValue - minValue || 1;
    return plotHeight - ((value - minValue) / range) * plotHeight;
  };

  const timestamps = chartData[0]?.points.map(p => p.timestamp) || [];
  const xScale = (index: number) => (index / Math.max(timestamps.length - 1, 1)) * plotWidth;

  return (
    <div className="bg-grafana-panel border border-grafana-border rounded p-4">
      <h3 className="text-sm font-normal text-grafana-text mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          <defs>
            {chartData.map((_, idx) => (
              <linearGradient key={idx} id={`gradient-${idx}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={zoneColors[idx % zoneColors.length]} stopOpacity="0.2" />
                <stop offset="100%" stopColor={zoneColors[idx % zoneColors.length]} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          <g transform={`translate(${padding.left}, ${padding.top})`}>
            <line
              x1="0"
              y1={plotHeight}
              x2={plotWidth}
              y2={plotHeight}
              stroke="#333333"
              strokeWidth="2"
            />

            <line
              x1="0"
              y1="0"
              x2="0"
              y2={plotHeight}
              stroke="#333333"
              strokeWidth="2"
            />

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = plotHeight * ratio;
              const value = maxValue - (maxValue - minValue) * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1="0"
                    y1={y}
                    x2={plotWidth}
                    y2={y}
                    stroke="#2a2a2a"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="-10"
                    y={y}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-xs fill-grafana-text-secondary"
                  >
                    {valueFormatter(value)}
                  </text>
                </g>
              );
            })}

            {chartData.map((zoneData, zoneIdx) => {
              const points = zoneData.points
                .map((point, idx) => `${xScale(idx)},${yScale(point.value)}`)
                .join(' ');

              const areaPoints = [
                `0,${plotHeight}`,
                ...zoneData.points.map((point, idx) => `${xScale(idx)},${yScale(point.value)}`),
                `${plotWidth},${plotHeight}`
              ].join(' ');

              return (
                <g key={zoneData.zone}>
                  <polygon
                    points={areaPoints}
                    fill={`url(#gradient-${zoneIdx})`}
                  />
                  <polyline
                    points={points}
                    fill="none"
                    stroke={zoneColors[zoneIdx % zoneColors.length]}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {zoneData.points.map((point, idx) => (
                    <circle
                      key={idx}
                      cx={xScale(idx)}
                      cy={yScale(point.value)}
                      r="3"
                      fill={zoneColors[zoneIdx % zoneColors.length]}
                      className="hover:r-5 transition-all cursor-pointer"
                    >
                      <title>{`${zoneData.zone}: ${valueFormatter(point.value)}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })}

            {timestamps.map((_, idx) => {
              if (idx % Math.ceil(timestamps.length / 6) === 0) {
                const date = new Date(timestamps[idx]);
                const label = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return (
                  <text
                    key={idx}
                    x={xScale(idx)}
                    y={plotHeight + 25}
                    textAnchor="middle"
                    className="text-xs fill-grafana-text-secondary"
                  >
                    {label}
                  </text>
                );
              }
              return null;
            })}
          </g>
        </svg>
      </div>

      {showLegend && zones.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-grafana-border">
          {zones.slice(0, 3).map((zone, idx) => (
            <div key={zone} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: zoneColors[idx % zoneColors.length] }}
              />
              <span className="text-sm text-grafana-text font-medium">{zone}</span>
            </div>
          ))}
          {zones.length > 3 && (
            <span className="text-sm text-grafana-text-secondary">+{zones.length - 3} more</span>
          )}
        </div>
      )}
    </div>
  );
}
