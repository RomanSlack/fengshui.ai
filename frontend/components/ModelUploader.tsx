'use client';

import { useCallback } from 'react';

interface ModelUploaderProps {
  onModelLoad: (url: string, type: 'gltf' | 'fbx') => void;
}

export default function ModelUploader({ onModelLoad }: ModelUploaderProps) {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      let modelType: 'gltf' | 'fbx' | null = null;
      if (fileExtension === 'gltf' || fileExtension === 'glb') {
        modelType = 'gltf';
      } else if (fileExtension === 'fbx') {
        modelType = 'fbx';
      }

      if (!modelType) {
        alert('Please upload a GLB, GLTF, or FBX file');
        return;
      }

      const url = URL.createObjectURL(file);
      onModelLoad(url, modelType);
    },
    [onModelLoad]
  );

  return (
    <div className="w-full max-w-md">
      <label
        htmlFor="model-upload"
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            className="w-12 h-12 mb-4 text-gray-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">GLB, GLTF, or FBX files</p>
        </div>
        <input
          id="model-upload"
          type="file"
          className="hidden"
          accept=".glb,.gltf,.fbx"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
