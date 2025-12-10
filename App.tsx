import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SceneViewer } from './components/SceneViewer';
import { ControlPanel } from './components/ControlPanel';
import { ShapeType, ShapeDimensions, DEFAULT_DIMENSIONS, FaceTextures } from './types';
import { Download, Maximize, Minimize, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// Helper to get image dimensions
const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

const App: React.FC = () => {
  const [selectedShape, setSelectedShape] = useState<ShapeType>(ShapeType.CUBE);
  const [dimensions, setDimensions] = useState<ShapeDimensions>(DEFAULT_DIMENSIONS);
  const [showEnvironment, setShowEnvironment] = useState(false);
  const [textures, setTextures] = useState<FaceTextures>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // We use a ref to trigger the screenshot function inside the Canvas component
  const screenshotRef = useRef<(() => void) | null>(null);
  const sceneContainerRef = useRef<HTMLDivElement>(null);

  // Auto-load textures from URL query param "dir"
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dir = params.get('dir');

    if (dir) {
      const baseUrl = `https://fastly.jsdelivr.net/gh/tonyleelyy/9Air-Mockup-Tool@main/Projects/${dir}`;
      
      // Define mapping of keys to expected filenames
      const potentialTextures = [
        { key: 'front', filename: 'Front.png' },
        { key: 'back', filename: 'Back.png' },
        { key: 'left', filename: 'Left.png' },
        { key: 'right', filename: 'Right.png' },
        { key: 'top', filename: 'Top.png' },
        { key: 'bottom', filename: 'Bottom.png' },
        { key: 'map', filename: 'Map.png' },
      ];

      const loadTextures = async () => {
        const newTextures: FaceTextures = {};
        let frontRatio: number | null = null;
        let sideRatio: number | null = null;
        
        await Promise.all(potentialTextures.map(async ({ key, filename }) => {
          const url = `${baseUrl}/${filename}`;
          try {
            // Verify existence and get dimensions simultaneously
            const dims = await getImageDimensions(url);
            newTextures[key] = url;

            const ratio = dims.width / dims.height;
            
            // Prioritize Front for Width calculation, then Back
            if (key === 'front') frontRatio = ratio;
            if (key === 'back' && frontRatio === null) frontRatio = ratio;

            // Prioritize Left for Depth calculation, then Right
            if (key === 'left') sideRatio = ratio;
            if (key === 'right' && sideRatio === null) sideRatio = ratio;

          } catch (error) {
            // Image doesn't exist or failed to load
          }
        }));

        if (Object.keys(newTextures).length > 0) {
          setTextures((prev) => ({ ...prev, ...newTextures }));

          // Update dimensions based on loaded textures (preserving current Height)
          setDimensions((prev) => {
            const next = { ...prev };
            if (frontRatio) {
              next.width = parseFloat((next.height * frontRatio).toFixed(2));
            }
            if (sideRatio) {
              next.depth = parseFloat((next.height * sideRatio).toFixed(2));
            }
            return next;
          });
        }
      };

      loadTextures();
    }
  }, []);

  // Listen for fullscreen changes to update state (e.g. if user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleShapeChange = (shape: ShapeType) => {
    setSelectedShape(shape);
  };

  const handleDimensionChange = (key: keyof ShapeDimensions, value: number) => {
    setDimensions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTextureUpload = async (face: string, file: File) => {
    const url = URL.createObjectURL(file);

    // Auto-calculate dimensions based on texture aspect ratio
    try {
      const { width, height } = await getImageDimensions(url);
      const ratio = width / height;

      setDimensions((prev) => {
        const next = { ...prev };
        // For Front/Back, adjust Width based on current Height
        if (face === 'front' || face === 'back') {
          next.width = parseFloat((next.height * ratio).toFixed(2));
        } 
        // For Left/Right, adjust Depth based on current Height
        else if (face === 'left' || face === 'right') {
          next.depth = parseFloat((next.height * ratio).toFixed(2));
        }
        return next;
      });
    } catch (err) {
      console.warn("Could not calculate dimensions from uploaded image");
    }

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

  const toggleFullscreen = () => {
    if (!sceneContainerRef.current) return;

    if (!document.fullscreenElement) {
      sceneContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Left Sidebar: Controls */}
      <div 
        className={`${
          isSidebarOpen ? 'w-full md:w-80 opacity-100' : 'w-0 opacity-0 md:w-0'
        } flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 z-10 flex flex-col h-auto md:h-full shadow-lg transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap`}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-600 rounded-md block"></span>
              9Air Mockup Tool
            </h1>
            <p className="text-xs text-gray-500 mt-1">请横屏使用</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-50"
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={20} />
          </button>
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
      <div 
        ref={sceneContainerRef}
        className="flex-1 relative bg-gray-100 h-[60vh] md:h-full group"
      >
        {/* Expand Sidebar Button (only visible when sidebar is closed) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-sm p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-white transition-all shadow-sm border border-white/50 focus:outline-none"
            title="Expand Sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}

        {/* Instructions */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-medium text-gray-500 pointer-events-none border border-white/50 shadow-sm">
          Left Click: Rotate &bull; Right Click: Pan &bull; Scroll: Zoom
        </div>

        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-white transition-all shadow-sm border border-white/50 focus:outline-none"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        
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