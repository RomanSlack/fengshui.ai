'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ModelUploader from '@/components/ModelUploader';
import ViewerControls from '@/components/ViewerControls';

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-white">Loading 3D viewer...</div>
    </div>
  ),
});

export default function ViewerPage() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'gltf' | 'fbx' | null>(null);

  // Lighting controls
  const [ambientIntensity, setAmbientIntensity] = useState(0.4);
  const [keyLightIntensity, setKeyLightIntensity] = useState(1.5);
  const [fillLightIntensity, setFillLightIntensity] = useState(0.5);
  const [backLightIntensity, setBackLightIntensity] = useState(0.8);

  // Material controls
  const [materialRoughness, setMaterialRoughness] = useState(0.5);
  const [materialMetalness, setMaterialMetalness] = useState(0);
  const [exposure, setExposure] = useState(1);

  const handleModelLoad = (url: string, type: 'gltf' | 'fbx') => {
    setModelUrl(url);
    setModelType(type);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">3D Model Viewer</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="lg:w-80 bg-white p-6 border-r overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Upload Your Model
              </h2>
              <ModelUploader onModelLoad={handleModelLoad} />
              {modelUrl && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Model loaded successfully ({modelType?.toUpperCase()})
                  </p>
                </div>
              )}
            </div>

            {modelUrl && (
              <div className="border-t pt-6">
                <ViewerControls
                  ambientIntensity={ambientIntensity}
                  setAmbientIntensity={setAmbientIntensity}
                  keyLightIntensity={keyLightIntensity}
                  setKeyLightIntensity={setKeyLightIntensity}
                  fillLightIntensity={fillLightIntensity}
                  setFillLightIntensity={setFillLightIntensity}
                  backLightIntensity={backLightIntensity}
                  setBackLightIntensity={setBackLightIntensity}
                  materialRoughness={materialRoughness}
                  setMaterialRoughness={setMaterialRoughness}
                  materialMetalness={materialMetalness}
                  setMaterialMetalness={setMaterialMetalness}
                  exposure={exposure}
                  setExposure={setExposure}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          {modelUrl ? (
            <ModelViewer
              modelUrl={modelUrl}
              modelType={modelType}
              ambientIntensity={ambientIntensity}
              keyLightIntensity={keyLightIntensity}
              fillLightIntensity={fillLightIntensity}
              backLightIntensity={backLightIntensity}
              materialRoughness={materialRoughness}
              materialMetalness={materialMetalness}
              exposure={exposure}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-gray-400">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p className="text-lg">Upload a 3D model to get started</p>
                <p className="text-sm mt-2">Supports GLB, GLTF, and FBX formats</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
