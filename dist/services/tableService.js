/**
 * 多维表格统一服务类
 * 提供统一的多维表格操作接口
 */
import FeishuAdapter from './adapters/feishuAdapter.js';
import DingtalkAdapter from './adapters/dingtalkAdapter.js';
import WeworkAdapter from './adapters/weworkAdapter.js';

class TableService {
  constructor(config) {
    this.config = config;
    this.adapter = this.createAdapter(config.platform);
  }

  /**
   * 创建平台适配器
   * @param {string} platform - 平台类型 (feishu, dingtalk, wework)
   * @returns {Object} 适配器实例
   */
  createAdapter(platform) {
    switch (platform) {
      case 'feishu':
        return new FeishuAdapter(this.config);
      case 'dingtalk':
        return new DingtalkAdapter(this.config);
      case 'wework':
        return new WeworkAdapter(this.config);
      default:
        throw new Error(`不支持的平台类型: ${platform}`);
    }
  }

  /**
   * 创建记录
   * @param {Object} data - 记录数据
   * @returns {Promise<Object>} 创建结果
   */
  async createRecord(data) {
    try {
      return await this.adapter.createRecord(data);
    } catch (error) {
      console.error('创建记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新记录
   * @param {string} id - 记录ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateRecord(id, data) {
    try {
      return await this.adapter.updateRecord(id, data);
    } catch (error) {
      console.error('更新记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除记录
   * @param {string} id - 记录ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteRecord(id) {
    try {
      return await this.adapter.deleteRecord(id);
    } catch (error) {
      console.error('删除记录失败:', error);
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
      return await this.adapter.getRecords(params);
    } catch (error) {
      console.error('获取记录列表失败:', error);
      throw error;
    }
  }

  /**
   * 测试连接
   * @returns {Promise<boolean>} 连接测试结果
   */
  async testConnection() {
    try {
      return await this.adapter.testConnection();
    } catch (error) {
      console.error('连接测试失败:', error);
      return false;
    }
  }

  /**
   * 获取表格信息
   * @returns {Promise<Object>} 表格信息
   */
  async getTableInfo() {
    try {
      return await this.adapter.getTableInfo();
    } catch (error) {
      console.error('获取表格信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取表格列表
   * @returns {Promise<Array>} 表格列表
   */
  async getTables() {
    try {
      return await this.adapter.getTables();
    } catch (error) {
      console.error('获取表格列表失败:', error);
      throw error;
    }
  }
}

// 导出服务类
export default TableService;