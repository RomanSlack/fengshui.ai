'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-white">Loading 3D viewer...</div>
    </div>
  ),
});

interface Embedded3DViewerProps {
  modelId: string | null;
}

export default function Embedded3DViewer({ modelId }: Embedded3DViewerProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Default viewer settings (simplified - no controls for embedded view)
  const [ambientIntensity] = useState(0.4);
  const [keyLightIntensity] = useState(1.5);
  const [fillLightIntensity] = useState(0.5);
  const [backLightIntensity] = useState(0.8);
  const [materialRoughness] = useState(0.5);
  const [materialMetalness] = useState(0);
  const [exposure] = useState(1);

  useEffect(() => {
    if (!modelId) {
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    let isActive = true;

    // Start polling for model status
    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/models/status/${modelId}`);

        if (!response.ok) {
          throw new Error('Failed to check model status');
        }

        const data = await response.json();

        if (!isActive) return;

        setStatus(data.status);

        if (data.status === 'completed' && data.filename) {
          // Model is ready - set the URL
          const fileUrl = `http://localhost:8000/models/${data.filename}`;
          setModelUrl(fileUrl);

          // Stop polling
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        } else if (data.status === 'failed') {
          setError(data.error || 'Model generation failed');

          // Stop polling
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch (err) {
        console.error('Error checking model status:', err);
        // Don't stop polling on network errors - might be temporary
      }
    };

    // Initial check
    checkStatus();

    // Poll every 2 seconds
    interval = setInterval(checkStatus, 2000);

    // Cleanup on unmount
    return () => {
      isActive = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [modelId]);

  if (!modelId) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        🎨 3D Room Model
      </h3>
      <p className="text-base text-gray-600 mb-6">
        AI-generated depth-mapped 3D visualization of your room
      </p>

      <div className="w-full h-[600px] rounded-xl overflow-hidden bg-gray-900 relative">
        {status === 'pending' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
            <p className="text-lg font-medium">Initializing 3D generation...</p>
            <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
            <p className="text-lg font-medium">Generating 3D model...</p>
            <p className="text-sm text-gray-400 mt-2">Processing depth information (~10-15 seconds)</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium">3D Generation Failed</p>
            <p className="text-sm text-gray-400 mt-2">{error || 'An error occurred during generation'}</p>
          </div>
        )}

        {status === 'completed' && modelUrl && (
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            </div>
          }>
            <ModelViewer
              modelUrl={modelUrl}
              modelType="fbx"
              ambientIntensity={ambientIntensity}
              keyLightIntensity={keyLightIntensity}
              fillLightIntensity={fillLightIntensity}
              backLightIntensity={backLightIntensity}
              materialRoughness={materialRoughness}
              materialMetalness={materialMetalness}
              exposure={exposure}
            />
          </Suspense>
        )}
      </div>

      {status === 'completed' && modelUrl && (
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            ✓ 3D model ready
          </p>
          <a
            href={modelUrl}
            download
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Download FBX
          </a>
        </div>
      )}

      {(status === 'pending' || status === 'processing') && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> The 3D model is being generated in the background. You can continue browsing the analysis results while you wait.
          </p>
        </div>
      )}
    </div>
  );
}
