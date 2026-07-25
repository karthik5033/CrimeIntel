"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

interface RiskGaugeProps {
  score: number;
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getRiskDetails = (val: number) => {
    if (val >= 80) return { color: "text-destructive", stroke: "stroke-destructive", label: "High Risk", icon: ShieldAlert };
    if (val >= 50) return { color: "text-warning", stroke: "stroke-warning", label: "Medium Risk", icon: Shield };
    return { color: "text-success", stroke: "stroke-success", label: "Low Risk", icon: ShieldCheck };
  };

  const { color, stroke, label, icon: Icon } = getRiskDetails(score);

  // SVG Gauge Calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-muted fill-transparent"
            strokeWidth="8"
          />
          {/* Animated Value Circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className={`${stroke} fill-transparent transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`w-6 h-6 mb-1 ${color}`} />
          <span className={`text-3xl font-bold ${color}`}>
            {Math.round(animatedScore)}
          </span>
        </div>
      </div>
      <div className={`mt-2 font-semibold ${color}`}>{label}</div>
      <div className="text-xs text-muted-foreground mt-1">Calculated from AI models</div>
    </div>
  );
}
