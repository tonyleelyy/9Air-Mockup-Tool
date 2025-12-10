import React, { useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import {
  OrbitControls,
  Sphere,
  PerspectiveCamera,
  Environment,
  useTexture,
  Html,
  Center,
  ContactShadows,
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

const getMaterialProps = (showEnvironment: boolean) => ({
  color: '#ffffff',
  roughness: showEnvironment ? 0.2 : 1.0,
  metalness: showEnvironment ? 0.1 : 0.0,
});

// A sub-component that actually loads the texture via suspense
const TextureMaterial: React.FC<{ url: string; attach?: string; showEnvironment: boolean }> = ({ url, attach, showEnvironment }) => {
  const texture = useTexture(url);
  return <meshStandardMaterial attach={attach} map={texture} {...getMaterialProps(showEnvironment)} />;
};

const FaceMaterial: React.FC<{ url?: string | null; attach?: string; showEnvironment: boolean }> = ({ url, attach, showEnvironment }) => {
  if (url) {
    return <TextureMaterial url={url} attach={attach} showEnvironment={showEnvironment} />;
  }
  return <meshStandardMaterial attach={attach} {...getMaterialProps(showEnvironment)} />;
};

// --- Shape Components ---

const CubeModel: React.FC<{ dimensions: ShapeDimensions; textures: FaceTextures; showEnvironment: boolean }> = ({ dimensions, textures, showEnvironment }) => {
  const scale = 0.1;
  // BoxGeometry material index order:
  // 0: right (px), 1: left (nx), 2: top (py), 3: bottom (ny), 4: front (pz), 5: back (nz)
  
  return (
    <mesh>
      <boxGeometry args={[dimensions.width * scale, dimensions.height * scale, dimensions.depth * scale]} />
      <FaceMaterial attach="material-0" url={textures['right']} showEnvironment={showEnvironment} />
      <FaceMaterial attach="material-1" url={textures['left']} showEnvironment={showEnvironment} />
      <FaceMaterial attach="material-2" url={textures['top']} showEnvironment={showEnvironment} />
      <FaceMaterial attach="material-3" url={textures['bottom']} showEnvironment={showEnvironment} />
      <FaceMaterial attach="material-4" url={textures['front']} showEnvironment={showEnvironment} />
      <FaceMaterial attach="material-5" url={textures['back']} showEnvironment={showEnvironment} />
    </mesh>
  );
};

const SphereModel: React.FC<{ dimensions: ShapeDimensions; textures: FaceTextures; showEnvironment: boolean }> = ({ dimensions, textures, showEnvironment }) => {
  const scale = 0.1;
  const radius = (dimensions.diameter / 2) * scale;
  return (
    <Sphere args={[radius, 64, 64]}>
      <FaceMaterial url={textures['map']} showEnvironment={showEnvironment} />
    </Sphere>
  );
};

const BagModel: React.FC<{ dimensions: ShapeDimensions; textures: FaceTextures; showEnvironment: boolean }> = ({ dimensions, textures, showEnvironment }) => {
  const scale = 0.1;
  const w = dimensions.width * scale;
  const h = dimensions.height * scale;
  const d = dimensions.depth * scale;
  const matProps = getMaterialProps(showEnvironment);
  
  // Custom Bag Geometry Construction
  // Bag Body is a Box. Same mapping as Cube.
  
  return (
    <group>
      {/* Bag Body - Sharp Edges */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, h, d]} />
        <FaceMaterial attach="material-0" url={textures['right']} showEnvironment={showEnvironment} />
        <FaceMaterial attach="material-1" url={textures['left']} showEnvironment={showEnvironment} />
        {/* Top is usually open or white for a bag, but we allow texturing if user wants, or fallback to white */}
        <FaceMaterial attach="material-2" url={null} showEnvironment={showEnvironment} /> 
        <FaceMaterial attach="material-3" url={textures['bottom']} showEnvironment={showEnvironment} />
        <FaceMaterial attach="material-4" url={textures['front']} showEnvironment={showEnvironment} />
        <FaceMaterial attach="material-5" url={textures['back']} showEnvironment={showEnvironment} />
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

export const SceneViewer: React.FC<SceneViewerProps> = ({ 
  shape, 
  dimensions, 
  showEnvironment, 
  textures, 
  setScreenshotTrigger 
}) => {
  const shadowBias = -0.001;
  const scale = 0.1;

  // Calculate the approximate height of the object in scene units to place the shadow plane correctly
  const objectHeight = useMemo(() => {
    switch (shape) {
      case ShapeType.SPHERE:
        return dimensions.diameter * scale;
      case ShapeType.CUBE:
      case ShapeType.BAG:
        return dimensions.height * scale;
      default:
        return 1;
    }
  }, [shape, dimensions, scale]);

  // Shadow plane should be at the bottom of the object.
  // Since <Center> centers the object at (0,0,0), the bottom is at -height/2.
  const shadowY = -(objectHeight / 2);

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
      {/* OrbitControls targeting [0,0,0] ensures rotation around the object's center */}
      <OrbitControls makeDefault target={[0, 0, 0]} minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />

      {/* Realistic HDRI Environment */}
      <Environment 
        files="https://fastly.jsdelivr.net/gh/pmndrs/drei-assets@master/hdri/rooitou_park_1k.hdr"
        background={showEnvironment} 
        blur={0.6} 
      />
      
      <directionalLight
        position={[5, 10, 5]}
        intensity={2.0}
        castShadow
        shadow-bias={shadowBias}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <ambientLight intensity={0.5} />

      <Center position={[0, 0, 0]}>
        <Suspense fallback={null}>
          {shape === ShapeType.CUBE && <CubeModel dimensions={dimensions} textures={textures} showEnvironment={showEnvironment} />}
          {shape === ShapeType.SPHERE && <SphereModel dimensions={dimensions} textures={textures} showEnvironment={showEnvironment} />}
          {shape === ShapeType.BAG && <BagModel dimensions={dimensions} textures={textures} showEnvironment={showEnvironment} />}
        </Suspense>
      </Center>

      <ContactShadows 
        position={[0, shadowY, 0]} 
        opacity={0.5} 
        scale={15} 
        blur={2} 
        far={2}
        resolution={512}
        color="#000000"
      />
    </Canvas>
  );
};
