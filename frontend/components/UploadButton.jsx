import React from 'react';
import { useSnapshot } from 'valtio';
import state from '../store';

export default function UploadButton() {
  const snap = useSnapshot(state);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // 1. 存入状态
        state.customImage = event.target.result;
        // 2. 强制切换回透明壳模式查看效果
        state.caseType = 'transparent'; 
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ 
      position: 'absolute', 
      bottom: '40px', 
      left: '50%', 
      transform: 'translateX(-50%)', 
      zIndex: 1000,
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '10px'
    }}>
      <label style={{
        background: '#000', color: '#fff', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer',
        fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '5px'
      }}>
        <span>📷 上传图片定制</span>
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      </label>

      {snap.customImage && (
        <button 
          onClick={() => state.customImage = null}
          style={{
            background: '#fff', color: '#000', border: 'none', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer'
          }}
        >
          清除图片
        </button>
      )}
    </div>
  );
}