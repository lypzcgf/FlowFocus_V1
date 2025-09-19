/**
 * 基础适配器类
 * 为各个平台适配器提供统一的基础结构和通用方法
 */
class BaseAdapter {
  constructor(config) {
    this.config = config;
    this.platform = config.platform;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.retryCount = config.retryCount || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * 创建记录 - 抽象方法，子类必须实现
   * @param {Object} data - 记录数据
   * @returns {Promise<Object>} 创建结果
   */
  async createRecord(data) {
    throw new Error('createRecord方法必须在子类中实现');
  }

  /**
   * 更新记录 - 抽象方法，子类必须实现
   * @param {string} id - 记录ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateRecord(id, data) {
    throw new Error('updateRecord方法必须在子类中实现');
  }

  /**
   * 删除记录 - 抽象方法，子类必须实现
   * @param {string} id - 记录ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteRecord(id) {
    throw new Error('deleteRecord方法必须在子类中实现');
  }

  /**
   * 获取记录列表 - 抽象方法，子类必须实现
   * @param {Object} params - 查询参数
   * @returns {Promise<Array>} 记录列表
   */
  async getRecords(params) {
    throw new Error('getRecords方法必须在子类中实现');
  }

  /**
   * 测试连接 - 抽象方法，子类必须实现
   * @returns {Promise<boolean>} 连接测试结果
   */
  async testConnection() {
    throw new Error('testConnection方法必须在子类中实现');
  }

  /**
   * 获取表格信息 - 抽象方法，子类必须实现
   * @returns {Promise<Object>} 表格信息
   */
  async getTableInfo() {
    throw new Error('getTableInfo方法必须在子类中实现');
  }

  /**
   * 发送HTTP请求的通用方法
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async makeRequest(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      timeout: this.timeout
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    // 合并headers
    if (options.headers) {
      requestOptions.headers = { ...defaultOptions.headers, ...options.headers };
    }

    let lastError;
    
    // 重试机制
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return this.handleResponse(data);
        
      } catch (error) {
        lastError = error;
        console.warn(`请求失败 (尝试 ${attempt}/${this.retryCount}):`, error.message);
        
        if (attempt < this.retryCount) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw new Error(`请求失败，已重试 ${this.retryCount} 次: ${lastError.message}`);
  }

  /**
   * 带超时的fetch请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Response>} 响应对象
   */
  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }

  /**
   * 获取认证头信息 - 子类可以重写
   * @returns {Object} 认证头信息
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  /**
   * 处理API响应 - 子类可以重写
   * @param {Object} data - 响应数据
   * @returns {Object} 处理后的数据
   */
  handleResponse(data) {
    // 检查是否有错误
    if (data.error || data.code !== undefined && data.code !== 0) {
      throw new Error(data.error || data.message || '未知错误');
    }
    
    return data;
  }

  /**
   * 验证配置信息
   * @returns {boolean} 验证结果
   */
  validateConfig() {
    const requiredFields = this.getRequiredConfigFields();
    
    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`缺少必需的配置字段: ${field}`);
      }
    }
    
    return true;
  }

  /**
   * 获取必需的配置字段 - 子类应该重写
   * @returns {Array} 必需字段列表
   */
  getRequiredConfigFields() {
    return ['platform', 'apiKey', 'baseUrl'];
  }

  /**
   * 格式化错误信息
   * @param {Error} error - 错误对象
   * @returns {Object} 格式化后的错误信息
   */
  formatError(error) {
    return {
      platform: this.platform,
      error: error.message,
      timestamp: new Date().toISOString(),
      config: {
        baseUrl: this.baseUrl,
        timeout: this.timeout
      }
    };
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} Promise对象
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return `${this.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录日志
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  log(level, message, data = {}) {
    const logData = {
      platform: this.platform,
      level,
      message,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    console[level] || console.log(`[${this.platform}] ${message}`, logData);
  }
}

// 导出基础适配器类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseAdapter;
} else {
  window.BaseAdapter = BaseAdapter;
}