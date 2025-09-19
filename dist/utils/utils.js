/**
 * 工具模块
 * 提供错误处理、重试机制和加密功能
 */

/**
 * 错误处理函数
 * @param {Error} error - 错误对象
 * @param {string} context - 错误上下文信息
 */
export function handleError(error, context = '') {
  console.error(`[FlowFocus Error] ${context}:`, error);
  
  // 显示错误消息给用户
  showErrorMessage(error.message, context);
}

/**
 * 显示错误消息给用户
 * @param {string} message - 错误消息
 * @param {string} context - 错误上下文
 */
function showErrorMessage(message, context = '') {
  // 在实际实现中，这里会显示一个用户友好的错误提示
  console.warn(`[FlowFocus Warning] ${context}: ${message}`);
}

/**
 * 重试函数
 * @param {Function} fn - 需要重试的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise<any>}
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 指数退避
      }
    }
  }
  
  throw lastError;
}

/**
 * 加密数据
 * @param {string} data - 需要加密的数据
 * @param {string} key - 加密密钥
 * @returns {string} 加密后的数据
 */
export function encrypt(data, key = '') {
  // 简单的加密实现示例（实际项目中应使用更安全的加密算法）
  if (!key) {
    // 如果没有提供密钥，返回原始数据
    return data;
  }
  
  // 这里只是一个简单的示例，实际项目中应该使用更安全的加密方法
  try {
    const encrypted = btoa(data); // Base64编码作为示例
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return data; // 加密失败时返回原始数据
  }
}

/**
 * 解密数据
 * @param {string} data - 需要解密的数据
 * @param {string} key - 解密密钥
 * @returns {string} 解密后的数据
 */
export function decrypt(data, key = '') {
  // 简单的解密实现示例（实际项目中应使用更安全的解密算法）
  if (!key) {
    // 如果没有提供密钥，返回原始数据
    return data;
  }
  
  // 这里只是一个简单的示例，实际项目中应该使用更安全的解密方法
  try {
    const decrypted = atob(data); // Base64解码作为示例
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return data; // 解密失败时返回原始数据
  }
}

/**
 * 生成UUID
 * @returns {string} UUID字符串
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}