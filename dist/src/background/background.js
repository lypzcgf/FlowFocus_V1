/**
 * 后台服务
 * 负责处理大模型API调用和其他后台任务
 */

// 监听来自内容脚本和侧边栏的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  switch (message.action) {
    case 'rewriteText':
      handleRewriteText(message.data, sendResponse);
      break;
    case 'testModelConnection':
      handleTestModelConnection(message.data, sendResponse);
      break;
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  // 保持消息通道开放以进行异步响应
  return true;
});

/**
 * 处理文本改写请求
 * @param {Object} data - 请求数据
 * @param {Function} sendResponse - 响应函数
 */
async function handleRewriteText(data, sendResponse) {
  try {
    // 这里将实现实际的AI模型调用逻辑
    // 目前返回模拟数据用于测试
    const mockResult = `改写后的文本: ${data.text}`;
    
    sendResponse({ 
      success: true, 
      data: mockResult 
    });
  } catch (error) {
    console.error('Rewrite text error:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * 处理模型连接测试请求
 * @param {Object} data - 请求数据
 * @param {Function} sendResponse - 响应函数
 */
async function handleTestModelConnection(data, sendResponse) {
  try {
    // 这里将实现实际的模型连接测试逻辑
    // 目前返回模拟数据用于测试
    
    sendResponse({ 
      success: true, 
      data: '连接成功' 
    });
  } catch (error) {
    console.error('Test model connection error:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

console.log('FlowFocus background service initialized');