/**
 * 飞书多维表格适配器
 * 实现飞书多维表格API的具体集成
 * 支持完整的CRUD操作、批量操作、错误处理和重试机制
 */
import BaseAdapter from './baseAdapter.js';

class FeishuAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    // 解决参数名称不一致问题：优先使用tableToken，如果不存在则使用tableId
    this.tableToken = config.tableToken || config.tableId;
    this.tableId = config.tableId || 'tblDefault';
    this.baseUrl = config.baseUrl || 'https://open.feishu.cn/open-apis/bitable/v1';
    this.authUrl = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
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
    return ['appId', 'appSecret', 'tableToken'];
  }

  /**
   * 批量创建记录
   * @param {Array} dataList - 记录数据列表
   * @returns {Promise<Array>} 创建结果列表
   */
  async batchCreateRecords(dataList) {
    try {
      const url = `${this.baseUrl}/apps/${this.tableToken}/tables/${this.getTableId()}/records/batch_create`;
      
      const requestData = {
        records: dataList.map(data => ({
          fields: this.formatDataForFeishu(data)
        }))
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return response.data?.records?.map(record => this.formatFeishuResponse({ data: { record } })) || [];
    } catch (error) {
      this.log('error', '批量创建飞书记录失败', { error: error.message, count: dataList.length });
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
      const url = `${this.baseUrl}/apps/${this.tableToken}/tables/${this.getTableId()}/records/batch_update`;
      
      const requestData = {
        records: updates.map(update => ({
          record_id: update.id,
          fields: this.formatDataForFeishu(update.data)
        }))
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return response.data?.records?.map(record => this.formatFeishuResponse({ data: { record } })) || [];
    } catch (error) {
      this.log('error', '批量更新飞书记录失败', { error: error.message, count: updates.length });
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
      const url = `${this.baseUrl}/apps/${this.tableToken}/tables/${this.getTableId()}/records/batch_delete`;
      
      const requestData = {
        records: recordIds
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return { 
        success: true, 
        deletedCount: recordIds.length,
        recordIds 
      };
    } catch (error) {
      this.log('error', '批量删除飞书记录失败', { error: error.message, count: recordIds.length });
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
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: this.appId,
          app_secret: this.appSecret
        })
      });

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`获取访问令牌失败: ${data.msg}`);
      }

      this.accessToken = data.tenant_access_token;
      this.tokenExpiry = Date.now() + (data.expire - 300) * 1000; // 提前5分钟过期
      
      return this.accessToken;
    } catch (error) {
      console.error('获取飞书访问令牌失败:', error);
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
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 检查速率限制
   * @returns {Promise<void>}
   */
  async checkRateLimit() {
    if (this.rateLimitRemaining <= 0 && this.rateLimitReset) {
      const waitTime = this.rateLimitReset - Date.now();
      if (waitTime > 0) {
        this.log('warn', `速率限制，等待 ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }
  }

  /**
   * 更新速率限制信息
   * @param {Response} response - HTTP响应对象
   */
  updateRateLimit(response) {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (remaining !== null) {
      this.rateLimitRemaining = parseInt(remaining);
    }
    
    if (reset !== null) {
      this.rateLimitReset = parseInt(reset) * 1000; // 转换为毫秒
    }
  }

  /**
   * 创建记录
   * @param {Object} data - 记录数据
   * @returns {Promise<Object>} 创建结果
   */
  async createRecord(data) {
    try {
      const url = `${this.baseUrl}/apps/${this.tableToken}/tables/${this.getTableId()}/records`;
      
      const requestData = {
        fields: this.formatDataForFeishu(data)
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      return this.formatFeishuResponse(response);
    } catch (error) {
      this.log('error', '创建飞书记录失败', { error: error.message, data });
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
      const url = `${this.baseUrl}/apps/${this.tableToken}/tables/${this.getTableId()}/records/${recordId}`;
      
      const requestData = {
        fields: this.formatDataForFeishu(data)
      };

      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestData)
      });

      return this.formatFeishuResponse(response);
    } catch (error) {
      this.log('error', '更新飞书记录失败', { error: error.message, recordId, data });
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
      const url = `${this.baseUrl}/apps/${this.tableToken}/tables/${this.getTableId()}/records/${recordId}`;
      
      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'DELETE',
        headers
      });

      return { success: true, recordId };
    } catch (error) {
      this.log('error', '删除飞书记录失败', { error: error.message, recordId });
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
      const url = `${this.baseUrl}/apps/${this.tableToken}/tables/${this.getTableId()}/records`;
      
      const queryParams = new URLSearchParams();
      if (params.pageSize) queryParams.append('page_size', params.pageSize);
      if (params.pageToken) queryParams.append('page_token', params.pageToken);
      if (params.filter) queryParams.append('filter', JSON.stringify(params.filter));
      
      const fullUrl = queryParams.toString() ? `${url}?${queryParams}` : url;
      
      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(fullUrl, {
        method: 'GET',
        headers
      });

      return this.formatFeishuRecords(response.data?.items || []);
    } catch (error) {
      this.log('error', '获取飞书记录列表失败', { error: error.message, params });
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
      
      this.log('info', '飞书连接测试成功');
      return true;
    } catch (error) {
      this.log('error', '飞书连接测试失败', { error: error.message });
      return false;
    }
  }

  /**
   * 获取表格信息
   * @returns {Promise<Object>} 表格信息
   */
  async getTableInfo() {
    try {
      const url = `${this.baseUrl}/apps/${this.tableToken}`;
      
      const headers = await this.getAuthHeaders();
      
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers
      });

      return {
        name: response.data?.app?.name || '未知表格',
        tableToken: this.tableToken,
        platform: 'feishu',
        isConnected: true
      };
    } catch (error) {
      this.log('error', '获取飞书表格信息失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取表格列表
   * @returns {Promise<Array>} 表格列表
   */
  async getTables() {
    try {
      // 检查tableToken是否为空或undefined
      if (!this.tableToken || this.tableToken === 'undefined') {
        this.log('error', '表格Token为空或未定义', { tableToken: this.tableToken });
        throw new Error('配置错误：表格Token为空或未定义，请检查配置');
      }
      
      // 根据用户建议，使用包含/tables子路径的API端点
      const url = `${this.baseUrl}/apps/${this.tableToken}/tables`;
      
      this.log('debug', '获取表格列表', {
        baseUrl: this.baseUrl,
        tableToken: this.tableToken.substring(0, 5) + '...',
        url: url
      });
      
      const headers = await this.getAuthHeaders();
      
      // 记录完整的认证头信息（隐藏token值）
      const safeHeaders = { ...headers };
      if (safeHeaders.Authorization) {
        safeHeaders.Authorization = 'Bearer ********';
      }
      this.log('debug', '请求头信息', { headers: safeHeaders });
      
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers
      });

      // 成功获取表格列表
      this.log('debug', '获取表格列表成功', { responseData: JSON.stringify(response.data).substring(0, 300) });
      
      // 检查响应数据格式
      if (!response.data || !response.data.items) {
        this.log('warn', '响应数据格式不符合预期，返回默认表格', { response: JSON.stringify(response).substring(0, 300) });
        return [{ 
          id: 'tblDefault', 
          name: '默认表格', 
          description: 'API返回数据格式不符合预期', 
          fields: [] 
        }];
      }
      
      // 映射表格数据
      return response.data.items.map(table => ({
        id: table.table_id || 'tblDefault',
        name: table.name || '未命名表格',
        description: table.description || '',
        fields: [] // 字段信息将在后续获取
      }));
    } catch (error) {
      // 增强错误信息，添加当前配置的上下文
      const appIdSafe = this.appId ? this.appId.substring(0, 5) + '...' : 'undefined';
      const tableTokenSafe = this.tableToken ? this.tableToken.substring(0, 5) + '...' : 'undefined';
      
      const contextError = new Error(`获取表格列表失败，配置信息：appId=${appIdSafe}, tableToken=${tableTokenSafe}, baseUrl=${this.baseUrl}\n错误详情: ${error.message}`);
      contextError.originalError = error;
      contextError.configuration = {
        appId: this.appId,
        tableToken: this.tableToken,
        baseUrl: this.baseUrl
      };
      
      this.log('error', '获取飞书表格列表失败', { 
        error: error.message,
        appId: appIdSafe,
        tableToken: tableTokenSafe,
        baseUrl: this.baseUrl
      });
      throw contextError;
    }
  }

  // 私有方法
  getTableId() {
    // 飞书多维表格中，如果没有指定具体的表格ID，使用默认的第一个表格
    return this.config.tableId || 'tblDefault';
  }

  formatDataForFeishu(data) {
    const fieldMapping = this.getFieldMapping();
    const formattedData = {};
    
    // 基础字段映射
    Object.keys(fieldMapping).forEach(key => {
      const feishuField = fieldMapping[key];
      let value = data[key];
      
      if (value !== undefined && value !== null) {
        // 根据数据类型格式化
        if (typeof value === 'object' && !Array.isArray(value)) {
          value = JSON.stringify(value);
        } else if (Array.isArray(value)) {
          value = value.join(', ');
        } else if (typeof value === 'boolean') {
          value = value ? '是' : '否';
        } else {
          value = String(value);
        }
        
        formattedData[feishuField] = [{ type: 'text', text: value }];
      }
    });
    
    // 确保必需字段存在
    if (!formattedData['ID'] && data.id) {
      formattedData['ID'] = [{ type: 'text', text: data.id }];
    }
    
    if (!formattedData['创建时间']) {
      formattedData['创建时间'] = [{ type: 'text', text: data.metadata?.createdAt || new Date().toISOString() }];
    }
    
    if (!formattedData['更新时间']) {
      formattedData['更新时间'] = [{ type: 'text', text: data.metadata?.updatedAt || new Date().toISOString() }];
    }
    
    return formattedData;
  }

  formatFeishuResponse(response) {
    if (response.data?.record) {
      return {
        id: response.data.record.record_id,
        fields: response.data.record.fields,
        createdTime: response.data.record.created_time,
        lastModifiedTime: response.data.record.last_modified_time
      };
    }
    return response;
  }

  formatFeishuRecords(records) {
    return records.map(record => ({
      id: record.record_id,
      fields: record.fields,
      createdTime: record.created_time,
      lastModifiedTime: record.last_modified_time
    }));
  }

  /**
   * 重写makeRequest方法以支持速率限制和飞书API响应格式
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} 响应结果
   */
  async makeRequest(url, options = {}) {
    await this.checkRateLimit();
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...await this.getAuthHeaders()
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
        this.log('debug', `发送请求到: ${url}，尝试: ${attempt}/${this.retryCount}`, { 
          method: requestOptions.method, 
          headers: JSON.stringify(requestOptions.headers),
          body: requestOptions.body ? JSON.stringify(requestOptions.body).substring(0, 200) : '无请求体'
        });
        
        const response = await this.fetchWithTimeout(url, requestOptions);
        
        // 先检查响应状态
        if (!response.ok) {
          // 尝试解析错误响应来获取详细的飞书错误信息
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          let requestDetails = `请求URL: ${url}\n请求方法: ${requestOptions.method}\n请求头: ${JSON.stringify(requestOptions.headers).substring(0, 300)}\n`;
          
          if (requestOptions.body) {
            requestDetails += `请求体: ${JSON.stringify(requestOptions.body).substring(0, 300)}\n`;
          }
          
          try {
            const errorData = await response.json();
            if (errorData.code) {
              errorMessage = `飞书API错误 (${errorData.code}): ${errorData.msg}`;
            } else if (errorData.error) {
              errorMessage = `飞书API错误: ${errorData.error}`;
            }
            requestDetails += `错误响应: ${JSON.stringify(errorData).substring(0, 300)}\n`;
          } catch (parseError) {
            // 如果无法解析JSON，使用原始错误信息
            try {
              const text = await response.text();
              if (text) {
                errorMessage += ` - 响应内容: ${text.substring(0, 200)}`;
                requestDetails += `原始响应: ${text.substring(0, 300)}\n`;
              }
            } catch (textError) {
              // 忽略文本解析错误
            }
          }
          
          // 将所有详细信息添加到错误对象中，以便在错误处理时显示
          const detailedError = new Error(`${errorMessage}\n\n详细信息:\n${requestDetails}`);
          detailedError.requestUrl = url;
          detailedError.requestOptions = requestOptions;
          detailedError.responseStatus = response.status;
          
          throw detailedError;
        }
        
        // 更新速率限制信息
        this.updateRateLimit(response);
        
        const data = await response.json();
        
        // 直接使用飞书适配器的handleResponse处理API响应
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
   * 处理API响应
   * @param {Object} data - 响应数据
   * @returns {Object} 处理后的数据
   */
  handleResponse(data) {
    if (data.code !== 0) {
      // 根据错误码提供更详细的错误信息
      const errorMessages = {
        40001: '无效的访问令牌 - 请检查应用权限和认证配置',
        40002: '访问令牌已过期 - 请尝试重新连接',
        40003: '应用权限不足 - 请确保应用拥有访问多维表格的权限',
        40004: '请求参数错误 - 可能是参数格式不正确',
        40005: '资源不存在 - 可能是表格ID错误或表格已被删除',
        40006: '操作被限制 - 可能是API调用频率过高或账号被限制',
        50001: '服务器内部错误 - 飞书服务器临时问题',
        50002: '服务暂时不可用 - 飞书服务正在维护中',
        91402: '资源不存在 - 可能是表格token错误、路径错误或权限不足'
      };
      
      const errorMessage = errorMessages[data.code] || data.msg || '未知错误';
      // 记录详细的响应数据用于调试
      this.log('debug', 'API响应错误', {
        code: data.code,
        msg: data.msg,
        errorMessage: errorMessage,
        fullResponse: JSON.stringify(data)
      });
      
      const error = new Error(`飞书API错误 (${data.code}): ${errorMessage}\n\n完整响应: ${JSON.stringify(data).substring(0, 300)}`);
      error.code = data.code;
      error.platform = 'feishu';
      error.rawData = data;
      throw error;
    }
    return data;
  }

  /**
   * 获取字段映射配置
   * @returns {Object} 字段映射配置
   */
  getFieldMapping() {
    return {
      id: 'ID',
      type: '类型',
      name: '名称',
      data: '数据',
      metadata: '元数据',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      status: '状态',
      category: '分类',
      quality: '质量评估'
    };
  }
}

// 导出飞书适配器类
export default FeishuAdapter;