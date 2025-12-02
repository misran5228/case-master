import { proxy } from 'valtio';

const state = proxy({
  intro: true,
  
  // 基础状态
  color: '#ffffff',
  caseType: "transparent", // transparent / leather / fabric
  
  // 定制数据
  customImage: null, // 🔥 统一使用 customImage 存储图片 URL
  customText: "",
  patches: [],       // 布艺款的贴纸
  
  // 选项配置 (供 Overlay 使用，防止报错)
  leatherColors: ['#1a1a1a', '#8D6E63', '#E64A19', '#1976D2'],
  fabricColors: ['#f5f5f5', '#333333', '#3F51B5', '#009688'],
});

export default state;