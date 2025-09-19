/**
 * Volces大模型适配器
 * 处理Volces模型的API调用
 */

import BaseModelAdapter from './baseModelAdapter.js';

class VolcesAdapter extends BaseModelAdapter {
  constructor(config) {
    super(config);
    this.region = config.region || 'cn-beijing';
    this.endpointId = config.endpointId || config.modelEndpoint;
  }

  /**
   * 构建请求头
   * @returns {Object} 请求头
   */
  buildHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Region': this.region
    };
  }

  /**
   * 构建请求体
   * @param {Array} messages - 消息数组
   * @param {Object} options - 额外选项
   * @returns {Object} 请求体
   */
  buildRequestBody(messages, options = {}) {
    // 直接使用用户在界面填写的模型端点值，不使用默认值
    const model = options.model || this.endpointId;
    
    return {
      model: model,
      messages: messages,
      temperature: options.temperature || this.temperature,
      max_tokens: options.maxTokens || this.maxTokens,
      top_p: options.topP || 0.9,
      frequency_penalty: options.frequencyPenalty || 0,
      presence_penalty: options.presencePenalty || 0,
      stream: false,
      ...options
    };
  }

  /**
   * 获取API URL
   * @returns {string} API URL
   */
  getApiUrl() {
    return `${this.baseUrl}/chat/completions`;
  }

  /**
   * 提取响应内容
   * @param {Object} response - API响应
   * @returns {string} 提取的内容
   */
  extractContent(response) {
    if (response.choices && response.choices[0]) {
      const choice = response.choices[0];
      if (choice.message && choice.message.content) {
        return choice.message.content;
      }
      if (choice.text) {
        return choice.text;
      }
    }
    
    // Volces特殊响应格式处理
    if (response.output && response.output.text) {
      return response.output.text;
    }
    
    throw new Error('无效的Volces响应格式');
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
      const body = this.buildRequestBody(messages, { max_tokens: 20 });
      
      const response = await this.sendRequest(url, body);
      
      return {
        success: true,
        data: {
          response: this.extractContent(response),
          usage: response.usage || {},
          model: this.endpointId
        },
        message: 'Volces模型连接测试成功'
      };
    } catch (error) {
      console.error('Volces连接测试失败:', error);
      return {
        success: false,
        error: error.message,
        message: 'Volces模型连接测试失败'
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
      const systemPrompt = "你是一个专业的文本改写助手，请根据用户的要求对文本进行改写，保持原意的同时提升表达质量。";
      const userPrompt = `${prompt}\n\n原文：${text}\n\n请改写上述文本：`;
      
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      
      const body = this.buildRequestBody(messages, {
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || Math.max(text.length * 2, 500),
        top_p: 0.9,
        ...options
      });
      
      const response = await this.sendRequest(url, body);
      const content = this.extractContent(response);
      
      return {
        success: true,
        data: content,
        usage: response.usage || {},
        model: this.endpointId,
        message: 'Volces文本改写成功'
      };
    } catch (error) {
      console.error('Volces文本改写失败:', error);
      return {
        success: false,
        error: error.message,
        message: 'Volces文本改写失败'
      };
    }
  }

  /**
   * 获取模型信息
   * @returns {Object} 模型信息
   */
  getModelInfo() {
    return {
      type: 'volces',
      name: 'Volces大模型',
      baseUrl: this.baseUrl,
      endpointId: this.endpointId,
      region: this.region,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      features: [
        '中文优化',
        '多轮对话',
        '文本生成',
        '内容改写',
        '智能问答'
      ]
    };
  }

  /**
   * 验证配置
   * @returns {Object} 验证结果
   */
  validateConfig() {
    const errors = [];
    
    if (!this.apiKey) {
      errors.push('Volces API Key不能为空');
    }
    
    if (!this.baseUrl) {
      errors.push('Volces Base URL不能为空');
    }
    
    if (!this.endpointId) {
      errors.push('Volces Endpoint ID不能为空');
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
}

export default VolcesAdapter;