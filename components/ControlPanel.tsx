import React from 'react';
import { ShapeType, ShapeDimensions, FaceTextures } from '../types';
import { Box, Circle, ShoppingBag, Image as ImageIcon, ToggleLeft, ToggleRight, Upload, RefreshCw, X, Trash2 } from 'lucide-react';

interface ControlPanelProps {
  selectedShape: ShapeType;
  dimensions: ShapeDimensions;
  showEnvironment: boolean;
  textures: FaceTextures;
  onShapeChange: (shape: ShapeType) => void;
  onDimensionChange: (key: keyof ShapeDimensions, value: number) => void;
  onToggleEnvironment: (show: boolean) => void;
  onTextureUpload: (face: string, file: File) => void;
  onRemoveTexture: (face: string) => void;
  onResetTextures: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedShape,
  dimensions,
  showEnvironment,
  textures,
  onShapeChange,
  onDimensionChange,
  onToggleEnvironment,
  onTextureUpload,
  onRemoveTexture,
  onResetTextures,
}) => {

  const getTextureFaces = () => {
    switch (selectedShape) {
      case ShapeType.CUBE:
        return [
          { key: 'front', label: 'Front' },
          { key: 'back', label: 'Back' },
          { key: 'left', label: 'Left' },
          { key: 'right', label: 'Right' },
          { key: 'top', label: 'Top' },
          { key: 'bottom', label: 'Bottom' },
        ];
      case ShapeType.BAG:
        return [
          { key: 'front', label: 'Front' },
          { key: 'back', label: 'Back' },
          { key: 'left', label: 'Side Left' },
          { key: 'right', label: 'Side Right' },
          { key: 'bottom', label: 'Bottom' },
        ];
      case ShapeType.SPHERE:
        return [
          { key: 'map', label: 'Surface Map' },
        ];
      default:
        return [];
    }
  };

  const faces = getTextureFaces();

  return (
    <div className="space-y-8">
      {/* Shape Selection */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Select Object
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <ShapeButton
            isActive={selectedShape === ShapeType.CUBE}
            onClick={() => onShapeChange(ShapeType.CUBE)}
            icon={<Box size={20} />}
            label="Cube"
          />
          <ShapeButton
            isActive={selectedShape === ShapeType.SPHERE}
            onClick={() => onShapeChange(ShapeType.SPHERE)}
            icon={<Circle size={20} />}
            label="Sphere"
          />
          <ShapeButton
            isActive={selectedShape === ShapeType.BAG}
            onClick={() => onShapeChange(ShapeType.BAG)}
            icon={<ShoppingBag size={20} />}
            label="Bag"
          />
        </div>
      </section>

      {/* Dimensions Input */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Dimensions & Config
        </h2>
        <div className="space-y-4">
          {selectedShape === ShapeType.SPHERE && (
             <NumberInput
             label="Diameter"
             value={dimensions.diameter}
             onChange={(val) => onDimensionChange('diameter', val)}
           />
          )}

          {(selectedShape === ShapeType.CUBE || selectedShape === ShapeType.BAG) && (
            <>
              <NumberInput
                label="Width (W)"
                value={dimensions.width}
                onChange={(val) => onDimensionChange('width', val)}
              />
              <NumberInput
                label="Height (H)"
                value={dimensions.height}
                onChange={(val) => onDimensionChange('height', val)}
              />
              <NumberInput
                label="Depth (D)"
                value={dimensions.depth}
                onChange={(val) => onDimensionChange('depth', val)}
              />
            </>
          )}
        </div>
      </section>

      {/* Textures Input */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Textures
          </h2>
          <button 
            onClick={onResetTextures}
            className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
            title="Reset all textures"
          >
            <RefreshCw size={12} /> Reset All
          </button>
        </div>
        
        <div className="grid gap-3 grid-cols-2">
          {faces.map((face) => (
            <TextureUploader
              key={face.key}
              label={face.label}
              currentTexture={textures[face.key]}
              onUpload={(file) => onTextureUpload(face.key, file)}
              onRemove={() => onRemoveTexture(face.key)}
            />
          ))}
        </div>
      </section>

      {/* Scene Settings */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          Scene Settings
        </h2>
        <div className="space-y-3">
          <button
            onClick={() => onToggleEnvironment(!showEnvironment)}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-gray-50 transition-all text-gray-700"
          >
            <div className="flex items-center gap-3">
              <ImageIcon size={18} className="text-gray-500" />
              <span className="text-sm font-medium">Show Environment</span>
            </div>
            {showEnvironment ? (
              <ToggleRight size={24} className="text-indigo-600" />
            ) : (
              <ToggleLeft size={24} className="text-gray-400" />
            )}
          </button>
        </div>
      </section>
      
      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800 text-sm">
        <p className="font-medium mb-1">Tip:</p>
        Toggle the environment off for a transparent background screenshot, perfect for Figma or Photoshop.
      </div>
    </div>
  );
};

// Helper Components

const ShapeButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ isActive, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
      isActive
        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105'
        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-gray-50'
    }`}
  >
    <div className="mb-2">{icon}</div>
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
}> = ({ label, value, onChange }) => (
  <div className="group">
    <label className="block text-xs font-medium text-gray-600 mb-1.5 group-hover:text-indigo-600 transition-colors">
      {label}
    </label>
    <div className="relative">
      <input
        type="number"
        min={0.1}
        step={0.5}
        value={value}
        onChange={(e) => {
           const val = parseFloat(e.target.value);
           if (!isNaN(val)) onChange(val);
        }}
        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 pr-8 transition-colors shadow-sm"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-gray-500 text-xs font-medium">cm</span>
      </div>
    </div>
  </div>
);

const TextureUploader: React.FC<{
  label: string;
  currentTexture: string | null | undefined;
  onUpload: (file: File) => void;
  onRemove: () => void;
}> = ({ label, currentTexture, onUpload, onRemove }) => (
  <div className="relative group/uploader">
    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-indigo-400 transition-colors overflow-hidden">
      {currentTexture ? (
        <img src={currentTexture} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center pt-2 pb-2">
          <Upload size={16} className="text-gray-400 mb-1" />
          <p className="text-[10px] text-gray-500 font-medium">{label}</p>
        </div>
      )}
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
            // clear value so selecting same file works again if needed
            e.target.value = '';
          }
        }}
      />
    </label>
    {currentTexture && (
      <>
        <div className="absolute top-1 left-1 bg-green-500 w-2 h-2 rounded-full border border-white pointer-events-none z-10"></div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-md p-1 shadow-sm border border-gray-200 transition-colors z-20"
          title="Remove texture"
        >
          <Trash2 size={12} />
        </button>
      </>
    )}
  </div>
);