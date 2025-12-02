import { Canvas } from '@react-three/fiber'
import Experience from '../components/Experience'
import Overlay from '../components/Overlay'

export default function Home() {
  return (
    // 🎨 这里的 background 改成了浅灰色，不再是死气沉沉的黑色了
    <div style={{ width: '100vw', height: '100vh', background: '#e0e0e0' }}>
      <Canvas 
        shadows 
        // 修复：将相机放在背面 (Z: -0.25)，适配你的截图视角
        camera={{ position: [0, 0, -0.25], fov: 45 }} 
        gl={{ preserveDrawingBuffer: true }}
      >
        <Experience />
      </Canvas>
      
      <Overlay />
    </div>
  )
}