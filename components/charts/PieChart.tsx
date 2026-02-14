"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { ChartDataItem } from "./BarChart";

const COLORS = [
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6",
  "#a855f7", "#ec4899", "#f43f5e", "#f97316", "#eab308",
  "#84cc16", "#22c55e",
];

interface PieChartProps {
  data: ChartDataItem[];
  total: number;
  donut?: boolean;
}

export default function PieChart({ data, total, donut = false }: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No data to display
      </div>
    );
  }

  const size = 200;
  const center = size / 2;
  const radius = 85;
  const innerRadius = donut ? 50 : 0;

  // Build SVG pie slices
  const slices: { path: string; color: string; item: ChartDataItem; index: number }[] = [];
  let cumulativeAngle = -90; // Start from top

  data.forEach((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;

    if (angle === 0) return;

    const startAngle = (cumulativeAngle * Math.PI) / 180;
    const endAngle = ((cumulativeAngle + angle) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArc = angle > 180 ? 1 : 0;

    let path: string;
    if (donut) {
      const ix1 = center + innerRadius * Math.cos(startAngle);
      const iy1 = center + innerRadius * Math.sin(startAngle);
      const ix2 = center + innerRadius * Math.cos(endAngle);
      const iy2 = center + innerRadius * Math.sin(endAngle);

      path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
        "Z",
      ].join(" ");
    } else {
      path = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ");
    }

    slices.push({
      path,
      color: COLORS[index % COLORS.length],
      item,
      index,
    });

    cumulativeAngle += angle;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="shrink-0"
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-lg"
        >
          {slices.map((slice) => (
            <path
              key={slice.item.id}
              d={slice.path}
              fill={slice.color}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              className="transition-opacity duration-200 cursor-pointer"
              opacity={
                hoveredIndex === null || hoveredIndex === slice.index ? 1 : 0.4
              }
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
          {donut && (
            <text
              x={center}
              y={center}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground text-2xl font-bold"
              style={{ fontSize: "24px" }}
            >
              {total}
            </text>
          )}
        </svg>
      </motion.div>

      {/* Legend */}
      <div className="flex-1 space-y-2 w-full">
        {data.map((item, index) => {
          const percentage =
            total > 0 ? Math.round((item.value / total) * 100) : 0;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                isHovered ? "bg-accent" : "hover:bg-accent/50"
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="flex-1 text-sm text-foreground truncate">
                {item.label}
              </span>
              <span className="text-sm font-medium text-foreground">
                {percentage}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({item.value})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
