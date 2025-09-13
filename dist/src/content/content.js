/**
 * 内容脚本
 * 负责与网页内容交互
 */

/**
 * 获取用户选中的文本
 * @returns {string} 选中的文本
 */
function getSelectedText() {
  return window.getSelection().toString().trim();
}

/**
 * 监听来自侧边栏的请求
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getSelectedText':
      const selectedText = getSelectedText();
      sendResponse({ 
        success: true, 
        data: selectedText 
      });
      break;
    default:
      sendResponse({ 
        success: false, 
        error: 'Unknown action' 
      });
  }
  
  return true;
});

console.log('FlowFocus content script loaded');