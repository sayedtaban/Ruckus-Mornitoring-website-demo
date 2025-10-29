interface PieChartProps {
  title: string;
  data: { label: string; value: number; color: string }[];
  height?: number;
}

export default function PieChart({ title, data, height = 200 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;

  const chartSize = height - 40;
  const centerX = height / 2;
  const centerY = height / 2;
  const radius = chartSize / 2;

  return (
    <div className="bg-grafana-panel border border-grafana-border rounded p-4">
      <h3 className="text-sm font-normal text-grafana-text mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <svg width={height} height={height} className="flex-shrink-0">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;

            const x1 = centerX + radius * Math.cos((startAngle - 90) * (Math.PI / 180));
            const y1 = centerY + radius * Math.sin((startAngle - 90) * (Math.PI / 180));
            const x2 = centerX + radius * Math.cos((endAngle - 90) * (Math.PI / 180));
            const y2 = centerY + radius * Math.sin((endAngle - 90) * (Math.PI / 180));

            const largeArc = angle > 180 ? 1 : 0;

            return (
              <path
                key={index}
                d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={item.color}
                className="hover:opacity-80 transition-opacity"
              >
                <title>{item.label}: {percentage.toFixed(0)}%</title>
              </path>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-grafana-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


