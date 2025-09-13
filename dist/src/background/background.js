/**
 * 后台服务
 * 负责处理大模型API调用和其他后台任务
 */
import storageService from '../services/storageService.js';
import modelService from '../services/modelService.js';

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

// 监听扩展图标点击事件，直接打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 获取当前窗口ID
    const windowId = tab.windowId;
    // 打开侧边栏
    await chrome.sidePanel.open({windowId});
  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

/**
 * 处理文本改写请求
 * @param {Object} data - 请求数据
 * @param {Function} sendResponse - 响应函数
 */
async function handleRewriteText(data, sendResponse) {
  try {
    // 获取模型配置
    const config = await storageService.getModelConfig(data.model);
    if (!config) {
      sendResponse({ 
        success: false, 
        error: '未找到模型配置' 
      });
      return;
    }
    
    // 调用模型服务进行文本改写
    const response = await modelService.rewriteText(config, data.text, data.prompt);
    sendResponse(response);
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
    // 调用模型服务测试连接
    const response = await modelService.testConnection(data);
    sendResponse(response);
  } catch (error) {
    console.error('Test model connection error:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// 监听侧边栏面板显示事件（添加存在性检查）
if (chrome.sidePanel && chrome.sidePanel.onPanelShown) {
  chrome.sidePanel.onPanelShown.addListener(() => {
    console.log('FlowFocus side panel shown');
  });
}

console.log('FlowFocus background service initialized');