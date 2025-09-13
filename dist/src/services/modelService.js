/**
 * 大模型服务
 * 处理不同大模型的API调用
 */

import { retry } from '../utils/utils.js';
import storageService from './storageService.js';

class ModelService {
  // 支持的模型类型
  static MODEL_TYPES = {
    QWEN: 'qwen',
    DEEPSEEK: 'deepseek'
  };

  // 默认配置
  static DEFAULT_CONFIGS = {
    [ModelService.MODEL_TYPES.QWEN]: {
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      modelName: 'qwen-max'
    },
    [ModelService.MODEL_TYPES.DEEPSEEK]: {
      baseUrl: 'https://api.deepseek.com/v1',
      modelName: 'deepseek-chat'
    }
  };

  /**
   * 测试模型连接
   * @param {Object} config - 模型配置
   * @returns {Promise<Object>}
   */
  async testConnection(config) {
    try {
      // 根据模型类型获取默认配置
      const defaultConfig = ModelService.DEFAULT_CONFIGS[config.modelType];
      
      if (!defaultConfig) {
        throw new Error(`不支持的模型类型: ${config.modelType}`);
      }
      
      // 构建请求URL
      const baseUrl = config.baseUrl || defaultConfig.baseUrl;
      const modelEndpoint = config.modelEndpoint || defaultConfig.modelName;
      const url = `${baseUrl}/chat/completions`;
      
      // 构建测试请求
      const requestBody = {
        model: modelEndpoint,
        messages: [{ role: "user", content: "Hello, this is a connection test." }],
        max_tokens: 10
      };
      
      // 发送测试请求
      const response = await retry(async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        return res.json();
      }, 3, 1000);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('模型连接测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 调用AI模型进行文本改写
   * @param {Object} config - 模型配置
   * @param {string} text - 待改写的文本
   * @param {string} prompt - 改写提示词
   * @returns {Promise<Object>}
   */
  async rewriteText(config, text, prompt) {
    try {
      // 根据模型类型获取默认配置
      const defaultConfig = ModelService.DEFAULT_CONFIGS[config.modelType];
      
      if (!defaultConfig) {
        throw new Error(`不支持的模型类型: ${config.modelType}`);
      }
      
      // 构建请求URL
      const baseUrl = config.baseUrl || defaultConfig.baseUrl;
      const modelEndpoint = config.modelEndpoint || defaultConfig.modelName;
      const url = `${baseUrl}/chat/completions`;
      
      // 构建改写请求
      const fullPrompt = `${prompt}\n\n${text}`;
      const requestBody = {
        model: modelEndpoint,
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.7
      };
      
      // 发送改写请求
      const response = await retry(async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        return res.json();
      }, 3, 1000);
      
      // 提取改写结果
      const rewriteResult = response.choices && response.choices[0] && response.choices[0].message 
        ? response.choices[0].message.content 
        : '改写失败：未收到有效响应';
      
      return {
        success: true,
        data: rewriteResult
      };
    } catch (error) {
      console.error('文本改写失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取默认Base URL
   * @param {string} modelType - 模型类型
   * @returns {string|null}
   */
  getDefaultBaseUrl(modelType) {
    const config = ModelService.DEFAULT_CONFIGS[modelType];
    return config ? config.baseUrl : null;
  }

  /**
   * 获取所有支持的模型类型
   * @returns {Array}
   */
  getSupportedModelTypes() {
    return Object.values(ModelService.MODEL_TYPES);
  }
}

// 导出大模型服务实例
const modelService = new ModelService();
export default modelService;