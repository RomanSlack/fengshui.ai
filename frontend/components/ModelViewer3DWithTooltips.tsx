'use client';

import { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Center, Html } from '@react-three/drei';
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

function FBXModelWithTooltips({
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
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

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

    // Calculate tooltip positions using raycasting
    if (meshRef.current && tooltips.length > 0) {
      const markers: TooltipMarker[] = [];

      tooltips.forEach((tooltip, index) => {
        // Normalize coordinates from image space to NDC (Normalized Device Coordinates)
        const x = (tooltip.coordinates.center.x / imageWidth) * 2 - 1;
        const y = -(tooltip.coordinates.center.y / imageHeight) * 2 + 1;

        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        const intersects = raycaster.intersectObject(meshRef.current!, true);

        if (intersects.length > 0) {
          // Use the first intersection point
          const worldPos = intersects[0].point.clone();

          // Offset slightly towards camera to prevent z-fighting
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
  }, [fbx, tooltips, imageWidth, imageHeight, camera, raycaster, onMarkersReady]);

  return (
    <Center>
      <primitive ref={meshRef} object={fbx} scale={0.5} />
    </Center>
  );
}

function TooltipMarkers({ markers }: { markers: TooltipMarker[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const getTooltipColor = (type: string) => {
    switch (type) {
      case 'good':
        return {
          color: '#22c55e',
          icon: '✓'
        };
      case 'bad':
        return {
          color: '#ef4444',
          icon: '✗'
        };
      default:
        return {
          color: '#eab308',
          icon: '!'
        };
    }
  };

  return (
    <>
      {markers.map((marker, idx) => {
        const colors = getTooltipColor(marker.tooltip.type);
        const isActive = activeIndex === idx;

        return (
          <group key={idx} position={marker.position}>
            {/* Info icon sprite - distanceFactor controls size scaling with distance */}
            {/* Lower distanceFactor = larger icons, Higher = smaller icons */}
            <Html
              center
              distanceFactor={6}
              style={{
                transition: 'all 0.3s ease',
                pointerEvents: 'auto'
              }}
            >
              <div
                className="relative cursor-pointer"
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
              >
                {/* Icon circle - increased size from w-10 h-10 to w-16 h-16 */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: colors.color,
                    boxShadow: isActive ? `0 0 20px ${colors.color}` : `0 2px 10px rgba(0,0,0,0.3)`
                  }}
                >
                  i
                </div>

                {/* Pulse ring when not active */}
                {!isActive && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-50"
                    style={{
                      backgroundColor: colors.color
                    }}
                  />
                )}

                {/* Tooltip card - appears on hover - increased from w-80 to w-96 */}
                {isActive && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-20 w-96 max-w-[90vw] z-50"
                    style={{
                      animation: 'fadeIn 0.3s ease-out'
                    }}
                  >
                    <div
                      className="rounded-xl shadow-2xl p-8 border-3 backdrop-blur-sm"
                      style={{
                        backgroundColor: marker.tooltip.type === 'good'
                          ? 'rgb(240, 253, 244)'
                          : marker.tooltip.type === 'bad'
                          ? 'rgb(254, 242, 242)'
                          : 'rgb(254, 252, 232)',
                        borderColor: colors.color,
                        borderWidth: '3px'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex-shrink-0 w-14 h-14 text-white rounded-full flex items-center justify-center font-bold text-2xl"
                          style={{ backgroundColor: colors.color }}
                        >
                          {colors.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-2xl capitalize mb-3" style={{
                            color: marker.tooltip.type === 'good'
                              ? 'rgb(20, 83, 45)'
                              : marker.tooltip.type === 'bad'
                              ? 'rgb(127, 29, 29)'
                              : 'rgb(113, 63, 18)'
                          }}>
                            {marker.tooltip.object_class}
                          </div>
                          <div className="text-xl leading-relaxed" style={{
                            color: marker.tooltip.type === 'good'
                              ? 'rgb(22, 101, 52)'
                              : marker.tooltip.type === 'bad'
                              ? 'rgb(153, 27, 27)'
                              : 'rgb(133, 77, 14)'
                          }}>
                            {marker.tooltip.message}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Arrow pointing to icon */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0"
                      style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: `8px solid ${colors.color}`
                      }}
                    />
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

function Scene({
  modelUrl,
  tooltips,
  imageWidth,
  imageHeight,
  markers,
  onMarkersReady
}: {
  modelUrl: string;
  tooltips: Tooltip[];
  imageWidth: number;
  imageHeight: number;
  markers: TooltipMarker[];
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
        <FBXModelWithTooltips
          url={modelUrl}
          tooltips={tooltips}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          onMarkersReady={onMarkersReady}
        />
      </Suspense>

      {/* Render tooltip markers */}
      {markers.length > 0 && <TooltipMarkers markers={markers} />}

      <gridHelper args={[20, 20]} />
    </>
  );
}

export default function ModelViewer3DWithTooltips({
  modelUrl,
  tooltips,
  imageWidth,
  imageHeight
}: ModelViewer3DWithTooltipsProps) {
  const [markers, setMarkers] = useState<TooltipMarker[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [modelUrl]);

  const handleMarkersReady = (newMarkers: TooltipMarker[]) => {
    setMarkers(newMarkers);
  };

  return (
    <div className="w-full h-full">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
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
          markers={markers}
          onMarkersReady={handleMarkersReady}
        />
      </Canvas>
    </div>
  );
}
