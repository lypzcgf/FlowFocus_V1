/**
 * 配置数据模型
 * 定义各种配置的数据结构和验证规则
 */

/**
 * 大模型配置模型
 */
class ModelConfig {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.modelType = data.modelType || '';// qwen, deepseek, volces, kimi, hunyuan
    this.type = data.type || ''; // 存储的数据类型
    this.name = data.name || '';
    this.apiKey = data.apiKey || '';
    this.baseUrl = data.baseUrl || '';
    this.modelEndpoint = data.modelEndpoint || '';
    this.temperature = data.temperature || 0.7;
    this.maxTokens = data.maxTokens || 2000;
    this.isActive = data.isActive || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  /**
   * 验证配置数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];
    
    if (!this.type) errors.push('模型类型不能为空');
    if (!this.name) errors.push('模型名称不能为空');
    if (!this.apiKey) errors.push('API密钥不能为空');
    
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
   * 获取默认配置
   * @param {string} modelType - 模型类型
   * @returns {Object} 默认配置
   */
  static getDefaultConfig(modelType) {
    const defaults = {
      qwen: {
        name: 'Qwen模型',
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
        modelEndpoint: 'qwen-turbo',
        temperature: 0.7,
        maxTokens: 2000
      },
      deepseek: {
        name: 'DeepSeek模型',
        baseUrl: 'https://api.deepseek.com/v1',
        modelEndpoint: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 2000
      },
      volces: {
        name: 'Volces模型',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        modelEndpoint: 'ep-20241230140207-8v2kz',
        temperature: 0.7,
        maxTokens: 2000
      },
      kimi: {
        name: 'Kimi模型',
        baseUrl: 'https://api.moonshot.cn/v1',
        modelEndpoint: 'moonshot-v1-8k',
        temperature: 0.7,
        maxTokens: 2000
      },
      hunyuan: {
        name: 'Hunyuan模型',
        baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
        modelEndpoint: 'hunyuan-turbos-latest',
        temperature: 0.7,
        maxTokens: 2000
      }
    };
    
    return defaults[modelType] || {};
  }

  /**
   * 转换为存储格式
   * @returns {Object} 存储格式数据
   */
  toStorageFormat() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      modelType: this.modelType,
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      modelEndpoint: this.modelEndpoint,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  /**
   * 从存储格式创建实例
   * @param {Object} data - 存储格式数据
   * @returns {ModelConfig} 模型配置实例
   */
  static fromStorageFormat(data) {
    return new ModelConfig(data);
  }

  generateId() {
    return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 多维表格配置模型
 */
class TableConfig {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.platform = data.platform || ''; // feishu, dingtalk, wework
    this.name = data.name || '';
    this.description = data.description || '';
    this.isActive = data.isActive || false;
    this.isConnected = data.isConnected || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    // 平台特定配置
    this.config = data.config || {};
    
    // 权限和限制
    this.permissions = data.permissions || {
      read: true,
      write: true,
      delete: false
    };
    
    this.rateLimit = data.rateLimit || {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    };
    
    // 同步设置
    this.syncSettings = data.syncSettings || {
      autoSync: false,
      syncInterval: 300, // 秒
      batchSize: 50
    };
    
    this.metadata = data.metadata || {};
  }

  /**
   * 验证配置数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];
    
    if (!this.platform) errors.push('平台类型不能为空');
    if (!this.name) errors.push('配置名称不能为空');
    
    // 验证平台特定配置
    const platformValidation = this.validatePlatformConfig();
    if (!platformValidation.isValid) {
      errors.push(...platformValidation.errors);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证平台特定配置
   * @returns {Object} 验证结果
   */
  validatePlatformConfig() {
    const errors = [];
    
    switch (this.platform) {
      case 'feishu':
        if (!this.config.appId) errors.push('飞书AppId不能为空');
        if (!this.config.appSecret) errors.push('飞书AppSecret不能为空');
        if (!this.config.tableToken) errors.push('飞书TableToken不能为空');
        break;
        
      case 'dingtalk':
        if (!this.config.appKey) errors.push('钉钉AppKey不能为空');
        if (!this.config.appSecret) errors.push('钉钉AppSecret不能为空');
        if (!this.config.workbookId) errors.push('钉钉WorkbookId不能为空');
        if (!this.config.sheetId) errors.push('钉钉SheetId不能为空');
        break;
        
      case 'wework':
        if (!this.config.corpId) errors.push('企业微信CorpId不能为空');
        if (!this.config.corpSecret) errors.push('企业微信CorpSecret不能为空');
        if (!this.config.agentId) errors.push('企业微信AgentId不能为空');
        if (!this.config.docId) errors.push('企业微信DocId不能为空');
        if (!this.config.sheetId) errors.push('企业微信SheetId不能为空');
        break;
        
      default:
        errors.push(`不支持的平台类型: ${this.platform}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取平台配置模板
   * @param {string} platform - 平台类型
   * @returns {Object} 配置模板
   */
  static getConfigTemplate(platform) {
    const templates = {
      feishu: {
        appId: '',
        appSecret: '',
        tableToken: '',
        tableId: '',
        baseUrl: 'https://open.feishu.cn/open-apis/bitable/v1'
      },
      dingtalk: {
        appKey: '',
        appSecret: '',
        workbookId: '',
        sheetId: '',
        baseUrl: 'https://oapi.dingtalk.com'
      },
      wework: {
        corpId: '',
        corpSecret: '',
        agentId: '',
        docId: '',
        sheetId: '',
        baseUrl: 'https://qyapi.weixin.qq.com'
      }
    };
    
    return templates[platform] || {};
  }

  /**
   * 转换为存储格式
   * @returns {Object} 存储格式数据
   */
  toStorageFormat() {
    return {
      id: this.id,
      platform: this.platform,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      isConnected: this.isConnected,
      config: this.config,
      permissions: this.permissions,
      rateLimit: this.rateLimit,
      syncSettings: this.syncSettings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  /**
   * 从存储格式创建实例
   * @param {Object} data - 存储格式数据
   * @returns {TableConfig} 表格配置实例
   */
  static fromStorageFormat(data) {
    return new TableConfig(data);
  }

  generateId() {
    return `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 应用配置模型
 */
class AppConfig {
  constructor(data = {}) {
    this.version = data.version || '2.0.0';
    this.theme = data.theme || 'light';
    this.language = data.language || 'zh-CN';
    this.autoSave = data.autoSave !== undefined ? data.autoSave : true;
    this.notifications = data.notifications !== undefined ? data.notifications : true;
    this.debugMode = data.debugMode || false;
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    // 功能开关
    this.features = data.features || {
      multiTableSync: true,
      batchOperations: true,
      autoBackup: true,
      advancedFilters: true
    };
    
    // 性能设置
    this.performance = data.performance || {
      maxConcurrentRequests: 5,
      requestTimeout: 30000,
      cacheExpiry: 300000, // 5分钟
      maxCacheSize: 100
    };
  }

  /**
   * 转换为存储格式
   * @returns {Object} 存储格式数据
   */
  toStorageFormat() {
    return {
      version: this.version,
      theme: this.theme,
      language: this.language,
      autoSave: this.autoSave,
      notifications: this.notifications,
      debugMode: this.debugMode,
      features: this.features,
      performance: this.performance,
      updatedAt: this.updatedAt
    };
  }

  /**
   * 从存储格式创建实例
   * @param {Object} data - 存储格式数据
   * @returns {AppConfig} 应用配置实例
   */
  static fromStorageFormat(data) {
    return new AppConfig(data);
  }

  /**
   * 获取默认配置
   * @returns {AppConfig} 默认配置实例
   */
  static getDefault() {
    return new AppConfig();
  }
}

// 导出配置模型类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ModelConfig,
    TableConfig,
    AppConfig
  };
} else {
  window.ModelConfig = ModelConfig;
  window.TableConfig = TableConfig;
  window.AppConfig = AppConfig;
}