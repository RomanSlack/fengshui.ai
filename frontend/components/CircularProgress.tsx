"use client";

interface CircularProgressProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({
  score,
  maxScore = 10,
  size = 200,
  strokeWidth = 12
}: CircularProgressProps) {
  const percentage = (score / maxScore) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (score >= 8) return '#22c55e'; // green
    if (score >= 6) return '#eab308'; // yellow
    if (score >= 4) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getLabel = () => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold" style={{ color: getColor() }}>
            {score}
          </div>
          <div className="text-gray-400 text-sm">/ {maxScore}</div>
        </div>
      </div>

      {/* Label */}
      <div
        className="mt-4 text-lg font-semibold"
        style={{ color: getColor() }}
      >
        {getLabel()}
      </div>
    </div>
  );
}
