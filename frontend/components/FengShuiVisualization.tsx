"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

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
        <Image
          src={imageUrl}
          alt="Room"
          width={1200}
          height={800}
          className="w-full h-auto rounded-lg"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          }}
          unoptimized
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
                  onMouseEnter={() => setClickedTooltip(index)}
                  onMouseLeave={() => setClickedTooltip(null)}
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
                {isActive && (() => {
                  // Smart positioning: try below first, then above if cut off, then closer to icon
                  const tooltipWidth = 400;
                  const tooltipMaxHeight = 300;
                  const padding = 15;

                  // Calculate if tooltip fits below the bbox
                  const fitsBelow = bbox.y2 + tooltipMaxHeight + padding < imageDimensions.height;
                  const fitsAbove = bbox.y1 - tooltipMaxHeight - padding > 0;

                  // Position Y: prefer below, then above, then next to icon
                  let yPos;
                  if (fitsBelow) {
                    yPos = bbox.y2 + padding;
                  } else if (fitsAbove) {
                    yPos = bbox.y1 - tooltipMaxHeight - padding;
                  } else {
                    // Place near icon center if neither fits
                    yPos = Math.max(padding, Math.min(center.y - 50, imageDimensions.height - tooltipMaxHeight - padding));
                  }

                  // Position X: center on object, but keep within bounds
                  const xPos = Math.max(padding, Math.min(center.x - tooltipWidth / 2, imageDimensions.width - tooltipWidth - padding));

                  return (
                    <foreignObject
                      x={xPos}
                      y={yPos}
                      width={tooltipWidth}
                      height={tooltipMaxHeight}
                      className="pointer-events-auto"
                    >
                      <div
                        className={`max-h-full overflow-y-auto p-6 rounded-xl shadow-2xl border-3 ${colors.cardBorder} ${colors.cardBg} ${colors.cardText} backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent`}
                        onMouseEnter={() => setClickedTooltip(index)}
                        onMouseLeave={() => setClickedTooltip(null)}
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#9ca3af transparent'
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-11 h-11 ${colors.iconBg} text-white rounded-full flex items-center justify-center font-bold text-xl`}>
                            {colors.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xl capitalize mb-2">
                              {tooltip.object_class}
                            </div>
                            <div className="text-lg leading-relaxed">
                              {tooltip.message}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setClickedTooltip(null);
                            }}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-xl"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </foreignObject>
                  );
                })()}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend at bottom */}
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
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
        <div className="ml-auto text-sm text-gray-500 font-medium">
          💡 Hover or click the info icons to see details
        </div>
      </div>
    </div>
  );
}
