import { OrbitControls, useGLTF, Center, Environment, useTexture, Decal } from "@react-three/drei";
import { useEffect, useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSnapshot } from "valtio";
import state from "../store";

function PhoneBody({ scene }) {
  return <primitive object={scene} />;
}

function SmartCase({ originalScene, item, customTexture, leatherColor, leatherNormal, leatherRoughness }) {
  const caseScene = useMemo(() => originalScene.clone(), [originalScene]);
  
  const [targetMesh, setTargetMesh] = useState(null);
  const [decalProps, setDecalProps] = useState(null);
  const targetMeshRef = useRef(null);
  
  useEffect(() => { targetMeshRef.current = targetMesh; }, [targetMesh]);

  useEffect(() => {
    if (item.name !== "transparent") return;

    let bestMesh = null;
    let maxArea = 0;
    caseScene.traverse((node) => {
      if (node.isMesh) {
        const name = node.name.toLowerCase();
        const isInternal = name.includes("screen") || name.includes("camera") || name.includes("lens") || name.includes("flash");
        if (!isInternal) {
          if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
          const box = node.geometry.boundingBox;
          const area = (box.max.x - box.min.x) * (box.max.y - box.min.y);
          if (area > maxArea) { maxArea = area; bestMesh = node; }
        }
      }
    });
    setTargetMesh(bestMesh);
    if (bestMesh) {
      const box = bestMesh.geometry.boundingBox;
      const center = new THREE.Vector3();
      box.getCenter(center);
      setDecalProps({
        position: [center.x, center.y, box.min.z + 0.01],
        rotation: [0, Math.PI, 0],
        scale: [(box.max.x - box.min.x) * 0.9, (box.max.y - box.min.y) * 0.9, 0.2]
      });
    }
  }, [caseScene, item.name]);

  const material = useMemo(() => {
    if (item.name === "leather") {
      const userColor = new THREE.Color(item.color);
      return new THREE.MeshStandardMaterial({
        map: leatherColor,
        normalMap: leatherNormal,
        normalScale: new THREE.Vector2(1.5, 1.5),
        roughnessMap: leatherRoughness,
        roughness: 0.6,
        metalness: 0.0,
        envMapIntensity: 1.0,
        side: THREE.FrontSide,
        color: userColor,
      });
    }

    if (item.name === "transparent" || item.name === "clear") {
      return new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 1.0,
        opacity: 1,
        transparent: true,
        roughness: 0.15,
        metalness: 0.0,
        ior: 1.5,
        thickness: 0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5,
        side: THREE.FrontSide
      });
    }

    return null;
  }, [item.name, item.color, leatherColor, leatherNormal, leatherRoughness]);

  useEffect(() => {
    if (!material) return;
    caseScene.traverse((node) => {
      if (node.isMesh) {
        const name = node.name.toLowerCase();
        
        const isHole = name.includes("camera") ||
                       name.includes("lens") ||
                       name.includes("flash") ||
                       name.includes("port") ||
                       name.includes("button") ||
                       name.includes("key") ||
                       name.includes("mic") ||
                       name.includes("speaker") ||
                       name.includes("logo") ||
                       name.includes("apple");

        const isScreen = name.includes("screen") ||
                         name.includes("display") ||
                         name.includes("front") ||
                         name.includes("black") ||
                         name.includes("bezel") ||
                         name.includes("wallpaper") ||
                         name.includes("touch") ||
                         (name.includes("glass") && !name.includes("back") && !name.includes("rear"));

        if (isHole || isScreen) {
          node.visible = false;
        } else {
          node.visible = true;
          node.material = material;
          node.castShadow = true;
          node.receiveShadow = true;
        }
      }
    });
  }, [caseScene, material]);

  if (!material) return null;

  const scale = item.name === "leather" ? [1.025, 1.025, 1.025] : [1.001, 1.001, 1.001];

  return (
    <group>
      <primitive object={caseScene} scale={scale}>
        {item.name === "transparent" && customTexture && targetMesh && decalProps && (
          <Decal
            mesh={targetMeshRef}
            position={decalProps.position}
            rotation={decalProps.rotation}
            scale={decalProps.scale}
          >
            <meshPhysicalMaterial
              map={customTexture}
              transparent
              polygonOffset
              polygonOffsetFactor={-10}
              roughness={0.4}
              clearcoat={0.5}
              side={THREE.DoubleSide}
              depthTest={true}
              depthWrite={false}
            />
          </Decal>
        )}
      </primitive>
    </group>
  );
}

function Model(props) {
  const snap = useSnapshot(state);
  const { scene: originalScene } = useGLTF("/models/iphone.glb");
  const phoneScene = useMemo(() => originalScene.clone(), [originalScene]);

  const [leatherColor, leatherNormal, leatherRoughness] = useTexture([
    "/models/leather_color.png",
    "/models/leather_normal.png",
    "/models/leather_roughness.png"
  ]);

  useEffect(() => {
    if (leatherColor) {
      leatherColor.wrapS = leatherColor.wrapT = THREE.RepeatWrapping;
      leatherColor.repeat.set(8, 8);
      leatherColor.colorSpace = THREE.SRGBColorSpace;
    }
    if (leatherNormal) {
      leatherNormal.wrapS = leatherNormal.wrapT = THREE.RepeatWrapping;
      leatherNormal.repeat.set(8, 8);
      leatherNormal.colorSpace = THREE.NoColorSpace;
    }
    if (leatherRoughness) {
      leatherRoughness.wrapS = leatherRoughness.wrapT = THREE.RepeatWrapping;
      leatherRoughness.repeat.set(8, 8);
      leatherRoughness.colorSpace = THREE.NoColorSpace;
    }
  }, [leatherColor, leatherNormal, leatherRoughness]);

  const [customTexture, setCustomTexture] = useState(null);
  useEffect(() => {
    if (snap.customImage) {
      const loader = new THREE.TextureLoader();
      loader.load(snap.customImage, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        tex.anisotropy = 16;
        setCustomTexture(tex);
      });
    } else {
      setCustomTexture(null);
    }
  }, [snap.customImage]);

  return (
    <group>
      <PhoneBody scene={phoneScene} />
      <SmartCase
        originalScene={originalScene}
        item={props.item}
        customTexture={customTexture}
        leatherColor={leatherColor}
        leatherNormal={leatherNormal}
        leatherRoughness={leatherRoughness}
      />
    </group>
  );
}

export default function Experience() {
  const snap = useSnapshot(state);
  
  const currentItem = {
    name: snap.caseType || "leather",
    color: snap.color || "#8B4513"
  };

  return (
    <> 
      <Environment preset="studio" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Center>
        <Model item={currentItem} />
      </Center>
      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        minDistance={0.15}
        maxDistance={0.8}
        enablePan={false}
      />
    </>
  );
}