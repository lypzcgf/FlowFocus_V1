/**
 * FlowFocus 内容脚本 v2.0
 * 负责与网页内容交互，提供增强的文本获取功能
 */

console.log('FlowFocus Content Script v2.0 开始加载...');

// 全局错误处理
window.addEventListener('error', function(e) {
    const errorInfo = {
        message: e.message || '未知错误',
        filename: e.filename || '未知文件',
        lineno: e.lineno || '未知行号',
        colno: e.colno || '未知列号',
        error: e.error,
        stack: e.error ? e.error.stack : '无堆栈信息',
        timestamp: new Date().toISOString()
    };
    console.error('FlowFocus Content Script 详细错误信息:', errorInfo);
});

// Promise错误处理
window.addEventListener('unhandledrejection', function(e) {
    console.error('FlowFocus Content Script Promise错误:', {
        reason: e.reason,
        promise: e.promise,
        timestamp: new Date().toISOString()
    });
});

// 检查Chrome扩展API可用性
function checkChromeAPI() {
    try {
        if (typeof chrome === 'undefined') {
            console.error('Chrome API 不可用');
            return false;
        }
        if (!chrome.runtime) {
            console.error('chrome.runtime 不可用');
            return false;
        }
        if (!chrome.runtime.id) {
            console.error('chrome.runtime.id 不可用，扩展上下文可能已失效');
            return false;
        }
        console.log('Chrome API 检查通过，扩展ID:', chrome.runtime.id);
        return true;
    } catch (error) {
        console.error('检查Chrome API时出错:', error);
        return false;
    }
}

// 安全的消息发送函数
function safeSendResponse(sendResponse, data) {
    try {
        if (typeof sendResponse === 'function') {
            sendResponse(data);
            console.log('FlowFocus 响应发送成功:', data);
        } else {
            console.error('sendResponse 不是函数');
        }
    } catch (error) {
        console.error('发送响应时出错:', error);
    }
}

/**
 * 获取用户选中的文本
 * @returns {string} 选中的文本
 */
function getSelectedText() {
    try {
        const selection = window.getSelection();
        return selection ? selection.toString().trim() : '';
    } catch (error) {
        console.error('获取选中文本失败:', error);
        return '';
    }
}

/**
 * 获取页面主要内容（备选方案）
 * @returns {string} 页面主要内容
 */
function getPageMainContent() {
    try {
        // 尝试获取页面主要内容区域
        const article = document.querySelector('article') || 
                       document.querySelector('[role="main"]') || 
                       document.querySelector('.content') ||
                       document.querySelector('main') ||
                       document.body;
        
        if (article) {
            const text = article.innerText || article.textContent || '';
            // 限制文本长度，避免过长
            return text.length > 5000 ? text.substring(0, 5000) + '...' : text;
        }
        
        return '';
    } catch (error) {
        console.error('获取页面主要内容失败:', error);
        return '';
    }
}

/**
 * 处理获取选中文本的请求
 * @param {Function} sendResponse 响应函数
 */
function handleGetSelectedText(sendResponse) {
    try {
        console.log('处理 getSelectedText 请求');
        
        const selectedText = getSelectedText();
        
        console.log('获取到的选中文本长度:', selectedText.length);
        
        safeSendResponse(sendResponse, {
            success: true,
            data: selectedText,
            hasSelection: selectedText.length > 0
        });
    } catch (error) {
        console.error('handleGetSelectedText 出错:', error);
        safeSendResponse(sendResponse, {
            success: false,
            error: 'handleGetSelectedText 出错: ' + error.message,
            data: ''
        });
    }
}

/**
 * 处理获取文本用于改写的请求（增强版）
 * @param {Function} sendResponse 响应函数
 */
function handleGetTextForRewrite(sendResponse) {
    try {
        console.log('处理 getTextForRewrite 请求');
        
        const selectedText = getSelectedText();
        
        console.log('改写文本长度:', selectedText.length);
        
        if (selectedText.length > 0) {
            safeSendResponse(sendResponse, {
                success: true,
                data: selectedText,
                type: 'selection',
                source: '选中文本'
            });
        } else {
            // 如果没有选中文本，可以选择获取页面主要内容或返回空
            // 这里选择返回空，让用户明确知道需要选中文本
            safeSendResponse(sendResponse, {
                success: true,
                data: '',
                type: 'empty',
                source: '无选中文本'
            });
        }
    } catch (error) {
        console.error('handleGetTextForRewrite 出错:', error);
        safeSendResponse(sendResponse, {
            success: false,
            error: 'handleGetTextForRewrite 出错: ' + error.message,
            data: ''
        });
    }
}

/**
 * 处理ping请求
 * @param {Function} sendResponse 响应函数
 */
function handlePing(sendResponse) {
    try {
        console.log('处理 ping 请求');
        safeSendResponse(sendResponse, { 
            success: true, 
            message: 'FlowFocus Content script v2.0 is ready',
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('handlePing 出错:', error);
        safeSendResponse(sendResponse, { 
            success: false, 
            error: 'handlePing 出错: ' + error.message 
        });
    }
}

/**
 * 处理消息
 * @param {Object} message 消息对象
 * @param {Object} sender 发送者
 * @param {Function} sendResponse 响应函数
 */
function handleMessage(message, sender, sendResponse) {
    try {
        console.log('FlowFocus 处理消息:', message.action);
        
        if (!message || !message.action) {
            safeSendResponse(sendResponse, { 
                success: false, 
                error: '无效的请求' 
            });
            return;
        }

        switch (message.action) {
            case 'ping':
                handlePing(sendResponse);
                break;
            case 'getSelectedText':
                handleGetSelectedText(sendResponse);
                break;
            case 'getTextForRewrite':
                handleGetTextForRewrite(sendResponse);
                break;
            default:
                console.log('未知的操作类型:', message.action);
                safeSendResponse(sendResponse, { 
                    success: false, 
                    error: 'Unknown action: ' + message.action 
                });
        }
    } catch (error) {
        console.error('handleMessage 出错:', error);
        safeSendResponse(sendResponse, { 
            success: false, 
            error: 'handleMessage 出错: ' + error.message 
        });
    }
}

/**
 * 设置消息监听器
 */
function setupMessageListener() {
    try {
        console.log('设置FlowFocus消息监听器');
        
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('FlowFocus收到消息:', message);
            
            try {
                // 再次检查Chrome API
                if (!checkChromeAPI()) {
                    safeSendResponse(sendResponse, { 
                        success: false, 
                        error: 'Chrome API 不可用' 
                    });
                    return false;
                }

                handleMessage(message, sender, sendResponse);
                return true; // 保持消息通道开放
            } catch (error) {
                console.error('处理消息时出错:', error);
                safeSendResponse(sendResponse, { 
                    success: false, 
                    error: '处理消息时出错: ' + error.message 
                });
                return false;
            }
        });
        
        console.log('FlowFocus消息监听器设置完成');
    } catch (error) {
        console.error('设置消息监听器时出错:', error);
    }
}

// 安全初始化
try {
    console.log('开始安全初始化 FlowFocus Content Script v2.0');
    
    // 检查Chrome API
    if (!checkChromeAPI()) {
        console.error('Chrome API 不可用，停止初始化');
    } else {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOM 加载完成，设置FlowFocus消息监听器');
                setupMessageListener();
            });
        } else {
            console.log('DOM 已加载，直接设置FlowFocus消息监听器');
            setupMessageListener();
        }
    }
    
    console.log('FlowFocus Content Script v2.0 加载完成');
} catch (error) {
    console.error('FlowFocus Content Script v2.0 初始化失败:', error);
}

// 防止重复加载
if (!window.flowFocusContentScriptLoaded) {
    window.flowFocusContentScriptLoaded = true;
    console.log('FlowFocus Content Script v2.0 标记为已加载');
} else {
    console.warn('FlowFocus Content Script v2.0 重复加载');
}