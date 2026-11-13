"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
export function DistributionChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label={data.map((d) => `${d.name}: ${d.count}`).join(", ")}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 15, right: 10, bottom: 0, left: -20 }}
        >
          <CartesianGrid vertical={false} stroke="#edf0ef" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#65716d" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Bar
            isAnimationActive={false}
            dataKey="count"
            name="Ответов"
            fill="#477b69"
            radius={[5, 5, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {data.map((d) => (
          <div key={d.name}>
            <span>{d.name}</span>
            <strong>{d.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function ActivityChart({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
      >
        <defs>
          <linearGradient id="activity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8caf81" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#8caf81" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#edf0ef" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip />
        <Area
          isAnimationActive={false}
          dataKey="count"
          name="Ответов"
          stroke="#477b69"
          fill="url(#activity)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
