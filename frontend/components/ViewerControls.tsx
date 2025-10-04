'use client';

interface ViewerControlsProps {
  ambientIntensity: number;
  setAmbientIntensity: (value: number) => void;
  keyLightIntensity: number;
  setKeyLightIntensity: (value: number) => void;
  fillLightIntensity: number;
  setFillLightIntensity: (value: number) => void;
  backLightIntensity: number;
  setBackLightIntensity: (value: number) => void;
  materialRoughness: number;
  setMaterialRoughness: (value: number) => void;
  materialMetalness: number;
  setMaterialMetalness: (value: number) => void;
  exposure: number;
  setExposure: (value: number) => void;
}

export default function ViewerControls({
  ambientIntensity,
  setAmbientIntensity,
  keyLightIntensity,
  setKeyLightIntensity,
  fillLightIntensity,
  setFillLightIntensity,
  backLightIntensity,
  setBackLightIntensity,
  materialRoughness,
  setMaterialRoughness,
  materialMetalness,
  setMaterialMetalness,
  exposure,
  setExposure,
}: ViewerControlsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Lighting</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Ambient Light: {ambientIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={ambientIntensity}
              onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Key Light: {keyLightIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={keyLightIntensity}
              onChange={(e) => setKeyLightIntensity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Fill Light: {fillLightIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={fillLightIntensity}
              onChange={(e) => setFillLightIntensity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Back Light: {backLightIntensity.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={backLightIntensity}
              onChange={(e) => setBackLightIntensity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Exposure: {exposure.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={exposure}
              onChange={(e) => setExposure(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Material</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Roughness: {materialRoughness.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={materialRoughness}
              onChange={(e) => setMaterialRoughness(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Metalness: {materialMetalness.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={materialMetalness}
              onChange={(e) => setMaterialMetalness(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          setAmbientIntensity(0.4);
          setKeyLightIntensity(1.5);
          setFillLightIntensity(0.5);
          setBackLightIntensity(0.8);
          setMaterialRoughness(0.5);
          setMaterialMetalness(0);
          setExposure(1);
        }}
        className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
      >
        Reset to Defaults
      </button>
    </div>
  );
}
