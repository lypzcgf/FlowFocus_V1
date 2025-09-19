/**
 * 模型配置管理器
 * 处理模型配置的创建、更新、验证、切换等功能
 */

import { ModelConfig } from '../models/configModels.js';
import ModelAdapterFactory from './adapters/modelAdapterFactory.js';
import storageService from './storageService.js';
import modelService from './modelService.js';
import performanceMonitor from './performanceMonitor.js';
import { MODEL_TYPES, EVENT_TYPES } from '../utils/constants.js';

class ModelConfigManager {
  constructor() {
    this.configs = new Map();
    this.activeConfigId = null;
    this.validationCache = new Map();
    this.eventListeners = new Map();
    this.isInitialized = false;
    
    // 配置验证规则
    this.validationRules = {
      required: ['type', 'name', 'apiKey'],
      optional: ['baseUrl', 'modelEndpoint', 'temperature', 'maxTokens'],
      typeValidation: {
        temperature: (value) => typeof value === 'number' && value >= 0 && value <= 2,
        maxTokens: (value) => typeof value === 'number' && value > 0 && value <= 8000,
        apiKey: (value) => typeof value === 'string' && value.length > 0,
        baseUrl: (value) => typeof value === 'string' && this.isValidUrl(value)
      }
    };
  }

  /**
   * 初始化配置管理器
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;
    
    const timerId = performanceMonitor.startTiming('ModelConfigManager.initialize');
    
    try {
      // 从存储加载配置
      await this.loadConfigs();
      
      // 设置默认活跃配置
      await this.setDefaultActiveConfig();
      
      this.isInitialized = true;
      
      performanceMonitor.endTiming(timerId, true);
      performanceMonitor.log('info', 'ModelConfigManager', '配置管理器初始化完成', {
        configCount: this.configs.size,
        activeConfigId: this.activeConfigId
      });
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'ModelConfigManager.initialize');
      throw error;
    }
  }

  /**
   * 创建新的模型配置
   * @param {Object} configData - 配置数据
   * @returns {Promise<ModelConfig>} 创建的配置
   */
  async createConfig(configData) {
    const timerId = performanceMonitor.startTiming('ModelConfigManager.createConfig');
    
    try {
      // 验证配置数据
      const validation = await this.validateConfig(configData);
      if (!validation.isValid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
      }
      
      // 创建配置实例
      const config = new ModelConfig({
        ...configData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // 测试连接
      if (configData.testConnection !== false) {
        const connectionTest = await this.testConfigConnection(config);
        if (!connectionTest.success) {
          throw new Error(`连接测试失败: ${connectionTest.error}`);
        }
      }
      
      // 保存配置
      this.configs.set(config.id, config);
      await this.saveConfigs();
      
      // 如果是第一个配置，设为活跃配置
      if (!this.activeConfigId) {
        await this.setActiveConfig(config.id);
      }
      
      // 触发事件
      this.dispatchEvent(EVENT_TYPES.MODEL_CONFIG_CHANGED, {
        action: 'create',
        config: config.toStorageFormat()
      });
      
      performanceMonitor.endTiming(timerId, true, { configId: config.id });
      performanceMonitor.log('info', 'ModelConfigManager', '创建模型配置成功', {
        configId: config.id,
        type: config.type,
        name: config.name
      });
      
      return config;
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'ModelConfigManager.createConfig');
      throw error;
    }
  }

  /**
   * 更新模型配置
   * @param {string} configId - 配置ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<ModelConfig>} 更新后的配置
   */
  async updateConfig(configId, updates) {
    const timerId = performanceMonitor.startTiming('ModelConfigManager.updateConfig');
    
    try {
      const config = this.configs.get(configId);
      if (!config) {
        throw new Error(`配置不存在: ${configId}`);
      }
      
      // 创建更新后的配置数据
      const updatedData = {
        ...config.toStorageFormat(),
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // 验证更新后的配置
      const validation = await this.validateConfig(updatedData);
      if (!validation.isValid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
      }
      
      // 如果关键配置发生变化，测试连接
      const keyFields = ['apiKey', 'baseUrl', 'modelEndpoint'];
      const hasKeyChanges = keyFields.some(field => 
        updates.hasOwnProperty(field) && updates[field] !== config[field]
      );
      
      if (hasKeyChanges && updates.testConnection !== false) {
        const testConfig = new ModelConfig(updatedData);
        const connectionTest = await this.testConfigConnection(testConfig);
        if (!connectionTest.success) {
          throw new Error(`连接测试失败: ${connectionTest.error}`);
        }
      }
      
      // 更新配置
      const updatedConfig = new ModelConfig(updatedData);
      this.configs.set(configId, updatedConfig);
      await this.saveConfigs();
      
      // 清除相关缓存
      this.clearValidationCache(configId);
      modelService.clearAdapterCache(configId);
      
      // 触发事件
      this.dispatchEvent(EVENT_TYPES.MODEL_CONFIG_CHANGED, {
        action: 'update',
        configId,
        config: updatedConfig.toStorageFormat(),
        changes: updates
      });
      
      performanceMonitor.endTiming(timerId, true, { configId });
      performanceMonitor.log('info', 'ModelConfigManager', '更新模型配置成功', {
        configId,
        changes: Object.keys(updates)
      });
      
      return updatedConfig;
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'ModelConfigManager.updateConfig');
      throw error;
    }
  }

  /**
   * 删除模型配置
   * @param {string} configId - 配置ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteConfig(configId) {
    const timerId = performanceMonitor.startTiming('ModelConfigManager.deleteConfig');
    
    try {
      const config = this.configs.get(configId);
      if (!config) {
        throw new Error(`配置不存在: ${configId}`);
      }
      
      // 如果是活跃配置，需要切换到其他配置
      if (this.activeConfigId === configId) {
        const otherConfigs = Array.from(this.configs.values()).filter(c => c.id !== configId);
        if (otherConfigs.length > 0) {
          await this.setActiveConfig(otherConfigs[0].id);
        } else {
          this.activeConfigId = null;
        }
      }
      
      // 删除配置
      this.configs.delete(configId);
      await this.saveConfigs();
      
      // 清除相关缓存
      this.clearValidationCache(configId);
      modelService.clearAdapterCache(configId);
      
      // 触发事件
      this.dispatchEvent(EVENT_TYPES.MODEL_CONFIG_CHANGED, {
        action: 'delete',
        configId,
        config: config.toStorageFormat()
      });
      
      performanceMonitor.endTiming(timerId, true, { configId });
      performanceMonitor.log('info', 'ModelConfigManager', '删除模型配置成功', { configId });
      
      return true;
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'ModelConfigManager.deleteConfig');
      throw error;
    }
  }

  /**
   * 设置活跃配置
   * @param {string} configId - 配置ID
   * @returns {Promise<void>}
   */
  async setActiveConfig(configId) {
    const timerId = performanceMonitor.startTiming('ModelConfigManager.setActiveConfig');
    
    try {
      if (configId && !this.configs.has(configId)) {
        throw new Error(`配置不存在: ${configId}`);
      }
      
      const oldConfigId = this.activeConfigId;
      this.activeConfigId = configId;
      
      // 保存活跃配置ID
      await storageService.setItem('activeModelConfigId', configId);
      
      // 清除旧配置的适配器缓存
      if (oldConfigId) {
        modelService.clearAdapterCache(oldConfigId);
      }
      
      // 触发事件
      this.dispatchEvent(EVENT_TYPES.MODEL_CONFIG_CHANGED, {
        action: 'setActive',
        oldConfigId,
        newConfigId: configId
      });
      
      performanceMonitor.endTiming(timerId, true, { configId });
      performanceMonitor.log('info', 'ModelConfigManager', '切换活跃配置成功', {
        oldConfigId,
        newConfigId: configId
      });
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'ModelConfigManager.setActiveConfig');
      throw error;
    }
  }

  /**
   * 获取配置
   * @param {string} configId - 配置ID
   * @returns {ModelConfig|null} 配置对象
   */
  getConfig(configId) {
    return this.configs.get(configId) || null;
  }

  /**
   * 获取活跃配置
   * @returns {ModelConfig|null} 活跃配置
   */
  getActiveConfig() {
    return this.activeConfigId ? this.configs.get(this.activeConfigId) : null;
  }

  /**
   * 获取所有配置
   * @returns {Array<ModelConfig>} 配置列表
   */
  getAllConfigs() {
    return Array.from(this.configs.values());
  }

  /**
   * 按类型获取配置
   * @param {string} modelType - 模型类型
   * @returns {Array<ModelConfig>} 配置列表
   */
  getConfigsByType(modelType) {
    return Array.from(this.configs.values()).filter(config => config.type === modelType);
  }

  /**
   * 验证配置
   * @param {Object} configData - 配置数据
   * @param {boolean} useCache - 是否使用缓存
   * @returns {Promise<Object>} 验证结果
   */
  async validateConfig(configData, useCache = true) {
    const cacheKey = JSON.stringify(configData);
    
    if (useCache && this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey);
    }
    
    const timerId = performanceMonitor.startTiming('ModelConfigManager.validateConfig');
    
    try {
      const errors = [];
      
      // 基础字段验证
      for (const field of this.validationRules.required) {
        if (!configData[field]) {
          errors.push(`${field} 是必填字段`);
        }
      }
      
      // 类型验证
      for (const [field, validator] of Object.entries(this.validationRules.typeValidation)) {
        if (configData[field] !== undefined && !validator(configData[field])) {
          errors.push(`${field} 格式不正确`);
        }
      }
      
      // 模型类型验证
      if (configData.type && !ModelAdapterFactory.isModelTypeSupported(configData.type)) {
        errors.push(`不支持的模型类型: ${configData.type}`);
      }
      
      // 使用适配器工厂验证
      if (errors.length === 0 && configData.type) {
        try {
          const adapterValidation = ModelAdapterFactory.validateConfig(configData.type, configData);
          if (!adapterValidation.isValid) {
            errors.push(...adapterValidation.errors);
          }
        } catch (error) {
          errors.push(`适配器验证失败: ${error.message}`);
        }
      }
      
      const result = {
        isValid: errors.length === 0,
        errors,
        timestamp: Date.now()
      };
      
      // 缓存结果
      this.validationCache.set(cacheKey, result);
      
      performanceMonitor.endTiming(timerId, true);
      
      return result;
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'ModelConfigManager.validateConfig');
      
      return {
        isValid: false,
        errors: [`验证过程出错: ${error.message}`],
        timestamp: Date.now()
      };
    }
  }

  /**
   * 测试配置连接
   * @param {ModelConfig} config - 配置对象
   * @returns {Promise<Object>} 测试结果
   */
  async testConfigConnection(config) {
    const timerId = performanceMonitor.startTiming('ModelConfigManager.testConnection');
    
    try {
      const result = await modelService.testConnection(config.toStorageFormat());
      
      performanceMonitor.endTiming(timerId, result.success);
      performanceMonitor.log(
        result.success ? 'info' : 'error',
        'ModelConfigManager',
        `配置连接测试${result.success ? '成功' : '失败'}`,
        {
          configId: config.id,
          type: config.type,
          error: result.error
        }
      );
      
      return result;
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'ModelConfigManager.testConnection');
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量测试配置连接
   * @param {Array<string>} configIds - 配置ID数组
   * @returns {Promise<Array>} 测试结果数组
   */
  async batchTestConnections(configIds = null) {
    const ids = configIds || Array.from(this.configs.keys());
    const configs = ids.map(id => this.configs.get(id)).filter(Boolean);
    
    const timerId = performanceMonitor.startTiming('ModelConfigManager.batchTestConnections');
    
    try {
      const results = await Promise.allSettled(
        configs.map(config => this.testConfigConnection(config))
      );
      
      const processedResults = results.map((result, index) => ({
        configId: configs[index].id,
        configName: configs[index].name,
        configType: configs[index].type,
        success: result.status === 'fulfilled' ? result.value.success : false,
        error: result.status === 'fulfilled' ? result.value.error : result.reason.message
      }));
      
      performanceMonitor.endTiming(timerId, true, { testedCount: configs.length });
      
      return processedResults;
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'ModelConfigManager.batchTestConnections');
      throw error;
    }
  }

  /**
   * 导入配置
   * @param {Array<Object>} configsData - 配置数据数组
   * @param {Object} options - 导入选项
   * @returns {Promise<Object>} 导入结果
   */
  async importConfigs(configsData, options = {}) {
    const timerId = performanceMonitor.startTiming('ModelConfigManager.importConfigs');
    
    try {
      const results = {
        total: configsData.length,
        success: 0,
        failed: 0,
        errors: [],
        imported: []
      };
      
      for (const configData of configsData) {
        try {
          // 检查是否已存在同名配置
          const existingConfig = Array.from(this.configs.values())
            .find(c => c.name === configData.name && c.type === configData.type);
          
          if (existingConfig && !options.overwrite) {
            results.failed++;
            results.errors.push(`配置已存在: ${configData.name}`);
            continue;
          }
          
          // 创建或更新配置
          let config;
          if (existingConfig && options.overwrite) {
            config = await this.updateConfig(existingConfig.id, configData);
          } else {
            config = await this.createConfig({
              ...configData,
              testConnection: options.testConnection !== false
            });
          }
          
          results.success++;
          results.imported.push(config.toStorageFormat());
          
        } catch (error) {
          results.failed++;
          results.errors.push(`导入失败 ${configData.name}: ${error.message}`);
        }
      }
      
      performanceMonitor.endTiming(timerId, true, results);
      performanceMonitor.log('info', 'ModelConfigManager', '批量导入配置完成', results);
      
      return results;
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'ModelConfigManager.importConfigs');
      throw error;
    }
  }

  /**
   * 导出配置
   * @param {Array<string>} configIds - 配置ID数组（可选）
   * @param {boolean} includeSecrets - 是否包含敏感信息
   * @returns {Array<Object>} 配置数据数组
   */
  exportConfigs(configIds = null, includeSecrets = false) {
    const ids = configIds || Array.from(this.configs.keys());
    const configs = ids.map(id => this.configs.get(id)).filter(Boolean);
    
    return configs.map(config => {
      const data = config.toStorageFormat();
      
      if (!includeSecrets) {
        // 移除敏感信息
        delete data.apiKey;
        if (data.secretId) delete data.secretId;
        if (data.secretKey) delete data.secretKey;
      }
      
      return data;
    });
  }

  /**
   * 添加事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 监听器函数
   */
  addEventListener(eventType, listener) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType).add(listener);
  }

  /**
   * 移除事件监听器
   * @param {string} eventType - 事件类型
   * @param {Function} listener - 监听器函数
   */
  removeEventListener(eventType, listener) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).delete(listener);
    }
  }

  // 私有方法
  async loadConfigs() {
    try {
      const configsData = await storageService.getItem('modelConfigs') || [];
      const activeConfigId = await storageService.getItem('activeModelConfigId');
      
      this.configs.clear();
      
      for (const configData of configsData) {
        const config = ModelConfig.fromStorageFormat(configData);
        this.configs.set(config.id, config);
      }
      
      this.activeConfigId = activeConfigId;
      
    } catch (error) {
      performanceMonitor.recordError(error, 'ModelConfigManager.loadConfigs');
      throw new Error(`加载配置失败: ${error.message}`);
    }
  }

  async saveConfigs() {
    try {
      const configsData = Array.from(this.configs.values()).map(config => config.toStorageFormat());
      await storageService.setItem('modelConfigs', configsData);
    } catch (error) {
      performanceMonitor.recordError(error, 'ModelConfigManager.saveConfigs');
      throw new Error(`保存配置失败: ${error.message}`);
    }
  }

  async setDefaultActiveConfig() {
    if (!this.activeConfigId && this.configs.size > 0) {
      const firstConfig = Array.from(this.configs.values())[0];
      await this.setActiveConfig(firstConfig.id);
    }
  }

  clearValidationCache(configId = null) {
    if (configId) {
      // 清除特定配置的缓存
      for (const [key] of this.validationCache) {
        if (key.includes(configId)) {
          this.validationCache.delete(key);
        }
      }
    } else {
      // 清除所有缓存
      this.validationCache.clear();
    }
  }

  dispatchEvent(eventType, data) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          performanceMonitor.recordError(error, 'ModelConfigManager.dispatchEvent');
        }
      });
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

// 创建全局实例
const modelConfigManager = new ModelConfigManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModelConfigManager, modelConfigManager };
} else {
  window.ModelConfigManager = ModelConfigManager;
  window.modelConfigManager = modelConfigManager;
}

export { ModelConfigManager, modelConfigManager };
export default modelConfigManager;