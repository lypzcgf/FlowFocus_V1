/**
 * 钉钉多维表格适配器
 * 实现钉钉多维表格API的具体集成
 * 支持完整的CRUD操作、批量操作、错误处理和重试机制
 */
import BaseAdapter from './baseAdapter.js';

class DingtalkAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.baseUrl = config.baseUrl || 'https://oapi.dingtalk.com';
    this.workbookId = config.workbookId;
    this.sheetId = config.sheetId;
    this.appType = config.appType || 'APP_K6IGJJ6PFAARLX2QKXEL';
    this.accessToken = null;
    this.tokenExpiry = null;
    this.rateLimitRemaining = 1000;
    this.rateLimitReset = null;
  }

  /**
   * 获取必需的配置字段
   * @returns {Array} 必需字段列表
   */
  getRequiredConfigFields() {
    return ['appKey', 'appSecret', 'workbookId', 'sheetId'];
  }

  /**
   * 批量创建记录
   * @param {Array} dataList - 记录数据列表
   * @returns {Promise<Array>} 创建结果列表
   */
  async batchCreateRecords(dataList) {
    try {
      const results = [];
      
      // 钉钉API不支持真正的批量创建，使用并发创建
      const batchSize = 5; // 限制并发数量
      for (let i = 0; i < dataList.length; i += batchSize) {
        const batch = dataList.slice(i, i + batchSize);
        const batchPromises = batch.map(data => this.createRecord(data));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            this.log('error', `批量创建第${i + index + 1}条记录失败`, { error: result.reason.message });
            results.push({ error: result.reason.message, index: i + index });
          }
        });
        
        // 避免速率限制
        if (i + batchSize < dataList.length) {
          await this.delay(200);
        }
      }
      
      return results;
    } catch (error) {
      this.log('error', '批量创建钉钉记录失败', { error: error.message, count: dataList.length });
      throw error;
    }
  }

  /**
   * 批量更新记录
   * @param {Array} updates - 更新数据列表 [{id, data}]
   * @returns {Promise<Array>} 更新结果列表
   */
  async batchUpdateRecords(updates) {
    try {
      const results = [];
      
      // 钉钉API不支持真正的批量更新，使用并发更新
      const batchSize = 5; // 限制并发数量
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const batchPromises = batch.map(update => this.updateRecord(update.id, update.data));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            this.log('error', `批量更新第${i + index + 1}条记录失败`, { error: result.reason.message });
            results.push({ error: result.reason.message, index: i + index });
          }
        });
        
        // 避免速率限制
        if (i + batchSize < updates.length) {
          await this.delay(200);
        }
      }
      
      return results;
    } catch (error) {
      this.log('error', '批量更新钉钉记录失败', { error: error.message, count: updates.length });
      throw error;
    }
  }

  /**
   * 批量删除记录
   * @param {Array} recordIds - 记录ID列表
   * @returns {Promise<Object>} 删除结果
   */
  async batchDeleteRecords(recordIds) {
    try {
      const results = [];
      
      // 钉钉API不支持真正的批量删除，使用并发删除
      const batchSize = 5; // 限制并发数量
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => this.deleteRecord(id));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            this.log('error', `批量删除第${i + index + 1}条记录失败`, { error: result.reason.message });
            results.push({ error: result.reason.message, index: i + index });
          }
        });
        
        // 避免速率限制
        if (i + batchSize < recordIds.length) {
          await this.delay(200);
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      return { 
        success: true, 
        deletedCount: successCount,
        totalCount: recordIds.length,
        results 
      };
    } catch (error) {
      this.log('error', '批量删除钉钉记录失败', { error: error.message, count: recordIds.length });
      throw error;
    }
  }

  /**
   * 获取访问令牌
   * @returns {Promise<string>} 访问令牌
   */
  async getAccessToken() {
    // 检查现有令牌是否有效
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const url = `${this.baseUrl}/gettoken`;
      const params = new URLSearchParams({
        appkey: this.appKey,
        appsecret: this.appSecret
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.errcode !== 0) {
        throw new Error(`获取钉钉访问令牌失败: ${data.errmsg}`);
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 提前5分钟过期
      
      return this.accessToken;
    } catch (error) {
      console.error('获取钉钉访问令牌失败:', error);
      throw error;
    }
  }

  /**
   * 获取认证头信息
   * @returns {Promise<Object>} 认证头信息
   */
  async getAuthHeaders() {
    const token = await this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'x-acs-dingtalk-access-token': token
    };
  }

  /**
   * 创建记录
   * @param {Object} data - 记录数据
   * @returns {Promise<Object>} 创建结果
   */
  async createRecord(data) {
    try {
      const url = `${this.baseUrl}/v1.0/yida/forms/instances`;
      
      const requestData = {
        appType: this.appType,
        systemToken: await this.getAccessToken(),
        userId: 'system',
        formDataJson: JSON.stringify(this.formatDataForDingtalk(data))
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return this.formatDingtalkResponse(response);
    } catch (error) {
      this.log('error', '创建钉钉记录失败', { error: error.message, data });
      throw error;
    }
  }

  /**
   * 更新记录
   * @param {string} recordId - 记录ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateRecord(recordId, data) {
    try {
      const url = `${this.baseUrl}/v1.0/yida/forms/instances/${recordId}`;
      
      const requestData = {
        appType: this.appType,
        systemToken: await this.getAccessToken(),
        userId: 'system',
        formDataJson: JSON.stringify(this.formatDataForDingtalk(data))
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestData)
      });

      return this.formatDingtalkResponse(response);
    } catch (error) {
      this.log('error', '更新钉钉记录失败', { error: error.message, recordId, data });
      throw error;
    }
  }

  /**
   * 删除记录
   * @param {string} recordId - 记录ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteRecord(recordId) {
    try {
      const url = `${this.baseUrl}/v1.0/yida/forms/instances/${recordId}`;
      
      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'DELETE',
        headers
      });

      return { success: true, recordId };
    } catch (error) {
      this.log('error', '删除钉钉记录失败', { error: error.message, recordId });
      throw error;
    }
  }

  /**
   * 获取记录列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Array>} 记录列表
   */
  async getRecords(params = {}) {
    try {
      const url = `${this.baseUrl}/v1.0/yida/forms/instances/search`;
      
      const requestData = {
        appType: this.appType,
        systemToken: await this.getAccessToken(),
        userId: 'system',
        pageSize: params.pageSize || 100,
        pageNumber: params.pageNumber || 1,
        searchFieldJson: JSON.stringify(params.filter || {})
      };
      
      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return this.formatDingtalkRecords(response.data || []);
    } catch (error) {
      this.log('error', '获取钉钉记录列表失败', { error: error.message, params });
      throw error;
    }
  }

  /**
   * 测试连接
   * @returns {Promise<boolean>} 连接测试结果
   */
  async testConnection() {
    try {
      // 尝试获取访问令牌
      await this.getAccessToken();
      
      // 尝试获取表格信息
      await this.getTableInfo();
      
      this.log('info', '钉钉连接测试成功');
      return true;
    } catch (error) {
      this.log('error', '钉钉连接测试失败', { error: error.message });
      return false;
    }
  }

  /**
   * 获取表格信息
   * @returns {Promise<Object>} 表格信息
   */
  async getTableInfo() {
    try {
      const url = `${this.baseUrl}/v1.0/yida/apps/${this.workbookId}`;
      
      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers
      });

      return {
        name: response.appName || '钉钉智能表格',
        workbookId: this.workbookId,
        sheetId: this.sheetId,
        platform: 'dingtalk',
        isConnected: true
      };
    } catch (error) {
      this.log('error', '获取钉钉表格信息失败', { error: error.message });
      throw error;
    }
  }

  // 私有方法
  
  /**
   * 获取字段映射配置
   * @returns {Object} 字段映射配置
   */
  getFieldMapping() {
    return {
      id: 'textField_id',
      type: 'textField_type',
      name: 'textField_name',
      data: 'textareaField_data',
      metadata: 'textareaField_metadata',
      createdAt: 'dateField_createdAt',
      updatedAt: 'dateField_updatedAt',
      status: 'selectField_status',
      category: 'selectField_category',
      quality: 'numberField_quality'
    };
  }
  
  formatDataForDingtalk(data) {
    const fieldMapping = this.getFieldMapping();
    const formattedData = {};
    
    // 基础字段映射
    Object.keys(fieldMapping).forEach(key => {
      const dingtalkField = fieldMapping[key];
      let value = data[key];
      
      if (value !== undefined && value !== null) {
        // 根据字段类型格式化
        if (typeof value === 'object' && !Array.isArray(value)) {
          value = JSON.stringify(value);
        } else if (Array.isArray(value)) {
          value = value.join(', ');
        } else if (typeof value === 'boolean') {
          value = value ? '是' : '否';
        } else {
          value = String(value);
        }
        
        formattedData[dingtalkField] = value;
      }
    });
    
    // 确保必需字段存在
    if (!formattedData['textField_id'] && data.id) {
      formattedData['textField_id'] = data.id;
    }
    
    if (!formattedData['dateField_createdAt']) {
      formattedData['dateField_createdAt'] = data.metadata?.createdAt || new Date().toISOString();
    }
    
    if (!formattedData['dateField_updatedAt']) {
      formattedData['dateField_updatedAt'] = data.metadata?.updatedAt || new Date().toISOString();
    }
    
    return formattedData;
  }

  formatDingtalkResponse(response) {
    if (response.instanceId) {
      return {
        id: response.instanceId,
        formData: response.formData,
        createTime: response.createTime,
        modifyTime: response.modifyTime
      };
    }
    return response;
  }

  formatDingtalkRecords(records) {
    return records.map(record => ({
      id: record.instanceId,
      formData: record.formData,
      createTime: record.createTime,
      modifyTime: record.modifyTime
    }));
  }

  /**
   * 处理API响应
   * @param {Object} data - 响应数据
   * @returns {Object} 处理后的数据
   */
  handleResponse(data) {
    if (data.errcode && data.errcode !== 0) {
      // 根据错误码提供更详细的错误信息
      const errorMessages = {
        40001: '无效的访问令牌',
        40002: '访问令牌已过期',
        40003: '应用权限不足',
        40004: '请求参数错误',
        40005: '资源不存在',
        40006: '操作被限制',
        40007: '应用未授权',
        50001: '服务器内部错误',
        50002: '服务暂时不可用',
        60001: '网络异常',
        60002: '请求超时'
      };
      
      const errorMessage = errorMessages[data.errcode] || data.errmsg || '未知错误';
      const error = new Error(`钉钉API错误 (${data.errcode}): ${errorMessage}`);
      error.code = data.errcode;
      error.platform = 'dingtalk';
      throw error;
    }
    return data;
  }

  /**
   * 检查速率限制
   * @returns {Promise<void>}
   */
  async checkRateLimit() {
    if (this.rateLimitRemaining <= 0 && this.rateLimitReset) {
      const waitTime = this.rateLimitReset - Date.now();
      if (waitTime > 0) {
        this.log('warn', `钉钉速率限制，等待 ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }
  }

  /**
   * 重写makeRequest方法以支持速率限制
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async makeRequest(url, options = {}) {
    await this.checkRateLimit();
    return await super.makeRequest(url, options);
  }
}

// 导出钉钉适配器类
export default DingtalkAdapter;