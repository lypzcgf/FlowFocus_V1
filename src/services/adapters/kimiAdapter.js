/**
 * Kimi大模型适配器
 * 处理Moonshot AI Kimi模型的API调用
 */

import BaseModelAdapter from './baseModelAdapter.js';

class KimiAdapter extends BaseModelAdapter {
  constructor(config) {
    super(config);
    this.supportedModels = [
      'moonshot-v1-8k',
      'moonshot-v1-32k',
      'moonshot-v1-128k'
    ];
  }

  /**
   * 构建请求头
   * @returns {Object} 请求头
   */
  buildHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'User-Agent': 'FlowFocus/2.0.0'
    };
  }

  /**
   * 构建请求体
   * @param {Array} messages - 消息数组
   * @param {Object} options - 额外选项
   * @returns {Object} 请求体
   */
  buildRequestBody(messages, options = {}) {
    // 验证模型名称
    const model = this.modelEndpoint || 'moonshot-v1-8k';
    if (!this.supportedModels.includes(model)) {
      console.warn(`不支持的Kimi模型: ${model}，使用默认模型 moonshot-v1-8k`);
    }

    return {
      model: model,
      messages: messages,
      temperature: options.temperature || this.temperature,
      max_tokens: options.maxTokens || this.maxTokens,
      top_p: options.topP || 1,
      n: options.n || 1,
      stream: false,
      stop: options.stop || null,
      presence_penalty: options.presencePenalty || 0,
      frequency_penalty: options.frequencyPenalty || 0,
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
    if (response.choices && response.choices[0] && response.choices[0].message) {
      return response.choices[0].message.content;
    }
    
    // Kimi特殊响应格式处理
    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    }
    
    throw new Error('无效的Kimi响应格式');
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
        content: "你好，这是一个连接测试。请简单回复确认连接正常。" 
      }];
      const body = this.buildRequestBody(messages, { max_tokens: 30 });
      
      const response = await this.sendRequest(url, body);
      
      return {
        success: true,
        data: {
          response: this.extractContent(response),
          usage: response.usage || {},
          model: response.model || this.modelEndpoint,
          id: response.id
        },
        message: 'Kimi模型连接测试成功'
      };
    } catch (error) {
      console.error('Kimi连接测试失败:', error);
      return {
        success: false,
        error: error.message,
        message: 'Kimi模型连接测试失败'
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
      const systemPrompt = "你是Kimi，由 Moonshot AI 提供的人工智能助手。你是一个专业的文本改写专家，擅长根据用户需求对文本进行优化和改写，保持原意的同时提升表达效果。";
      const userPrompt = `请根据以下要求改写文本：\n\n改写要求：${prompt}\n\n原始文本：\n${text}\n\n请提供改写后的文本：`;
      
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
      
      // 根据文本长度选择合适的模型
      const textLength = text.length;
      let selectedModel = this.modelEndpoint;
      if (textLength > 6000 && this.supportedModels.includes('moonshot-v1-32k')) {
        selectedModel = 'moonshot-v1-32k';
      } else if (textLength > 25000 && this.supportedModels.includes('moonshot-v1-128k')) {
        selectedModel = 'moonshot-v1-128k';
      }
      
      const body = this.buildRequestBody(messages, {
        model: selectedModel,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || Math.min(Math.max(textLength * 1.5, 500), 4000),
        top_p: 0.9,
        ...options
      });
      
      const response = await this.sendRequest(url, body);
      const content = this.extractContent(response);
      
      return {
        success: true,
        data: content,
        usage: response.usage || {},
        model: response.model || selectedModel,
        id: response.id,
        message: 'Kimi文本改写成功'
      };
    } catch (error) {
      console.error('Kimi文本改写失败:', error);
      return {
        success: false,
        error: error.message,
        message: 'Kimi文本改写失败'
      };
    }
  }

  /**
   * 获取模型信息
   * @returns {Object} 模型信息
   */
  getModelInfo() {
    return {
      type: 'kimi',
      name: 'Kimi (Moonshot AI)',
      baseUrl: this.baseUrl,
      modelEndpoint: this.modelEndpoint,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      supportedModels: this.supportedModels,
      features: [
        '长文本处理',
        '多轮对话',
        '文档理解',
        '代码生成',
        '创意写作',
        '逻辑推理'
      ],
      contextLengths: {
        'moonshot-v1-8k': 8192,
        'moonshot-v1-32k': 32768,
        'moonshot-v1-128k': 131072
      }
    };
  }

  /**
   * 验证配置
   * @returns {Object} 验证结果
   */
  validateConfig() {
    const errors = [];
    
    if (!this.apiKey) {
      errors.push('Kimi API Key不能为空');
    }
    
    if (!this.baseUrl) {
      errors.push('Kimi Base URL不能为空');
    }
    
    if (!this.modelEndpoint) {
      errors.push('Kimi模型端点不能为空');
    } else if (!this.supportedModels.includes(this.modelEndpoint)) {
      errors.push(`不支持的Kimi模型: ${this.modelEndpoint}`);
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
      'short_text': {
        model: 'moonshot-v1-8k',
        temperature: 0.7,
        maxTokens: 1000
      },
      'long_text': {
        model: 'moonshot-v1-32k',
        temperature: 0.6,
        maxTokens: 2000
      },
      'document_analysis': {
        model: 'moonshot-v1-128k',
        temperature: 0.3,
        maxTokens: 4000
      },
      'creative_writing': {
        model: 'moonshot-v1-32k',
        temperature: 0.9,
        maxTokens: 3000
      }
    };
    
    return configs[useCase] || configs['short_text'];
  }
}

export default KimiAdapter;