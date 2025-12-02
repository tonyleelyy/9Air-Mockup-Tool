import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SceneViewer } from './components/SceneViewer';
import { ControlPanel } from './components/ControlPanel';
import { ShapeType, ShapeDimensions, DEFAULT_DIMENSIONS, FaceTextures } from './types';
import { Download } from 'lucide-react';

const App: React.FC = () => {
  const [selectedShape, setSelectedShape] = useState<ShapeType>(ShapeType.CUBE);
  const [dimensions, setDimensions] = useState<ShapeDimensions>(DEFAULT_DIMENSIONS);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [textures, setTextures] = useState<FaceTextures>({});
  
  // We use a ref to trigger the screenshot function inside the Canvas component
  const screenshotRef = useRef<(() => void) | null>(null);

  // Reset textures when shape changes
  useEffect(() => {
    setTextures({});
  }, [selectedShape]);

  const handleShapeChange = (shape: ShapeType) => {
    setSelectedShape(shape);
  };

  const handleDimensionChange = (key: keyof ShapeDimensions, value: number) => {
    setDimensions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTextureUpload = (face: string, file: File) => {
    const url = URL.createObjectURL(file);
    setTextures((prev) => {
      // Revoke old url if exists to avoid memory leaks
      if (prev[face]) {
        URL.revokeObjectURL(prev[face]!);
      }
      return {
        ...prev,
        [face]: url,
      };
    });
  };

  const handleRemoveTexture = (face: string) => {
    setTextures((prev) => {
      const url = prev[face];
      if (url && typeof url === 'string') {
        URL.revokeObjectURL(url);
      }
      const newTextures = { ...prev };
      delete newTextures[face];
      return newTextures;
    });
  };

  const handleResetTextures = () => {
    // Cleanup URLs
    Object.values(textures).forEach((url) => {
      if (typeof url === 'string') URL.revokeObjectURL(url);
    });
    setTextures({});
  };

  const handleScreenshotClick = useCallback(() => {
    if (screenshotRef.current) {
      screenshotRef.current();
    }
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Left Sidebar: Controls */}
      <div className="w-full md:w-80 flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 z-10 flex flex-col h-auto md:h-full shadow-lg">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 rounded-md block"></span>
            3D Mockup Tool
          </h1>
          <p className="text-xs text-gray-500 mt-1">Generate blank product bases</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <ControlPanel
            selectedShape={selectedShape}
            dimensions={dimensions}
            showEnvironment={showEnvironment}
            textures={textures}
            onShapeChange={handleShapeChange}
            onDimensionChange={handleDimensionChange}
            onToggleEnvironment={setShowEnvironment}
            onTextureUpload={handleTextureUpload}
            onRemoveTexture={handleRemoveTexture}
            onResetTextures={handleResetTextures}
          />
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleScreenshotClick}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Download size={18} />
            Download PNG
          </button>
        </div>
      </div>

      {/* Right Area: 3D Scene */}
      <div className="flex-1 relative bg-gray-100 h-[60vh] md:h-full">
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 pointer-events-none border border-white/50">
          Left Click: Rotate &bull; Right Click: Pan &bull; Scroll: Zoom
        </div>
        
        <SceneViewer
          shape={selectedShape}
          dimensions={dimensions}
          showEnvironment={showEnvironment}
          textures={textures}
          setScreenshotTrigger={(fn) => {
            screenshotRef.current = fn;
          }}
        />
      </div>
    </div>
  );
};

export default App;