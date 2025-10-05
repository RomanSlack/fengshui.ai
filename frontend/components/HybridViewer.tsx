'use client';

import { useState, useEffect } from 'react';
import { FengShuiVisualization } from './FengShuiVisualization';
import dynamic from 'next/dynamic';

const ModelViewer3DWithTooltips = dynamic(() => import('./ModelViewer3DWithTooltips'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-white">Loading 3D viewer...</div>
    </div>
  ),
});

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

interface HybridViewerProps {
  imageUrl: string;
  tooltips: Tooltip[];
  modelId: string | null;
  imageWidth?: number;
  imageHeight?: number;
}

type ViewMode = '2D' | '3D';

export default function HybridViewer({
  imageUrl,
  tooltips,
  modelId,
  imageWidth = 1920,
  imageHeight = 1080
}: HybridViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [fadeIn, setFadeIn] = useState(false);
  const [modelStatus, setModelStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fade in on mount
  useEffect(() => {
    setFadeIn(true);
  }, []);

  // Load static demo model (no polling needed)
  useEffect(() => {
    if (!modelId) {
      return;
    }

    // Simulate a brief loading period for realistic UX
    setModelStatus('processing');

    const loadTimer = setTimeout(() => {
      // GitHub raw content URL - CORS-friendly direct download
      const externalModelUrl = 'https://raw.githubusercontent.com/RomanSlack/fengshui.ai/demo/frontend/public/demo/model.fbx';

      setModelUrl(externalModelUrl);
      setModelStatus('completed');
    }, 2000); // 2 second simulated processing

    return () => {
      clearTimeout(loadTimer);
    };
  }, [modelId]);

  const handleViewModeChange = (mode: ViewMode) => {
    // Fade out transition
    setFadeIn(false);
    setTimeout(() => {
      setViewMode(mode);
      setFadeIn(true);
    }, 500);
  };

  const is3DAvailable = modelStatus === 'completed' && modelUrl;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-gray-200">
      {/* Header with mode toggle */}
      <div className="mb-8 space-y-4">
        <h3 className="text-2xl font-serif font-light text-zen-pine mb-2 tracking-calm">
          {viewMode === '2D' ? 'Interactive Energy Map' : '3D Room Visualization'}
        </h3>
        <p className="text-zen-earth font-light">
          {viewMode === '2D'
            ? 'Hover over the icons to explore specific insights about each element in your space'
            : 'Explore your room in 3D space with interactive feng shui insights'}
        </p>

        {/* Mode Toggle Buttons - Hide 3D for demo if model unavailable */}
        <div className="flex gap-3 items-center">
          <button
            onClick={() => handleViewModeChange('2D')}
            className={`px-8 py-3 rounded-full font-light tracking-calm transition-all duration-500 ease-out ${
              viewMode === '2D'
                ? 'bg-zen-sage text-white shadow-lg scale-105'
                : 'bg-white/80 text-zen-earth border-2 border-gray-300 hover:border-zen-sage'
            }`}
          >
            2D View
          </button>
          {modelId && (
            <button
              onClick={() => handleViewModeChange('3D')}
              disabled={!is3DAvailable}
              className={`px-8 py-3 rounded-full font-light tracking-calm transition-all duration-500 ease-out ${
                viewMode === '3D' && is3DAvailable
                  ? 'bg-zen-sage text-white shadow-lg scale-105'
                  : 'bg-white/80 text-zen-earth border-2 border-gray-300 hover:border-zen-sage disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300'
              }`}
            >
              3D View
            </button>
          )}

          {/* Status indicator */}
          {modelId && !is3DAvailable && (
            <div className="flex items-center gap-2 ml-auto">
              {modelStatus === 'pending' && (
                <p className="text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Initializing 3D...
                </p>
              )}
              {modelStatus === 'processing' && (
                <p className="text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Generating 3D model...
                </p>
              )}
              {modelStatus === 'failed' && (
                <p className="text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                  ✗ 3D generation failed
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content area with fade transition */}
      <div className={`transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {viewMode === '2D' ? (
          <FengShuiVisualization
            imageUrl={imageUrl}
            tooltips={tooltips}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        ) : (
          <div className="w-full h-[600px] rounded-xl overflow-hidden bg-gray-900 relative">
            {modelStatus === 'pending' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-zen-sage/20 border-t-zen-sage mb-4"></div>
                <p className="text-lg font-light">Initializing 3D generation...</p>
                <p className="text-sm text-gray-400 font-light mt-2">This may take a moment</p>
              </div>
            )}

            {modelStatus === 'processing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-zen-sage/20 border-t-zen-sage mb-4"></div>
                <p className="text-lg font-light">Generating 3D model...</p>
                <p className="text-sm text-gray-400 font-light mt-2">Processing depth information (~10-15 seconds)</p>
              </div>
            )}

            {modelStatus === 'failed' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-light">3D Generation Failed</p>
                <p className="text-sm text-gray-400 font-light mt-2">{error || 'An error occurred during generation'}</p>
              </div>
            )}

            {modelStatus === 'completed' && modelUrl && (
              <ModelViewer3DWithTooltips
                modelUrl={modelUrl}
                tooltips={tooltips}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
              />
            )}
          </div>
        )}
      </div>

      {/* Download button for 3D model */}
      {viewMode === '3D' && modelStatus === 'completed' && modelUrl && (
        <div className="mt-6 flex justify-end">
          <a
            href={modelUrl}
            download
            className="px-6 py-3 bg-zen-pine text-white rounded-full hover:bg-zen-pine/90 transition-all duration-500 ease-out shadow-lg hover:scale-105 font-light tracking-calm"
          >
            Download 3D Model (FBX)
          </a>
        </div>
      )}

      {/* Tip for pending/processing state */}
      {viewMode === '2D' && modelId && !is3DAvailable && modelStatus !== 'failed' && (
        <div className="mt-6 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 font-light">
            💡 <strong className="font-medium">Tip:</strong> Your 3D model is being generated in the background. Switch to 3D view once it&apos;s ready to explore your room in three dimensions!
          </p>
        </div>
      )}
    </div>
  );
}
