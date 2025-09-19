/**
 * Hunyuan大模型适配器
 * 处理腾讯混元大模型的API调用
 */

import BaseModelAdapter from './baseModelAdapter.js';

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

class HunyuanAdapter extends BaseModelAdapter {
  constructor(config) {
    super(config);
    this.supportedModels = [
      'hunyuan-lite',
      'hunyuan-standard',
      'hunyuan-pro',
      'hunyuan-turbo',
      'hunyuan-turbos-latest'
    ];
    this.region = config.region || 'ap-beijing';
    this.secretId = config.secretId;
    this.secretKey = config.secretKey;
  }

  /**
   * 构建请求头
   * @returns {Object} 请求头
   */
  buildHeaders() {
    const timestamp = Math.floor(Date.now() / 1000);
    
    return {
      'Content-Type': 'application/json',
      'Authorization': this.buildAuthHeader(timestamp),
      'X-TC-Version': '2023-09-01',
      'X-TC-Action': 'ChatCompletions',
      'X-TC-Region': this.region,
      'X-TC-Timestamp': timestamp.toString(),
      'X-TC-Language': 'zh-CN'
    };
  }

  /**
   * 构建认证头
   * @param {number} timestamp - 时间戳
   * @returns {string} 认证头
   */
  buildAuthHeader(timestamp) {
    // 简化的认证实现，实际使用时需要完整的腾讯云签名算法
    if (this.apiKey) {
      return `Bearer ${this.apiKey}`;
    }
    
    // 如果使用secretId/secretKey，需要实现完整的签名算法
    if (this.secretId && this.secretKey) {
      // 这里应该实现腾讯云的签名算法
      // 为了简化，暂时使用Bearer token格式
      return `TC3-HMAC-SHA256 Credential=${this.secretId}/${timestamp}`;
    }
    
    throw new Error('缺少有效的认证信息');
  }

  /**
   * 构建请求体
   * @param {Array} messages - 消息数组
   * @param {Object} options - 额外选项
   * @returns {Object} 请求体
   */
  buildRequestBody(messages, options = {}) {
    // 验证模型名称
    const model = this.modelEndpoint || 'hunyuan-lite';
    if (!this.supportedModels.includes(model)) {
      console.warn(`不支持的Hunyuan模型: ${model}，使用默认模型 hunyuan-lite`);
    }

    return {
      Model: model,
      Messages: messages.map(msg => ({
        Role: msg.role,
        Content: msg.content
      })),
      Temperature: options.temperature || this.temperature,
      MaxTokens: options.maxTokens || this.maxTokens,
      TopP: options.topP || 1,
      Stream: false,
      ...options
    };
  }

  /**
   * 获取API URL
   * @returns {string} API URL
   */
  getApiUrl() {
    // 根据腾讯云Hunyuan API文档，完整的API路径应该包含ChatCompletions端点
    // 确保URL格式正确，不以斜杠结尾
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    // 添加正确的端点路径
    return `${cleanBaseUrl}/chat/completions`;
  }

  /**
   * 发送HTTP请求（重写以适配腾讯云API格式）
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
      
      const result = await response.json();
      
      // 检查腾讯云API错误
      if (result.Response && result.Response.Error) {
        throw new Error(`Hunyuan API Error: ${result.Response.Error.Message}`);
      }
      
      return result;
    }, 3, 1000);
  }

  /**
   * 提取响应内容
   * @param {Object} response - API响应
   * @returns {string} 提取的内容
   */
  extractContent(response) {
    // 腾讯云API响应格式
    if (response.Response && response.Response.Choices && response.Response.Choices[0]) {
      const choice = response.Response.Choices[0];
      if (choice.Message && choice.Message.Content) {
        return choice.Message.Content;
      }
    }
    
    // 标准OpenAI格式兼容
    if (response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content;
    }
    
    throw new Error('无效的Hunyuan响应格式');
  }

  /**
   * 测试连接
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection() {
    try {
      const url = this.getApiUrl();
      const messages = [{ 
        role: "user", 
        content: "你好，这是一个连接测试。请简单回复确认。" 
      }];
      const body = this.buildRequestBody(messages, { MaxTokens: 20 });
      
      // 添加调试日志，记录实际使用的URL和请求参数
      console.log('Hunyuan测试连接 - 完整URL:', url);
      console.log('Hunyuan测试连接 - 请求体:', body);
      console.log('Hunyuan测试连接 - 模型类型:', this.modelEndpoint);
      console.log('Hunyuan测试连接 - Base URL设置:', this.baseUrl);
      
      const response = await this.sendRequest(url, body);
      
      return {
        success: true,
        data: {
          response: this.extractContent(response),
          usage: response.Response?.Usage || response.usage || {},
          model: this.modelEndpoint,
          requestId: response.Response?.RequestId
        },
        message: 'Hunyuan模型连接测试成功'
      };
    } catch (error) {
      console.error('Hunyuan连接测试失败:', error);
      // 增强错误信息，包含更多上下文
      const enhancedError = `连接失败: ${error.message}。\nURL: ${this.getApiUrl()}\n模型: ${this.modelEndpoint}`;
      return {
        success: false,
        error: enhancedError,
        message: 'Hunyuan模型连接测试失败'
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
      
      // 构建优化的提示词
      const systemPrompt = "你是腾讯混元大模型，一个专业的中文文本改写助手。请根据用户要求对文本进行改写，保持原意的同时优化表达方式。";
      const userPrompt = `改写要求：${prompt}\n\n原文：\n${text}\n\n请提供改写后的文本：`;
      
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      
      const body = this.buildRequestBody(messages, {
        Temperature: options.temperature || 0.7,
        MaxTokens: options.maxTokens || Math.max(text.length * 2, 500),
        TopP: 0.9,
        ...options
      });
      
      const response = await this.sendRequest(url, body);
      const content = this.extractContent(response);
      
      return {
        success: true,
        data: content,
        usage: response.Response?.Usage || response.usage || {},
        model: this.modelEndpoint,
        requestId: response.Response?.RequestId,
        message: 'Hunyuan文本改写成功'
      };
    } catch (error) {
      console.error('Hunyuan文本改写失败:', error);
      return {
        success: false,
        error: error.message,
        message: 'Hunyuan文本改写失败'
      };
    }
  }

  /**
   * 获取模型信息
   * @returns {Object} 模型信息
   */
  getModelInfo() {
    return {
      type: 'hunyuan',
      name: '腾讯混元大模型',
      baseUrl: this.baseUrl,
      modelEndpoint: this.modelEndpoint,
      region: this.region,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      supportedModels: this.supportedModels,
      features: [
        '中文优化',
        '多轮对话',
        '文本生成',
        '代码理解',
        '逻辑推理',
        '创意写作',
        '知识问答'
      ],
      modelCapabilities: {
        'hunyuan-lite': '轻量版，快速响应',
        'hunyuan-standard': '标准版，平衡性能',
        'hunyuan-pro': '专业版，高质量输出',
        'hunyuan-turbo': '加速版，极速响应'
      }
    };
  }

  /**
   * 验证配置
   * @returns {Object} 验证结果
   */
  validateConfig() {
    const errors = [];
    
    if (!this.apiKey && (!this.secretId || !this.secretKey)) {
      errors.push('Hunyuan需要API Key或SecretId/SecretKey');
    }
    
    if (!this.baseUrl) {
      errors.push('Hunyuan Base URL不能为空');
    }
    
    if (!this.modelEndpoint) {
      errors.push('Hunyuan模型端点不能为空');
    } else if (!this.supportedModels.includes(this.modelEndpoint)) {
      errors.push(`不支持的Hunyuan模型: ${this.modelEndpoint}`);
    }
    
    if (this.temperature < 0 || this.temperature > 2) {
      errors.push('温度值必须在0-2之间');
    }
    
    if (this.maxTokens < 1 || this.maxTokens > 8000) {
      errors.push('最大令牌数必须在1-8000之间');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取推荐的模型配置
   * @param {string} useCase - 使用场景
   * @returns {Object} 推荐配置
   */
  getRecommendedConfig(useCase) {
    const configs = {
      'fast_response': {
        model: 'hunyuan-turbo',
        temperature: 0.7,
        maxTokens: 1000
      },
      'balanced': {
        model: 'hunyuan-standard',
        temperature: 0.7,
        maxTokens: 2000
      },
      'high_quality': {
        model: 'hunyuan-pro',
        temperature: 0.6,
        maxTokens: 3000
      },
      'lightweight': {
        model: 'hunyuan-lite',
        temperature: 0.8,
        maxTokens: 800
      }
    };
    
    return configs[useCase] || configs['balanced'];
  }
}

export default HunyuanAdapter;