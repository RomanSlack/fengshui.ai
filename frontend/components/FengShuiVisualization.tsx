"use client";

import { useState, useRef, useEffect } from 'react';

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
  const [clickedTooltip, setClickedTooltip] = useState<number | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: imageWidth, height: imageHeight });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setClickedTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTooltipColor = (type: string) => {
    switch (type) {
      case 'good':
        return {
          stroke: '#22c55e',
          fill: 'rgba(34, 197, 94, 0.1)',
          iconBg: 'bg-green-500',
          cardBg: 'bg-green-50',
          cardBorder: 'border-green-500',
          cardText: 'text-green-900',
          icon: '✓'
        };
      case 'bad':
        return {
          stroke: '#ef4444',
          fill: 'rgba(239, 68, 68, 0.1)',
          iconBg: 'bg-red-500',
          cardBg: 'bg-red-50',
          cardBorder: 'border-red-500',
          cardText: 'text-red-900',
          icon: '✗'
        };
      default:
        return {
          stroke: '#eab308',
          fill: 'rgba(234, 179, 8, 0.1)',
          iconBg: 'bg-yellow-500',
          cardBg: 'bg-yellow-50',
          cardBorder: 'border-yellow-500',
          cardText: 'text-yellow-900',
          icon: '!'
        };
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Main Image - Larger */}
      <div className="relative">
        <img
          src={imageUrl}
          alt="Room"
          className="w-full h-auto rounded-lg"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />

        {/* Tooltip Overlays - Transparent until clicked */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
          preserveAspectRatio="none"
        >
          {tooltips.map((tooltip, index) => {
            const colors = getTooltipColor(tooltip.type);
            const { bbox, center } = tooltip.coordinates;
            const isActive = clickedTooltip === index;

            return (
              <g key={index}>
                {/* Bounding Box - only show when clicked */}
                {isActive && (
                  <rect
                    x={bbox.x1}
                    y={bbox.y1}
                    width={bbox.width}
                    height={bbox.height}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="6"
                    className="transition-all duration-300"
                    rx="8"
                  />
                )}

                {/* Info Icon Button - Always visible */}
                <g
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClickedTooltip(clickedTooltip === index ? null : index);
                  }}
                >
                  {/* Icon background circle */}
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r="20"
                    fill="white"
                    opacity="0.95"
                    className="transition-all duration-200"
                  />
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r="16"
                    fill={colors.stroke}
                    className="transition-all duration-200"
                  />

                  {/* Info "i" icon */}
                  <text
                    x={center.x}
                    y={center.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize="20"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    i
                  </text>

                  {/* Pulse animation for emphasis */}
                  {!isActive && (
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r="20"
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="2"
                      opacity="0.5"
                      className="animate-ping"
                    />
                  )}
                </g>

                {/* Tooltip Card - Positioned near object */}
                {isActive && (
                  <foreignObject
                    x={Math.max(10, Math.min(bbox.x1, imageDimensions.width - 320))}
                    y={Math.max(10, bbox.y2 + 10)}
                    width="300"
                    height="150"
                    className="pointer-events-auto"
                  >
                    <div className={`p-4 rounded-lg shadow-2xl border-2 ${colors.cardBorder} ${colors.cardBg} ${colors.cardText} backdrop-blur-sm`}>
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 w-8 h-8 ${colors.iconBg} text-white rounded-full flex items-center justify-center font-bold`}>
                          {colors.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm capitalize mb-1">
                            {tooltip.object_class}
                          </div>
                          <div className="text-xs leading-relaxed">
                            {tooltip.message}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClickedTooltip(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend at bottom */}
      <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Good Feng Shui</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Needs Attention</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Can Improve</span>
        </div>
        <div className="ml-auto text-xs text-gray-400">
          💡 Click the info icons to see details
        </div>
      </div>
    </div>
  );
}
