"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

const data = [
  { name: "Jan", total: 1200, solved: 950 },
  { name: "Feb", total: 1100, solved: 890 },
  { name: "Mar", total: 1300, solved: 1050 },
  { name: "Apr", total: 1250, solved: 980 },
  { name: "May", total: 1400, solved: 1100 },
  { name: "Jun", total: 1600, solved: 1200 },
  { name: "Jul", total: 1500, solved: 1250 },
];

export function CrimeTrendChart() {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="var(--primary)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorTotal)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }}
          />
          <Area 
            type="monotone" 
            dataKey="solved" 
            stroke="var(--success)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorSolved)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
