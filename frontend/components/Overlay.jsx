import { motion, AnimatePresence } from 'framer-motion'
import { useSnapshot } from 'valtio'
import { useState } from 'react'
import state from '../store'

export default function Overlay() {
  const snap = useSnapshot(state)
  const [loading, setLoading] = useState(false)

  const transition = { type: 'spring', duration: 0.8 }
  const config = {
    initial: { y: 100, opacity: 0, transition: { ...transition, delay: 0.5 } },
    animate: { y: 0, opacity: 1, transition: { ...transition, delay: 0 } },
    exit: { y: 100, opacity: 0, transition: { ...transition, delay: 0 } }
  }

  // 🛠️ 下单逻辑
  const handleOrder = async () => {
    setLoading(true)
    try {
      // 1. 获取截图
      const canvas = document.querySelector('canvas')
      const screenshot = canvas ? canvas.toDataURL('image/png') : null

      // 2. 准备数据
      const orderPayload = {
        caseType: state.caseType,
        color: state.color,
        customText: state.customText,
        selectedFont: state.selectedFont,
        patches: state.patches,
        // 修复：将 texture 改为 customImage
        hasUserImage: !!state.customImage,
        screenshot: screenshot
      }

      // 3. 发送请求
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })

      const result = await response.json()

      if (result.success) {
        alert(`🎉 ${result.message}\n订单号: ${result.orderId}`)
      } else {
        alert('下单失败，请重试')
      }
    } catch (error) {
      console.error('下单出错:', error)
      alert('网络错误，无法连接到服务器')
    } finally {
      setLoading(false)
    }
  }

  return (
    // 🛠️ 修复 1: zIndex 设为 100，确保在 Canvas 之上
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
      
      {/* 1. 品牌 Logo */}
      <header style={{ position: 'absolute', top: 40, left: 40, zIndex: 110 }}>
        <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: '3em', fontWeight: 900, letterSpacing: '-0.05em', color: '#333' }}>
          MATSUSAKA
        </h1>
        <p style={{ marginTop: 5, fontSize: '1em', color: '#666', letterSpacing: '0.2em' }}>
          BESPOKE STUDIO
        </p>
      </header>

      <AnimatePresence>
        {snap.intro ? (
          <motion.section key="main" {...config} style={{ pointerEvents: 'auto' }}>
            
            {/* 2. 底部控制面板 */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              // 🛠️ 修复 2: 增加底部 padding，防止在某些屏幕被切掉
              padding: '20px 40px 60px', 
              background: 'rgba(255, 255, 255, 0.95)', // 增加不透明度，防止看不清
              backdropFilter: 'blur(10px)',
              borderTopLeftRadius: '30px',
              borderTopRightRadius: '30px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '25px',
              zIndex: 120 // 面板层级最高
            }}>
              
              {/* 第一行：款式 Tabs */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                {['transparent', 'leather', 'fabric'].map((type) => (
                  <button
                    key={type}
                    onClick={() => { 
                      state.caseType = type 
                      // 切换默认色
                      if(type === 'leather') state.color = '#1a1a1a'
                      if(type === 'transparent') state.color = '#ffffff'
                      if(type === 'fabric') state.color = '#f5f5f5'
                    }}
                    style={{
                      padding: '10px 25px',
                      borderRadius: '30px',
                      border: 'none',
                      background: snap.caseType === type ? '#000' : '#f0f0f0',
                      color: snap.caseType === type ? '#fff' : '#888',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      boxShadow: snap.caseType === type ? '0 4px 10px rgba(0,0,0,0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {type === 'transparent' && '🔮 晶莹透明'}
                    {type === 'leather' && '👜 奢华真皮'}
                    {type === 'fabric' && '🧶 手工布艺'}
                  </button>
                ))}
              </div>

              <div style={{ width: '100%', height: '1px', background: '#eee' }}></div>

              {/* 第二行：操作区 + 按钮 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                
                {/* 左侧动态操作区 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, flexWrap: 'wrap' }}>
                  
                  {/* A. 透明款操作 */}
                  {snap.caseType === 'transparent' && (
                    <>
                       <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: '#000', color:'#fff', padding: '10px 20px', borderRadius: '20px', fontWeight:'bold' }}>
                          📷 上传照片
                          <input type="file" accept="image/*" style={{display:'none'}} onChange={(e) => {
                              const file = e.target.files[0]
                              // 修复：将 texture 改为 customImage
                              if (file) state.customImage = URL.createObjectURL(file)
                          }}/>
                       </label>
                       
                       <input 
                         type="text" 
                         placeholder="输入你的名字..." 
                         value={snap.customText}
                         onChange={(e) => state.customText = e.target.value}
                         style={{ padding: '10px 15px', borderRadius: '15px', border: '2px solid #eee', outline: 'none', width: '200px', fontSize: '1rem' }}
                       />
                    </>
                  )}

                  {/* B. 皮质款操作 */}
                  {snap.caseType === 'leather' && (
                    <>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        {snap.leatherColors.map(c => (
                          <div key={c} onClick={() => state.color = c} style={{
                            width: 40, height: 40, borderRadius: '50%', background: c,
                            border: snap.color === c ? '3px solid #000' : '2px solid #eee',
                            cursor: 'pointer', transform: snap.color === c ? 'scale(1.1)' : 'scale(1)'
                          }}/>
                        ))}
                      </div>
                      <input 
                         type="text" placeholder="VIP" maxLength={5}
                         value={snap.customText}
                         onChange={(e) => state.customText = e.target.value.toUpperCase()}
                         style={{ padding: '10px 15px', borderRadius: '15px', border: '2px solid #eee', width: '100px', textAlign:'center', fontWeight:'bold' }}
                       />
                    </>
                  )}

                  {/* C. 布艺款操作 */}
                  {snap.caseType === 'fabric' && (
                    <>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {/* 🛠️ 优化：贴纸范围微调，防止飞出 */}
                        {['🧸', '🌸', '⭐', '🎀', '🧵'].map(emoji => (
                           <button key={emoji} onClick={() => state.patches.push({
                               id: Math.random(), 
                               content: emoji, 
                               x: (Math.random() - 0.5) * 0.5, // 左右范围缩小
                               y: (Math.random() - 0.5) * 1.0, // 上下范围
                               rotation: (Math.random() - 0.5) * Math.PI / 2
                           })} style={{ fontSize: '1.8em', background: 'white', border: '1px solid #eee', borderRadius:'10px', width:50, height:50, cursor: 'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' }}>
                             {emoji}
                           </button>
                        ))}
                        <button onClick={() => state.patches = []} style={{ fontSize: '0.9em', color: '#888', border: '1px solid #ddd', borderRadius: '10px', background: 'white', padding: '0 15px', height: 50, cursor:'pointer' }}>清除</button>
                      </div>
                      <div style={{ width: '1px', height: '40px', background: '#ddd', margin: '0 10px' }}></div>
                      {/* 布料颜色 */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {snap.fabricColors.map(c => (
                            <div key={c} onClick={() => state.color = c} style={{
                              width: 35, height: 35, borderRadius: '50%', background: c,
                              border: snap.color === c ? '2px solid #333' : '1px solid #ddd', cursor: 'pointer'
                            }}/>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* 右侧：下单按钮 */}
                <button 
                  onClick={handleOrder}
                  disabled={loading}
                  style={{
                    background: loading ? '#999' : '#000', 
                    color: '#fff', 
                    padding: '15px 40px', 
                    borderRadius: '40px', 
                    border: 'none', 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold', 
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                    minWidth: '180px',
                    transition: 'all 0.3s'
                  }}>
                  {loading ? '提交中...' : '完成设计 →'}
                </button>

              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  )
}