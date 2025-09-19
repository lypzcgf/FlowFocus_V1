/**
 * 基础模型适配器
 * 为所有大模型适配器提供通用功能
 */

// import { retry } from '../../utils/utils.js';

// 临时实现retry函数
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

class BaseModelAdapter {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.modelEndpoint = config.modelEndpoint;
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;
  }

  /**
   * 构建请求头
   * @returns {Object} 请求头
   */
  buildHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  /**
   * 构建基础请求体
   * @param {Array} messages - 消息数组
   * @param {Object} options - 额外选项
   * @returns {Object} 请求体
   */
  buildRequestBody(messages, options = {}) {
    return {
      model: this.modelEndpoint,
      messages: messages,
      temperature: options.temperature || this.temperature,
      max_tokens: options.maxTokens || this.maxTokens,
      ...options
    };
  }

  /**
   * 发送HTTP请求
   * @param {string} url - 请求URL
   * @param {Object} body - 请求体
   * @param {Object} headers - 请求头
   * @returns {Promise<Object>} 响应数据
   */
  async sendRequest(url, body, headers = null) {
    const requestHeaders = headers || this.buildHeaders();
    
    return await retry(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    }, 3, 1000);
  }

  /**
   * 提取响应内容
   * @param {Object} response - API响应
   * @returns {string} 提取的内容
   */
  extractContent(response) {
    if (response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content;
    }
    throw new Error('无效的响应格式');
  }

  /**
   * 测试连接
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection() {
    try {
      const url = this.getApiUrl();
      const messages = [{ role: "user", content: "Hello, this is a connection test." }];
      const body = this.buildRequestBody(messages, { max_tokens: 10 });
      const headers = this.buildHeaders();
      
      console.log('测试连接 - URL:', url);
      console.log('测试连接 - Headers:', headers);
      console.log('测试连接 - Body:', body);
      
      const response = await this.sendRequest(url, body, headers);
      
      console.log('测试连接 - 响应:', response);
      
      return {
        success: true,
        data: response,
        message: '连接测试成功'
      };
    } catch (error) {
      console.error('连接测试失败 - 详细错误:', {
        message: error.message,
        stack: error.stack,
        url: this.getApiUrl(),
        headers: this.buildHeaders(),
        config: {
          baseUrl: this.baseUrl,
          modelEndpoint: this.modelEndpoint,
          apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'undefined'
        }
      });
      
      return {
        success: false,
        error: error.message,
        message: `连接测试失败: ${error.message}`
      };
    }
  }

  /**
   * 文本改写
   * @param {string} text - 待改写文本
   * @param {string} prompt - 改写提示
   * @param {Object} options - 额外选项
   * @returns {Promise<Object>} 改写结果
   */
  async rewriteText(text, prompt, options = {}) {
    try {
      const url = this.getApiUrl();
      const fullPrompt = `${prompt}\n\n${text}`;
      const messages = [{ role: "user", content: fullPrompt }];
      const body = this.buildRequestBody(messages, options);
      
      const response = await this.sendRequest(url, body);
      const content = this.extractContent(response);
      
      return {
        success: true,
        data: content,
        usage: response.usage || {},
        message: '改写成功'
      };
    } catch (error) {
      console.error('文本改写失败:', error);
      return {
        success: false,
        error: error.message,
        message: '文本改写失败'
      };
    }
  }

  /**
   * 获取API URL（子类需要实现）
   * @returns {string} API URL
   */
  getApiUrl() {
    throw new Error('子类必须实现 getApiUrl 方法');
  }

  /**
   * 获取模型信息
   * @returns {Object} 模型信息
   */
  getModelInfo() {
    return {
      type: this.constructor.name.replace('Adapter', '').toLowerCase(),
      baseUrl: this.baseUrl,
      modelEndpoint: this.modelEndpoint,
      temperature: this.temperature,
      maxTokens: this.maxTokens
    };
  }
}

export default BaseModelAdapter;