/**
 * 企业微信智能表格适配器
 * 实现企业微信智能表格API的具体集成
 * 支持完整的CRUD操作、批量操作、错误处理和重试机制
 */
import BaseAdapter from './baseAdapter.js';

class WeworkAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.corpId = config.corpId;
    this.corpSecret = config.corpSecret;
    this.agentId = config.agentId;
    this.baseUrl = config.baseUrl || 'https://qyapi.weixin.qq.com';
    this.docId = config.docId;
    this.sheetId = config.sheetId;
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
    return ['corpId', 'corpSecret', 'agentId', 'docId', 'sheetId'];
  }

  /**
   * 批量创建记录
   * @param {Array} dataList - 记录数据列表
   * @returns {Promise<Array>} 创建结果列表
   */
  async batchCreateRecords(dataList) {
    try {
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/cgi-bin/wedoc/smartsheet/add_records?access_token=${token}`;
      
      // 企业微信支持批量创建，但建议分批处理
      const batchSize = 100; // 企业微信单次最多100条
      const results = [];
      
      for (let i = 0; i < dataList.length; i += batchSize) {
        const batch = dataList.slice(i, i + batchSize);
        
        const requestData = {
          docid: this.docId,
          sheet_id: this.sheetId,
          records: batch.map(data => this.formatDataForWework(data))
        };

        const headers = await this.getAuthHeaders();
        
        const response = await this.makeRequest(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });

        if (response.record_ids) {
          results.push(...response.record_ids.map((id, index) => ({
            id,
            success: true,
            originalIndex: i + index
          })));
        }
        
        // 避免速率限制
        if (i + batchSize < dataList.length) {
          await this.delay(100);
        }
      }
      
      return results;
    } catch (error) {
      this.log('error', '批量创建企业微信记录失败', { error: error.message, count: dataList.length });
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
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/cgi-bin/wedoc/smartsheet/update_records?access_token=${token}`;
      
      // 企业微信支持批量更新，但建议分批处理
      const batchSize = 100; // 企业微信单次最多100条
      const results = [];
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const requestData = {
          docid: this.docId,
          sheet_id: this.sheetId,
          records: batch.map(update => ({
            record_id: update.id,
            values: this.formatDataForWework(update.data).values
          }))
        };

        const headers = await this.getAuthHeaders();
        
        const response = await this.makeRequest(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });

        results.push(...batch.map((update, index) => ({
          id: update.id,
          success: true,
          originalIndex: i + index
        })));
        
        // 避免速率限制
        if (i + batchSize < updates.length) {
          await this.delay(100);
        }
      }
      
      return results;
    } catch (error) {
      this.log('error', '批量更新企业微信记录失败', { error: error.message, count: updates.length });
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
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/cgi-bin/wedoc/smartsheet/delete_records?access_token=${token}`;
      
      // 企业微信支持批量删除，但建议分批处理
      const batchSize = 100; // 企业微信单次最多100条
      let totalDeleted = 0;
      
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize);
        
        const requestData = {
          docid: this.docId,
          sheet_id: this.sheetId,
          record_ids: batch
        };

        const headers = await this.getAuthHeaders();
        
        await this.makeRequest(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData)
        });

        totalDeleted += batch.length;
        
        // 避免速率限制
        if (i + batchSize < recordIds.length) {
          await this.delay(100);
        }
      }
      
      return { 
        success: true, 
        deletedCount: totalDeleted,
        totalCount: recordIds.length
      };
    } catch (error) {
      this.log('error', '批量删除企业微信记录失败', { error: error.message, count: recordIds.length });
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
      const url = `${this.baseUrl}/cgi-bin/gettoken`;
      const params = new URLSearchParams({
        corpid: this.corpId,
        corpsecret: this.corpSecret
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.errcode !== 0) {
        throw new Error(`获取企业微信访问令牌失败: ${data.errmsg}`);
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 提前5分钟过期
      
      return this.accessToken;
    } catch (error) {
      console.error('获取企业微信访问令牌失败:', error);
      throw error;
    }
  }

  /**
   * 获取认证头信息
   * @returns {Promise<Object>} 认证头信息
   */
  async getAuthHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * 创建记录
   * @param {Object} data - 记录数据
   * @returns {Promise<Object>} 创建结果
   */
  async createRecord(data) {
    try {
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/cgi-bin/wedoc/smartsheet/add_records?access_token=${token}`;
      
      const requestData = {
        docid: this.docId,
        sheet_id: this.sheetId,
        records: [this.formatDataForWework(data)]
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return this.formatWeworkResponse(response);
    } catch (error) {
      this.log('error', '创建企业微信记录失败', { error: error.message, data });
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
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/cgi-bin/wedoc/smartsheet/update_records?access_token=${token}`;
      
      const requestData = {
        docid: this.docId,
        sheet_id: this.sheetId,
        records: [{
          record_id: recordId,
          values: this.formatDataForWework(data)
        }]
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return this.formatWeworkResponse(response);
    } catch (error) {
      this.log('error', '更新企业微信记录失败', { error: error.message, recordId, data });
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
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/cgi-bin/wedoc/smartsheet/delete_records?access_token=${token}`;
      
      const requestData = {
        docid: this.docId,
        sheet_id: this.sheetId,
        record_ids: [recordId]
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return { success: true, recordId };
    } catch (error) {
      this.log('error', '删除企业微信记录失败', { error: error.message, recordId });
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
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/cgi-bin/wedoc/smartsheet/get_records?access_token=${token}`;
      
      const requestData = {
        docid: this.docId,
        sheet_id: this.sheetId,
        limit: params.limit || 100,
        offset: params.offset || 0
      };
      
      if (params.filter) {
        requestData.filter = params.filter;
      }
      
      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return this.formatWeworkRecords(response.records || []);
    } catch (error) {
      this.log('error', '获取企业微信记录列表失败', { error: error.message, params });
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
      
      this.log('info', '企业微信连接测试成功');
      return true;
    } catch (error) {
      this.log('error', '企业微信连接测试失败', { error: error.message });
      return false;
    }
  }

  /**
   * 获取表格信息
   * @returns {Promise<Object>} 表格信息
   */
  async getTableInfo() {
    try {
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/cgi-bin/wedoc/smartsheet/get_sheet_info?access_token=${token}`;
      
      const requestData = {
        docid: this.docId,
        sheet_id: this.sheetId
      };
      
      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return {
        name: response.sheet_name || '企业微信智能表格',
        docId: this.docId,
        sheetId: this.sheetId,
        platform: 'wework',
        isConnected: true
      };
    } catch (error) {
      this.log('error', '获取企业微信表格信息失败', { error: error.message });
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
      id: { index: 0, type: 'text' },
      type: { index: 1, type: 'text' },
      name: { index: 2, type: 'text' },
      data: { index: 3, type: 'text' },
      metadata: { index: 4, type: 'text' },
      createdAt: { index: 5, type: 'date' },
      updatedAt: { index: 6, type: 'date' },
      status: { index: 7, type: 'select' },
      category: { index: 8, type: 'select' },
      quality: { index: 9, type: 'number' }
    };
  }
  
  formatDataForWework(data) {
    const fieldMapping = this.getFieldMapping();
    const values = [];
    
    // 根据字段映射格式化数据
    Object.keys(fieldMapping).forEach(key => {
      const fieldConfig = fieldMapping[key];
      let value = data[key];
      
      if (value !== undefined && value !== null) {
        // 根据字段类型格式化
        if (fieldConfig.type === 'text') {
          if (typeof value === 'object' && !Array.isArray(value)) {
            value = JSON.stringify(value);
          } else if (Array.isArray(value)) {
            value = value.join(', ');
          } else {
            value = String(value);
          }
        } else if (fieldConfig.type === 'number') {
          value = Number(value) || 0;
        } else if (fieldConfig.type === 'date') {
          value = value instanceof Date ? value.toISOString() : String(value);
        } else if (fieldConfig.type === 'select') {
          value = String(value);
        }
        
        values[fieldConfig.index] = { type: fieldConfig.type, value };
      }
    });
    
    // 确保必需字段存在
    if (!values[0] && data.id) {
      values[0] = { type: 'text', value: data.id };
    }
    
    if (!values[5]) {
      values[5] = { type: 'date', value: data.metadata?.createdAt || new Date().toISOString() };
    }
    
    if (!values[6]) {
      values[6] = { type: 'date', value: data.metadata?.updatedAt || new Date().toISOString() };
    }
    
    return { values };
  }

  formatWeworkResponse(response) {
    if (response.record_ids && response.record_ids.length > 0) {
      return {
        id: response.record_ids[0],
        success: true
      };
    }
    return response;
  }

  formatWeworkRecords(records) {
    return records.map(record => ({
      id: record.record_id,
      values: record.values,
      createTime: record.create_time,
      updateTime: record.update_time
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
        40013: '企业号不存在',
        40014: '应用不存在',
        41001: '缺少access_token参数',
        42001: 'access_token超时',
        43004: '需要接收者关注',
        45009: '接口调用超过限制',
        50001: '服务器内部错误',
        50002: '服务暂时不可用',
        60001: '网络异常',
        60002: '请求超时'
      };
      
      const errorMessage = errorMessages[data.errcode] || data.errmsg || '未知错误';
      const error = new Error(`企业微信API错误 (${data.errcode}): ${errorMessage}`);
      error.code = data.errcode;
      error.platform = 'wework';
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
        this.log('warn', `企业微信速率限制，等待 ${waitTime}ms`);
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

// 导出企业微信适配器类
export default WeworkAdapter;