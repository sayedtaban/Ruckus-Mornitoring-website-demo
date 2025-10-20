import { BandLoadData } from '../types';
import { useMemo } from 'react';

interface LoadChartProps {
  data: BandLoadData[];
  title?: string;
  height?: number;
  timeRange?: string;
}

export default function LoadChart({ data, title = "Load", height = 300, timeRange = "Last 1 hour" }: LoadChartProps) {
  const { chartData, maxValue, minValue } = useMemo(() => {
    const allValues = data.flatMap(band => 
      band.data.map(d => d.band24G + d.band5G + d.band6G5G)
    );
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    
    return {
      chartData: data,
      maxValue: max,
      minValue: min
    };
  }, [data]);

  const chartWidth = 800;
  const chartHeight = height;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const yScale = (value: number) => {
    const range = maxValue - minValue || 1;
    return plotHeight - ((value - minValue) / range) * plotHeight;
  };

  const timestamps = data[0]?.data.map(d => d.timestamp) || [];
  const xScale = (index: number) => (index / Math.max(timestamps.length - 1, 1)) * plotWidth;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-grafana-panel border border-grafana-border rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-normal text-grafana-text">{title}</h3>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-grafana-orange text-white text-xs font-medium rounded hover:bg-grafana-orange-light transition-colors">
            {timeRange}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          <defs>
            {chartData.map((band, idx) => {
              // Use red color for 6G/5G band gradient shadow
              const gradientColor = band.band === '6G/5G' ? '#f2495c' : band.color;
              return (
                <linearGradient key={idx} id={`gradient-${idx}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
                </linearGradient>
              );
            })}
          </defs>

          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines */}
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
                    strokeDasharray="2 2"
                  />
                  <text
                    x="-10"
                    y={y}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-xs fill-grafana-text-secondary"
                  >
                    {value.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Time axis */}
            {timestamps.map((_, idx) => {
              if (idx % Math.ceil(timestamps.length / 8) === 0) {
                return (
                  <text
                    key={idx}
                    x={xScale(idx)}
                    y={plotHeight + 25}
                    textAnchor="middle"
                    className="text-xs fill-grafana-text-secondary"
                  >
                    {formatTime(timestamps[idx])}
                  </text>
                );
              }
              return null;
            })}

            {/* Stacked area charts for 5G and 6G/5G */}
            {chartData.filter(band => band.band !== '2.4G').map((band) => {
              // Find the original index of this band to match the gradient ID
              const originalIdx = chartData.findIndex(b => b.band === band.band);
              
              const areaPoints = [
                `0,${plotHeight}`,
                ...band.data.map((point, idx) => {
                  const value = point.band5G + point.band6G5G;
                  return `${xScale(idx)},${yScale(value)}`;
                }),
                `${plotWidth},${plotHeight}`
              ].join(' ');

              return (
                <g key={band.band}>
                  <polygon
                    points={areaPoints}
                    fill={`url(#gradient-${originalIdx})`}
                  />
                </g>
              );
            })}

            {/* Line chart for 2.4G */}
            {chartData.find(band => band.band === '2.4G') && (() => {
              const band24G = chartData.find(band => band.band === '2.4G')!;
              const points = band24G.data
                .map((point, idx) => `${xScale(idx)},${yScale(point.band24G)}`)
                .join(' ');

              return (
                <g>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={band24G.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {band24G.data.map((point, idx) => (
                    <circle
                      key={idx}
                      cx={xScale(idx)}
                      cy={yScale(point.band24G)}
                      r="2"
                      fill={band24G.color}
                      className="hover:r-3 transition-all cursor-pointer"
                    >
                      <title>{`2.4G: ${point.band24G.toFixed(2)}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })()}

            {/* Axes */}
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
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-grafana-border">
        {chartData.map((band) => (
          <div key={band.band} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: band.color }}
            />
            <span className="text-sm text-grafana-text font-medium">{band.band}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

