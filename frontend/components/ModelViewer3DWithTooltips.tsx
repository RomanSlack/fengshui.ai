'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Center } from '@react-three/drei';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

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

interface TooltipMarker {
  position: THREE.Vector3;
  tooltip: Tooltip;
  index: number;
}

interface ModelViewer3DWithTooltipsProps {
  modelUrl: string;
  tooltips: Tooltip[];
  imageWidth: number;
  imageHeight: number;
}

function FBXModelWithMarkers({
  url,
  tooltips,
  imageWidth,
  imageHeight,
  onMarkersReady
}: {
  url: string;
  tooltips: Tooltip[];
  imageWidth: number;
  imageHeight: number;
  onMarkersReady: (markers: TooltipMarker[]) => void;
}) {
  const fbx = useLoader(FBXLoader, url, (loader) => {
    const manager = new THREE.LoadingManager();

    // Configure error handling
    manager.onError = (errorUrl) => {
      console.error('Error loading asset:', errorUrl);
    };

    manager.setURLModifier((textureUrl) => {
      if (textureUrl.startsWith('/') || textureUrl.includes(':\\')) {
        console.warn('External texture path detected, using default material:', textureUrl);
        return '';
      }
      return textureUrl;
    });

    loader.manager = manager;
  });

  const { camera } = useThree();
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Configure materials
    fbx.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshPhongMaterial) {
            const standardMat = new THREE.MeshStandardMaterial({
              color: mat.color,
              map: mat.map,
              normalMap: mat.normalMap,
              roughness: 0.5,
              metalness: 0,
            });
            if (Array.isArray(child.material)) {
              const index = child.material.indexOf(mat);
              child.material[index] = standardMat;
            } else {
              child.material = standardMat;
            }
          } else if (mat instanceof THREE.MeshStandardMaterial) {
            mat.roughness = 0.5;
            mat.metalness = 0;
            if (mat.map && (!mat.map.image || mat.map.image.width === 0)) {
              mat.map = null;
              mat.color.setHex(0xcccccc);
            }
          }
          mat.needsUpdate = true;
        });
      }
    });

    // Raycast to find Z-depth for tooltips
    if (meshRef.current && tooltips.length > 0) {
      const raycaster = new THREE.Raycaster();
      const markers: TooltipMarker[] = [];

      tooltips.forEach((tooltip, index) => {
        // Convert 2D image coordinates to NDC
        const x = (tooltip.coordinates.center.x / imageWidth) * 2 - 1;
        const y = -(tooltip.coordinates.center.y / imageHeight) * 2 + 1;

        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        const intersects = raycaster.intersectObject(meshRef.current!, true);

        if (intersects.length > 0) {
          // Get the 3D position on mesh surface
          const worldPos = intersects[0].point.clone();

          // Slight offset toward camera to prevent z-fighting
          const offsetDirection = new THREE.Vector3()
            .subVectors(camera.position, worldPos)
            .normalize()
            .multiplyScalar(0.1);
          worldPos.add(offsetDirection);

          markers.push({
            position: worldPos,
            tooltip,
            index
          });
        }
      });

      onMarkersReady(markers);
    }
  }, [fbx, tooltips, imageWidth, imageHeight, camera, onMarkersReady]);

  return (
    <Center>
      <primitive ref={meshRef} object={fbx} scale={0.5} />
    </Center>
  );
}


function Scene({
  modelUrl,
  tooltips,
  imageWidth,
  imageHeight,
  onMarkersReady
}: {
  modelUrl: string;
  tooltips: Tooltip[];
  imageWidth: number;
  imageHeight: number;
  onMarkersReady: (markers: TooltipMarker[]) => void;
}) {
  return (
    <>
      {/* Camera: position={[x, y, z]} - Start facing directly at mesh from front */}
      {/* Default: [0, 0, 25] means straight ahead (no angle), 25 units away */}
      {/* Adjust Z value (third number) to move camera closer/further */}
      <PerspectiveCamera makeDefault position={[0, 0, 25]} />

      {/* Restricted OrbitControls for zen UX */}
      {/* minDistance/maxDistance control zoom range */}
      {/* Adjust these to control how close/far user can zoom */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enablePan={false}
        minDistance={10}        // Minimum zoom distance
        maxDistance={40}        // Maximum zoom distance
        maxPolarAngle={Math.PI / 2}   // Don't go below floor
        minPolarAngle={Math.PI / 6}   // Don't go too high above
      />

      {/* Zen lighting setup */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      <pointLight position={[0, 5, -10]} intensity={0.8} />

      <Environment preset="studio" background={false} />

      <Suspense fallback={null}>
        <FBXModelWithMarkers
          url={modelUrl}
          tooltips={tooltips}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          onMarkersReady={onMarkersReady}
        />
      </Suspense>

    </>
  );
}

export default function ModelViewer3DWithTooltips({
  modelUrl,
  tooltips,
  imageWidth,
  imageHeight
}: ModelViewer3DWithTooltipsProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [modelUrl]);

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <Canvas
        key={key}
        shadows
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
        style={{ background: '#1a1a1a' }}
      >
        <Scene
          modelUrl={modelUrl}
          tooltips={tooltips}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          onMarkersReady={() => {}}
        />
      </Canvas>
    </div>
  );
}
