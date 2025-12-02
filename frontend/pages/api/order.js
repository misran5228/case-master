export default function handler(req, res) {
  if (req.method === 'POST') {
    const orderData = req.body;

    // 📦 这里模拟数据库保存操作
    console.log('====================================');
    console.log('🎉 收到新订单！(New Order Received)');
    console.log('------------------------------------');
    console.log('📱 款式 (Type):', orderData.caseType);
    console.log('🎨 颜色 (Color):', orderData.color);
    console.log('✍️ 文字 (Text):', orderData.customText || '无');
    console.log('🧩 布贴数量:', orderData.patches ? orderData.patches.length : 0);
    console.log('🖼️ 用户是否传图:', orderData.hasUserImage ? '是' : '否');
    console.log('====================================');

    // 真实项目中，这里会把 data 存入 MongoDB 或 MySQL
    
    res.status(200).json({ 
      success: true, 
      message: '订单提交成功！Matsusaka Studio 已收到您的定制需求。',
      orderId: 'ORD-' + Date.now() 
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}