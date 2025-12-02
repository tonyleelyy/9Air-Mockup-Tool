export enum ShapeType {
  CUBE = 'CUBE',
  SPHERE = 'SPHERE',
  BAG = 'BAG',
}

export interface ShapeDimensions {
  width: number;
  height: number;
  depth: number;
  diameter: number;
}

export interface FaceTextures {
  [key: string]: string | null;
}

export const DEFAULT_DIMENSIONS: ShapeDimensions = {
  width: 10,
  height: 10,
  depth: 10,
  diameter: 10,
};

// Scene configuration constants
export const SCENE_CONFIG = {
  bgColors: ['#f3f4f6', '#ffffff', '#e5e7eb'],
  defaultColor: '#ffffff',
  gridSize: 20,
};