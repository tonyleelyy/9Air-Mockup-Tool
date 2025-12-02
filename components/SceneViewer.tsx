import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Stage,
  Sphere,
  PerspectiveCamera,
  Environment,
  useTexture,
} from '@react-three/drei';
import * as THREE from 'three';
import { ShapeType, ShapeDimensions, FaceTextures } from '../types';

interface SceneViewerProps {
  shape: ShapeType;
  dimensions: ShapeDimensions;
  showEnvironment: boolean;
  textures: FaceTextures;
  setScreenshotTrigger: (fn: () => void) => void;
}

// Internal component to handle the screenshot logic using the Three.js context
const ScreenshotHandler: React.FC<{ setScreenshotTrigger: (fn: () => void) => void }> = ({
  setScreenshotTrigger,
}) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const capture = () => {
      // Force a render before capture to ensure everything is up to date
      gl.render(scene, camera);
      const link = document.createElement('a');
      link.setAttribute('download', 'mockup-render.png');
      link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
      link.click();
    };
    setScreenshotTrigger(capture);
  }, [gl, scene, camera, setScreenshotTrigger]);

  return null;
};

// --- Helper Components for Materials ---

const MATERIAL_PROPS = {
  color: '#ffffff',
  roughness: 0.2,
  metalness: 0.1,
};

// A sub-component that actually loads the texture via suspense
const TextureMaterial: React.FC<{ url: string; attach?: string }> = ({ url, attach }) => {
  const texture = useTexture(url);
  // Ensure texture wraps correctly if needed, though for single face defaults are usually fine
  // texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
  return <meshStandardMaterial attach={attach} map={texture} {...MATERIAL_PROPS} color="#ffffff" />;
};

const FaceMaterial: React.FC<{ url?: string | null; attach?: string }> = ({ url, attach }) => {
  if (url) {
    return <TextureMaterial url={url} attach={attach} />;
  }
  return <meshStandardMaterial attach={attach} {...MATERIAL_PROPS} />;
};

// --- Shape Components ---

const CubeModel: React.FC<{ dimensions: ShapeDimensions; textures: FaceTextures }> = ({ dimensions, textures }) => {
  const scale = 0.1;
  // BoxGeometry material index order:
  // 0: right (px), 1: left (nx), 2: top (py), 3: bottom (ny), 4: front (pz), 5: back (nz)
  
  return (
    <mesh>
      <boxGeometry args={[dimensions.width * scale, dimensions.height * scale, dimensions.depth * scale]} />
      <FaceMaterial attach="material-0" url={textures['right']} />
      <FaceMaterial attach="material-1" url={textures['left']} />
      <FaceMaterial attach="material-2" url={textures['top']} />
      <FaceMaterial attach="material-3" url={textures['bottom']} />
      <FaceMaterial attach="material-4" url={textures['front']} />
      <FaceMaterial attach="material-5" url={textures['back']} />
    </mesh>
  );
};

const SphereModel: React.FC<{ dimensions: ShapeDimensions; textures: FaceTextures }> = ({ dimensions, textures }) => {
  const scale = 0.1;
  const radius = (dimensions.diameter / 2) * scale;
  return (
    <Sphere args={[radius, 64, 64]}>
      <FaceMaterial url={textures['map']} />
    </Sphere>
  );
};

const BagModel: React.FC<{ dimensions: ShapeDimensions; textures: FaceTextures }> = ({ dimensions, textures }) => {
  const scale = 0.1;
  const w = dimensions.width * scale;
  const h = dimensions.height * scale;
  const d = dimensions.depth * scale;
  
  // Custom Bag Geometry Construction
  // Bag Body is a Box. Same mapping as Cube.
  
  return (
    <group>
      {/* Bag Body - Sharp Edges */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, h, d]} />
        <FaceMaterial attach="material-0" url={textures['right']} />
        <FaceMaterial attach="material-1" url={textures['left']} />
        {/* Top is usually open or white for a bag, but we allow texturing if user wants, or fallback to white */}
        <FaceMaterial attach="material-2" url={null} /> 
        <FaceMaterial attach="material-3" url={textures['bottom']} />
        <FaceMaterial attach="material-4" url={textures['front']} />
        <FaceMaterial attach="material-5" url={textures['back']} />
      </mesh>

      {/* Handles */}
      <group position={[0, h / 2, 0]}>
        <mesh position={[0, 0.15, d * 0.25]} rotation={[0, 0, 0]}>
          <torusGeometry args={[w * 0.15, 0.02, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.5} />
        </mesh>
         <mesh position={[-w * 0.15, 0.08, d * 0.25]}>
           <cylinderGeometry args={[0.02, 0.02, 0.16]} />
           <meshStandardMaterial color="#eeeeee" roughness={0.5} />
         </mesh>
         <mesh position={[w * 0.15, 0.08, d * 0.25]}>
           <cylinderGeometry args={[0.02, 0.02, 0.16]} />
           <meshStandardMaterial color="#eeeeee" roughness={0.5} />
         </mesh>

        {/* Handle 2 */}
        <mesh position={[0, 0.15, -d * 0.25]} rotation={[0, 0, 0]}>
          <torusGeometry args={[w * 0.15, 0.02, 16, 32, Math.PI]} />
           <meshStandardMaterial color="#eeeeee" roughness={0.5} />
        </mesh>
         <mesh position={[-w * 0.15, 0.08, -d * 0.25]}>
           <cylinderGeometry args={[0.02, 0.02, 0.16]} />
           <meshStandardMaterial color="#eeeeee" roughness={0.5} />
         </mesh>
         <mesh position={[w * 0.15, 0.08, -d * 0.25]}>
           <cylinderGeometry args={[0.02, 0.02, 0.16]} />
           <meshStandardMaterial color="#eeeeee" roughness={0.5} />
         </mesh>
      </group>
    </group>
  );
};

export const SceneViewer: React.FC<SceneViewerProps> = ({ shape, dimensions, showEnvironment, textures, setScreenshotTrigger }) => {
  const shadowBias = -0.001;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      className="w-full h-full"
    >
      <ScreenshotHandler setScreenshotTrigger={setScreenshotTrigger} />
      
      {/* Camera setup */}
      <PerspectiveCamera makeDefault position={[4, 4, 6]} fov={35} />
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.9} />

      {/* Realistic HDRI Environment - Park (Sunny Outdoor) */}
      <Environment files="https://fastly.jsdelivr.net/gh/pmndrs/drei-assets@master/hdri/rooitou_park_1k.hdr" background={showEnvironment} blur={0.6} />
      
      <directionalLight
        position={[8, 12, 5]}
        intensity={2.0}
        castShadow
        shadow-bias={shadowBias}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <ambientLight intensity={0.4} />

      <Stage
        intensity={0.1}
        environment={null}
        shadows={{ type: 'accumulative', color: '#3a3a3a', opacity: 0.65, alphaTest: 0.8 }}
        adjustCamera={true}
      >
        <Suspense fallback={null}>
          {shape === ShapeType.CUBE && <CubeModel dimensions={dimensions} textures={textures} />}
          {shape === ShapeType.SPHERE && <SphereModel dimensions={dimensions} textures={textures} />}
          {shape === ShapeType.BAG && <BagModel dimensions={dimensions} textures={textures} />}
        </Suspense>
      </Stage>
    </Canvas>
  );
};
