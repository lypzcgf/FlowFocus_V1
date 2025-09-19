/**
 * 大模型服务
 * 处理不同大模型的API调用
 */

import { retry } from '../utils/utils.js';
import storageService from './storageService.js';
import ModelAdapterFactory from './adapters/modelAdapterFactory.js';
import { MODEL_TYPES, MODEL_CONFIGS } from '../utils/constants.js';

class ModelService {
  constructor() {
    this.adapters = new Map(); // 缓存适配器实例
    this.performanceMetrics = new Map(); // 性能指标
  }

  // 支持的模型类型（从常量导入）
  static MODEL_TYPES = MODEL_TYPES;

  // 默认配置（从常量导入）
  static DEFAULT_CONFIGS = MODEL_CONFIGS;

  /**
   * 获取或创建适配器
   * @param {Object} config - 模型配置
   * @returns {BaseModelAdapter} 适配器实例
   */
  getAdapter(config) {
    const cacheKey = `${config.type}_${config.id || 'default'}`;
    
    if (this.adapters.has(cacheKey)) {
      return this.adapters.get(cacheKey);
    }
    
    const adapter = ModelAdapterFactory.createAdapter(config.type, config);
    this.adapters.set(cacheKey, adapter);
    
    return adapter;
  }

  /**
   * 清除适配器缓存
   * @param {string} configId - 配置ID（可选）
   */
  clearAdapterCache(configId = null) {
    if (configId) {
      // 清除特定配置的适配器
      for (const [key] of this.adapters) {
        if (key.includes(configId)) {
          this.adapters.delete(key);
        }
      }
    } else {
      // 清除所有适配器
      this.adapters.clear();
    }
  }

  /**
   * 测试模型连接
   * @param {Object} config - 模型配置
   * @returns {Promise<Object>}
   */
  async testConnection(config) {
    const startTime = Date.now();
    
    try {
      const adapter = this.getAdapter(config);
      const result = await adapter.testConnection();
      
      // 记录性能指标
      this.recordPerformanceMetric(config.type, 'testConnection', Date.now() - startTime, result.success);
      
      return result;
    } catch (error) {
      console.error('模型连接测试失败:', error);
      
      // 记录失败指标
      this.recordPerformanceMetric(config.type, 'testConnection', Date.now() - startTime, false);
      
      return {
        success: false,
        error: error.message,
        message: '模型连接测试失败'
      };
    }
  }

  /**
   * 调用AI模型进行文本改写
   * @param {Object} config - 模型配置
   * @param {string} text - 待改写的文本
   * @param {string} prompt - 改写提示词
   * @param {Object} options - 额外选项
   * @returns {Promise<Object>}
   */
  async rewriteText(config, text, prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      const adapter = this.getAdapter(config);
      const result = await adapter.rewriteText(text, prompt, options);
      
      // 记录性能指标
      this.recordPerformanceMetric(config.type, 'rewriteText', Date.now() - startTime, result.success);
      
      // 记录使用统计
      this.recordUsageStats(config.type, result.usage || {});
      
      return result;
    } catch (error) {
      console.error('文本改写失败:', error);
      
      // 记录失败指标
      this.recordPerformanceMetric(config.type, 'rewriteText', Date.now() - startTime, false);
      
      return {
        success: false,
        error: error.message,
        message: '文本改写失败'
      };
    }
  }

  /**
   * 记录性能指标
   * @param {string} modelType - 模型类型
   * @param {string} operation - 操作类型
   * @param {number} duration - 耗时（毫秒）
   * @param {boolean} success - 是否成功
   */
  recordPerformanceMetric(modelType, operation, duration, success) {
    const key = `${modelType}_${operation}`;
    
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, {
        totalRequests: 0,
        successRequests: 0,
        failedRequests: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0
      });
    }
    
    const metrics = this.performanceMetrics.get(key);
    metrics.totalRequests++;
    
    if (success) {
      metrics.successRequests++;
    } else {
      metrics.failedRequests++;
    }
    
    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.totalRequests;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
  }

  /**
   * 记录使用统计
   * @param {string} modelType - 模型类型
   * @param {Object} usage - 使用统计
   */
  recordUsageStats(modelType, usage) {
    // 可以扩展为更详细的使用统计记录
    console.log(`${modelType} usage:`, usage);
  }

  /**
   * 获取性能指标
   * @param {string} modelType - 模型类型（可选）
   * @param {string} operation - 操作类型（可选）
   * @returns {Object} 性能指标
   */
  getPerformanceMetrics(modelType = null, operation = null) {
    if (modelType && operation) {
      const key = `${modelType}_${operation}`;
      return this.performanceMetrics.get(key) || null;
    }
    
    if (modelType) {
      const result = {};
      for (const [key, metrics] of this.performanceMetrics) {
        if (key.startsWith(modelType)) {
          result[key] = metrics;
        }
      }
      return result;
    }
    
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * 清除性能指标
   * @param {string} modelType - 模型类型（可选）
   */
  clearPerformanceMetrics(modelType = null) {
    if (modelType) {
      for (const key of this.performanceMetrics.keys()) {
        if (key.startsWith(modelType)) {
          this.performanceMetrics.delete(key);
        }
      }
    } else {
      this.performanceMetrics.clear();
    }
  }

  /**
   * 验证模型配置
   * @param {Object} config - 模型配置
   * @returns {Object} 验证结果
   */
  validateConfig(config) {
    try {
      return ModelAdapterFactory.validateConfig(config.type, config);
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * 获取模型信息
   * @param {string} modelType - 模型类型
   * @returns {Object} 模型信息
   */
  getModelInfo(modelType) {
    try {
      const defaultConfig = ModelAdapterFactory.getDefaultConfig(modelType);
      const tempAdapter = ModelAdapterFactory.createAdapter(modelType, {
        ...defaultConfig,
        apiKey: 'temp'
      });
      
      return tempAdapter.getModelInfo();
    } catch (error) {
      console.error(`获取模型信息失败: ${modelType}`, error);
      return null;
    }
  }

  /**
   * 获取所有模型信息
   * @returns {Array} 模型信息列表
   */
  getAllModelInfo() {
    return ModelAdapterFactory.getAllModelInfo();
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
    return ModelAdapterFactory.getSupportedModelTypes();
  }

  /**
   * 检查模型类型是否支持
   * @param {string} modelType - 模型类型
   * @returns {boolean} 是否支持
   */
  isModelTypeSupported(modelType) {
    return ModelAdapterFactory.isModelTypeSupported(modelType);
  }

  /**
   * 获取推荐配置
   * @param {string} modelType - 模型类型
   * @param {string} useCase - 使用场景
   * @returns {Object} 推荐配置
   */
  getRecommendedConfig(modelType, useCase = 'general') {
    return ModelAdapterFactory.getRecommendedConfig(modelType, useCase);
  }

  /**
   * 批量测试连接
   * @param {Array} configs - 配置数组
   * @returns {Promise<Array>} 测试结果数组
   */
  async batchTestConnection(configs) {
    const promises = configs.map(config => this.testConnection(config));
    return await Promise.allSettled(promises);
  }

  /**
   * 切换模型配置
   * @param {string} oldConfigId - 旧配置ID
   * @param {Object} newConfig - 新配置
   */
  switchModelConfig(oldConfigId, newConfig) {
    // 清除旧配置的适配器缓存
    this.clearAdapterCache(oldConfigId);
    
    // 清除旧配置的性能指标
    if (newConfig.type) {
      this.clearPerformanceMetrics(newConfig.type);
    }
  }
}

// 导出大模型服务实例
const modelService = new ModelService();
export default modelService;
export { ModelService };