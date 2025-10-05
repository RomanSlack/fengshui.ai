"use client";

import { useState } from 'react';

interface Tooltip {
  object_class: string;
  object_index: number;
  type: 'good' | 'bad' | 'neutral';
  message: string;
  coordinates: {
    bbox: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    };
    center: {
      x: number;
      y: number;
    };
  };
  confidence: number;
}

interface FengShuiVisualizationProps {
  imageUrl: string;
  tooltips: Tooltip[];
  imageWidth?: number;
  imageHeight?: number;
}

export function FengShuiVisualization({
  imageUrl,
  tooltips,
  imageWidth = 1920,
  imageHeight = 1080
}: FengShuiVisualizationProps) {
  const [hoveredTooltip, setHoveredTooltip] = useState<number | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: imageWidth, height: imageHeight });

  const getTooltipColor = (type: string) => {
    switch (type) {
      case 'good':
        return {
          border: 'border-green-500',
          bg: 'bg-green-50',
          text: 'text-green-900',
          icon: '✓',
          iconBg: 'bg-green-500'
        };
      case 'bad':
        return {
          border: 'border-red-500',
          bg: 'bg-red-50',
          text: 'text-red-900',
          icon: '✗',
          iconBg: 'bg-red-500'
        };
      default:
        return {
          border: 'border-yellow-500',
          bg: 'bg-yellow-50',
          text: 'text-yellow-900',
          icon: '!',
          iconBg: 'bg-yellow-500'
        };
    }
  };

  return (
    <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Main Image */}
      <img
        src={imageUrl}
        alt="Room"
        className="w-full h-auto"
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        }}
      />

      {/* Tooltip Overlays */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
        preserveAspectRatio="none"
      >
        {tooltips.map((tooltip, index) => {
          const colors = getTooltipColor(tooltip.type);
          const { bbox, center } = tooltip.coordinates;

          return (
            <g key={index}>
              {/* Bounding Box */}
              <rect
                x={bbox.x1}
                y={bbox.y1}
                width={bbox.width}
                height={bbox.height}
                fill="none"
                stroke={colors.border.includes('green') ? '#22c55e' : colors.border.includes('red') ? '#ef4444' : '#eab308'}
                strokeWidth="4"
                strokeDasharray={hoveredTooltip === index ? '0' : '10,5'}
                className="transition-all duration-200"
                opacity={hoveredTooltip === index ? '1' : '0.6'}
              />

              {/* Center Point Marker */}
              <circle
                cx={center.x}
                cy={center.y}
                r="8"
                fill={colors.border.includes('green') ? '#22c55e' : colors.border.includes('red') ? '#ef4444' : '#eab308'}
                className="pointer-events-auto cursor-pointer"
                onMouseEnter={() => setHoveredTooltip(index)}
                onMouseLeave={() => setHoveredTooltip(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip Cards - Positioned at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tooltips.map((tooltip, index) => {
            const colors = getTooltipColor(tooltip.type);

            return (
              <div
                key={index}
                className={`flex-shrink-0 w-72 p-3 rounded-lg border-2 ${colors.border} ${colors.bg} ${colors.text} cursor-pointer transition-all duration-200 ${
                  hoveredTooltip === index ? 'scale-105 shadow-lg' : 'opacity-90'
                }`}
                onMouseEnter={() => setHoveredTooltip(index)}
                onMouseLeave={() => setHoveredTooltip(null)}
              >
                <div className="flex items-start gap-2">
                  <div className={`flex-shrink-0 w-6 h-6 ${colors.iconBg} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                    {colors.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm capitalize">
                      {tooltip.object_class}
                    </div>
                    <div className="text-xs mt-1">
                      {tooltip.message}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
