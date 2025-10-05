'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Center } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

interface ModelViewerProps {
  modelUrl: string | null;
  modelType: 'gltf' | 'fbx' | null;
  ambientIntensity: number;
  keyLightIntensity: number;
  fillLightIntensity: number;
  backLightIntensity: number;
  materialRoughness: number;
  materialMetalness: number;
  exposure: number;
}

function GLTFModel({ url, roughness, metalness }: { url: string; roughness: number; metalness: number }) {
  const gltf = useLoader(GLTFLoader, url);

  useEffect(() => {
    // Ensure shadows and materials are set up correctly
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.roughness = roughness;
              mat.metalness = metalness;
            }
            mat.needsUpdate = true;
          });
        }
      }
    });
  }, [gltf, roughness, metalness]);

  return (
    <Center>
      <primitive object={gltf.scene} scale={0.5} />
    </Center>
  );
}

// Cache for fetch promises to enable Suspense
const fetchCache = new Map<string, Promise<string>>();

// Helper to fetch FBX with ngrok headers - returns a promise that resolves to blob URL
function fetchFBXWithHeaders(url: string): Promise<string> {
  if (fetchCache.has(url)) {
    return fetchCache.get(url)!;
  }

  const promise = (async () => {
    try {
      console.log('[FBX] Fetching model from:', url);

      const isNgrok = url.includes('ngrok');
      const headers: HeadersInit = {};
      if (isNgrok) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch FBX: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      console.log('[FBX] Created blob URL:', objectUrl);
      return objectUrl;
    } catch (err) {
      console.error('[FBX] Fetch error:', err);
      fetchCache.delete(url); // Remove from cache on error so it can be retried
      throw err;
    }
  })();

  fetchCache.set(url, promise);
  return promise;
}

function FBXModel({ url, roughness, metalness }: { url: string; roughness: number; metalness: number }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Fetch blob URL in useEffect to avoid state updates during render
  useEffect(() => {
    let cancelled = false;

    fetchFBXWithHeaders(url)
      .then((blob) => {
        if (!cancelled) {
          setBlobUrl(blob);
        }
      })
      .catch((err) => {
        console.error('[FBX] Failed to fetch:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Suspend while waiting for blob URL
  if (!blobUrl) {
    throw fetchFBXWithHeaders(url); // Suspend until fetch completes
  }

  // Now we can safely use the loader with the blob URL
  const fbx = useLoader(FBXLoader, blobUrl, (loader) => {
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((textureUrl) => {
      if (textureUrl.startsWith('/') || textureUrl.includes(':\\')) {
        console.warn('External texture path detected, using default material:', textureUrl);
        return '';
      }
      return textureUrl;
    });
    loader.manager = manager;
  });

  useEffect(() => {
    // Ensure textures are loaded and materials are set up correctly
    fbx.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          // Enable shadow casting and receiving
          child.castShadow = true;
          child.receiveShadow = true;

          // Handle materials that may have missing textures
          const materials = Array.isArray(child.material) ? child.material : [child.material];

          materials.forEach((mat) => {
            // Convert to MeshStandardMaterial if it's a MeshPhongMaterial
            if (mat instanceof THREE.MeshPhongMaterial) {
              const standardMat = new THREE.MeshStandardMaterial({
                color: mat.color,
                map: mat.map,
                normalMap: mat.normalMap,
                roughness: roughness,
                metalness: metalness,
              });
              if (Array.isArray(child.material)) {
                const index = child.material.indexOf(mat);
                child.material[index] = standardMat;
              } else {
                child.material = standardMat;
              }
            } else if (mat instanceof THREE.MeshStandardMaterial) {
              mat.roughness = roughness;
              mat.metalness = metalness;
              // If texture is missing, set a default color
              if (mat.map && (!mat.map.image || mat.map.image.width === 0)) {
                mat.map = null;
                mat.color.setHex(0xcccccc); // Light gray default
              }
            }
            mat.needsUpdate = true;
          });
        }
      }
    });
  }, [fbx, roughness, metalness]);

  return (
    <Center>
      <primitive object={fbx} scale={0.5} />
    </Center>
  );
}

function Scene({
  modelUrl,
  modelType,
  ambientIntensity,
  keyLightIntensity,
  fillLightIntensity,
  backLightIntensity,
  materialRoughness,
  materialMetalness,
  exposure
}: ModelViewerProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 15]} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={200}
      />

      {/* Controllable lighting setup */}
      <ambientLight intensity={ambientIntensity} />

      {/* Key light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={keyLightIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill light */}
      <directionalLight position={[-5, 5, -5]} intensity={fillLightIntensity} />

      {/* Back light */}
      <pointLight position={[0, 5, -10]} intensity={backLightIntensity} />

      <Environment preset="studio" background={false} />

      {modelUrl && modelType && (
        <Suspense fallback={null}>
          {modelType === 'gltf' ? (
            <GLTFModel url={modelUrl} roughness={materialRoughness} metalness={materialMetalness} />
          ) : (
            <FBXModel url={modelUrl} roughness={materialRoughness} metalness={materialMetalness} />
          )}
        </Suspense>
      )}

      <gridHelper args={[20, 20]} />
    </>
  );
}

export default function ModelViewer(props: ModelViewerProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Force re-render when model changes
    setKey(prev => prev + 1);
  }, [props.modelUrl, props.modelType]);

  return (
    <div className="w-full h-full">
      <Canvas
        key={key}
        shadows
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: props.exposure,
        }}
        style={{ background: '#1a1a1a' }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
