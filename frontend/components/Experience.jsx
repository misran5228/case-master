import { OrbitControls, useGLTF, Center, Environment, useTexture, Decal } from "@react-three/drei";
import { useEffect, useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSnapshot } from "valtio";
import state from '../store'; 

/**
 * 📱 手机本体组件
 */
function PhoneBody({ scene }) {
  return <primitive object={scene} />;
}

/**
 * 🛡️ 智能外壳组件
 */
function SmartCase({ originalScene, item, customTexture, scratchMap, leatherNormal }) {
  // 1. 克隆场景
  const caseScene = useMemo(() => originalScene.clone(), [originalScene]);
  
  // 2. Decal 投影逻辑 (仅用于透明壳 DIY)
  const [targetMesh, setTargetMesh] = useState(null);
  const [decalProps, setDecalProps] = useState(null);
  const targetMeshRef = useRef(null);
  
  useEffect(() => { targetMeshRef.current = targetMesh; }, [targetMesh]);

  useEffect(() => {
    if (item.name !== 'transparent') return;

    let bestMesh = null;
    let maxArea = 0;
    caseScene.traverse((node) => {
      if (node.isMesh) {
        const name = node.name.toLowerCase();
        const isInternal = name.includes('screen') || name.includes('camera') || name.includes('lens') || name.includes('flash');
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

  // 3. 材质生成工厂
  const material = useMemo(() => {
    // === 👜 皮质款式 (Leather) ===
    if (item.name === "leather") {
        return new THREE.MeshStandardMaterial({
            color: item.color,
            normalMap: leatherNormal,
            // 🔥 强力凹凸：设置为 1.5 让纹理清晰可见
            normalScale: new THREE.Vector2(1.5, 1.5), 
            roughness: 0.5,          // 皮革质感
            metalness: 0.0,
            envMapIntensity: 1.0,
            side: THREE.FrontSide
        });
    }

    // === 🔮 透明款式 (Transparent) ===
    if (item.name === "transparent" || item.name === "clear") {
        return new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 1.0,
            opacity: 1,
            transparent: true,
            roughness: 0.15,
            roughnessMap: scratchMap,
            metalness: 0.0,
            ior: 1.5,
            thickness: 0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            clearcoatRoughnessMap: scratchMap,
            envMapIntensity: 1.5,
            side: THREE.FrontSide
        });
    }

    return null;
  }, [item.name, item.color, scratchMap, leatherNormal]);

  // 4. 应用材质 & 挖孔逻辑
  useEffect(() => {
    if (!material) return;
    caseScene.traverse((node) => {
      if (node.isMesh) {
        const name = node.name.toLowerCase();
        
        // 🔥 黑名单策略：排除不需要覆盖的部件
        // 1. 挖孔部件 (露出真机)
        const isHole = name.includes('camera') || 
                       name.includes('lens') || 
                       name.includes('flash') || 
                       name.includes('port') || 
                       name.includes('button') || 
                       name.includes('key') || 
                       name.includes('mic') ||
                       name.includes('speaker') ||
                       name.includes('logo') || 
                       name.includes('apple');

        // 2. 屏幕部件 (隐藏)
        const isScreen = name.includes('screen') || 
                         name.includes('display') || 
                         name.includes('front') || 
                         name.includes('black') ||
                         name.includes('bezel') ||
                         name.includes('wallpaper') ||
                         name.includes('touch') ||
                         // 如果名字包含 glass 且不包含 back/rear，通常是前屏幕玻璃
                         (name.includes('glass') && !name.includes('back') && !name.includes('rear'));

        if (isHole || isScreen) {
          node.visible = false; 
        } else {
          // 其他所有部件都作为手机壳的一部分
          node.visible = true;
          node.material = material;
          node.castShadow = true;
          node.receiveShadow = true;
        }
      }
    });
  }, [caseScene, material]);

  if (!material) return null;

  const scale = item.name === 'leather' ? [1.025, 1.025, 1.025] : [1.001, 1.001, 1.001];

  return (
    <group>
      <primitive object={caseScene} scale={scale}>
          {item.name === 'transparent' && customTexture && targetMesh && decalProps && (
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

  const [scratchMap, leatherNormal] = useTexture(["/scratch.jpg", "/leather_normal.png"]);

  useEffect(() => {
    if (scratchMap) {
      scratchMap.wrapS = scratchMap.wrapT = THREE.RepeatWrapping;
      scratchMap.repeat.set(3, 3);
      scratchMap.anisotropy = 16;
      scratchMap.colorSpace = THREE.NoColorSpace; 
    }
    if (leatherNormal) {
        leatherNormal.wrapS = leatherNormal.wrapT = THREE.RepeatWrapping;
        // 🔥 调整密度：8x8 适合大部分 UV，如果纹理太密可改小，太疏可改大
        leatherNormal.repeat.set(8, 8); 
        leatherNormal.colorSpace = THREE.NoColorSpace;
        leatherNormal.needsUpdate = true;
    }
  }, [scratchMap, leatherNormal]);

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
        scratchMap={scratchMap} 
        leatherNormal={leatherNormal} 
      />
    </group>
  );
}

export default function Experience() {
  const snap = useSnapshot(state);
  
  // 🔥 临时修改：如果 state 里没有类型，默认显示 'leather' 让你看效果
  const currentItem = { 
      name: snap.caseType || 'leather', 
      color: snap.color || '#e67e22' 
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