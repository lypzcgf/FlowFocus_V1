/**
 * 模型适配器工厂
 * 统一管理和创建各种大模型适配器
 */

import BaseModelAdapter from './baseModelAdapter.js';
import VolcesAdapter from './volcesAdapter.js';
import KimiAdapter from './kimiAdapter.js';
import HunyuanAdapter from './hunyuanAdapter.js';
import { MODEL_TYPES, MODEL_CONFIGS } from '../../utils/constants.js';

/**
 * Qwen模型适配器
 */
class QwenAdapter extends BaseModelAdapter {
  constructor(config) {
    super(config);
  }

  getApiUrl() {
    // 使用OpenAI兼容模式，baseUrl已包含完整路径
    return `${this.baseUrl}/chat/completions`;
  }

  buildHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-DashScope-SSE': 'disable'
    };
  }

  getModelInfo() {
    return {
      type: 'qwen',
      name: '通义千问',
      baseUrl: this.baseUrl,
      modelEndpoint: this.modelEndpoint,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      features: [
        '中文优化',
        '多轮对话',
        '代码生成',
        '文档理解',
        '逻辑推理'
      ]
    };
  }
}

/**
 * DeepSeek模型适配器
 */
class DeepSeekAdapter extends BaseModelAdapter {
  constructor(config) {
    super(config);
  }

  getApiUrl() {
    return `${this.baseUrl}/v1/chat/completions`;
  }

  buildHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'User-Agent': 'FlowFocus/2.0.0'
    };
  }

  getModelInfo() {
    return {
      type: 'deepseek',
      name: 'DeepSeek',
      baseUrl: this.baseUrl,
      modelEndpoint: this.modelEndpoint,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      features: [
        '代码专精',
        '逻辑推理',
        '数学计算',
        '技术文档',
        '算法优化'
      ]
    };
  }
}

/**
 * 模型适配器工厂类
 */
class ModelAdapterFactory {
  // 适配器映射
  static ADAPTERS = {
    [MODEL_TYPES.QWEN]: QwenAdapter,
    [MODEL_TYPES.DEEPSEEK]: DeepSeekAdapter,
    [MODEL_TYPES.VOLCES]: VolcesAdapter,
    [MODEL_TYPES.KIMI]: KimiAdapter,
    [MODEL_TYPES.HUNYUAN]: HunyuanAdapter
  };

  /**
   * 创建模型适配器
   * @param {string} modelType - 模型类型
   * @param {Object} config - 模型配置
   * @returns {BaseModelAdapter} 模型适配器实例
   */
  static createAdapter(modelType, config) {
    const AdapterClass = this.ADAPTERS[modelType];
    
    if (!AdapterClass) {
      throw new Error(`不支持的模型类型: ${modelType}`);
    }
    
    // 合并默认配置
    const defaultConfig = MODEL_CONFIGS[modelType] || {};
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      modelType
    };
    
    return new AdapterClass(mergedConfig);
  }

  /**
   * 获取支持的模型类型列表
   * @returns {Array<string>} 支持的模型类型
   */
  static getSupportedModelTypes() {
    return Object.keys(this.ADAPTERS);
  }

  /**
   * 检查模型类型是否支持
   * @param {string} modelType - 模型类型
   * @returns {boolean} 是否支持
   */
  static isModelTypeSupported(modelType) {
    return modelType in this.ADAPTERS;
  }

  /**
   * 获取模型的默认配置
   * @param {string} modelType - 模型类型
   * @returns {Object} 默认配置
   */
  static getDefaultConfig(modelType) {
    if (!this.isModelTypeSupported(modelType)) {
      throw new Error(`不支持的模型类型: ${modelType}`);
    }
    
    return MODEL_CONFIGS[modelType] || {};
  }

  /**
   * 验证模型配置
   * @param {string} modelType - 模型类型
   * @param {Object} config - 模型配置
   * @returns {Object} 验证结果
   */
  static validateConfig(modelType, config) {
    try {
      const adapter = this.createAdapter(modelType, config);
      
      if (typeof adapter.validateConfig === 'function') {
        return adapter.validateConfig();
      }
      
      // 基础验证
      const errors = [];
      
      if (!config.apiKey) {
        errors.push('API密钥不能为空');
      }
      
      if (!config.baseUrl) {
        errors.push('Base URL不能为空');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * 获取所有模型的信息
   * @returns {Array<Object>} 模型信息列表
   */
  static getAllModelInfo() {
    return this.getSupportedModelTypes().map(modelType => {
      const defaultConfig = this.getDefaultConfig(modelType);
      const tempAdapter = this.createAdapter(modelType, {
        ...defaultConfig,
        apiKey: 'temp',
        baseUrl: defaultConfig.baseUrl
      });
      
      return tempAdapter.getModelInfo();
    });
  }

  /**
   * 批量创建适配器
   * @param {Array<Object>} configs - 配置数组
   * @returns {Array<BaseModelAdapter>} 适配器数组
   */
  static createAdapters(configs) {
    return configs.map(config => {
      if (!config.type) {
        throw new Error('配置中缺少模型类型');
      }
      
      return this.createAdapter(config.type, config);
    });
  }

  /**
   * 获取推荐的模型配置
   * @param {string} modelType - 模型类型
   * @param {string} useCase - 使用场景
   * @returns {Object} 推荐配置
   */
  static getRecommendedConfig(modelType, useCase = 'general') {
    if (!this.isModelTypeSupported(modelType)) {
      throw new Error(`不支持的模型类型: ${modelType}`);
    }
    
    const defaultConfig = this.getDefaultConfig(modelType);
    
    // 根据使用场景调整配置
    const useCaseConfigs = {
      'creative': {
        temperature: 0.9,
        maxTokens: 2000
      },
      'analytical': {
        temperature: 0.3,
        maxTokens: 1500
      },
      'balanced': {
        temperature: 0.7,
        maxTokens: 1800
      },
      'general': {
        temperature: 0.7,
        maxTokens: 2000
      }
    };
    
    return {
      ...defaultConfig,
      ...(useCaseConfigs[useCase] || useCaseConfigs['general'])
    };
  }

  /**
   * 注册新的适配器
   * @param {string} modelType - 模型类型
   * @param {Class} AdapterClass - 适配器类
   */
  static registerAdapter(modelType, AdapterClass) {
    if (!(AdapterClass.prototype instanceof BaseModelAdapter)) {
      throw new Error('适配器类必须继承自BaseModelAdapter');
    }
    
    this.ADAPTERS[modelType] = AdapterClass;
  }

  /**
   * 注销适配器
   * @param {string} modelType - 模型类型
   */
  static unregisterAdapter(modelType) {
    delete this.ADAPTERS[modelType];
  }
}

export default ModelAdapterFactory;
export {
  QwenAdapter,
  DeepSeekAdapter,
  VolcesAdapter,
  KimiAdapter,
  HunyuanAdapter,
  BaseModelAdapter
};