/**
 * 存储服务模块
 * 提供数据的增删改查功能
 */

class StorageService {
  /**
   * 保存数据到Chrome Storage
   * @param {string} key - 存储键
   * @param {any} value - 存储值
   * @returns {Promise<void>}
   */
  async saveData(key, value) {
    return new Promise((resolve, reject) => {
      const data = {};
      data[key] = value;
      
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 从Chrome Storage加载数据
   * @param {string} key - 存储键
   * @returns {Promise<any>}
   */
  async loadData(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  /**
   * 从Chrome Storage删除数据
   * @param {string} key - 存储键
   * @returns {Promise<void>}
   */
  async deleteData(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 编辑Chrome Storage中的数据
   * @param {string} key - 存储键
   * @param {any} value - 新的存储值
   * @returns {Promise<void>}
   */
  async editData(key, value) {
    // 编辑数据实际上是保存数据的一个别名，因为Chrome Storage的set方法既可以创建也可以更新数据
    return this.saveData(key, value);
  }

  /**
   * 清空所有数据
   * @returns {Promise<void>}
   */
  async clearAllData() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 保存模型配置
   * @param {Object} config - 模型配置对象
   * @returns {Promise<void>}
   */
  async saveModelConfig(config) {
    try {
      // 获取现有的配置列表
      const configs = await this.loadModelConfigs();
      
      // 检查是否已存在同名配置
      const existingIndex = configs.findIndex(c => c.name === config.name);
      
      if (existingIndex >= 0) {
        // 更新现有配置
        configs[existingIndex] = config;
      } else {
        // 添加新配置
        configs.push(config);
      }
      
      // 保存更新后的配置列表
      await this.saveData('modelConfigs', configs);
    } catch (error) {
      console.error('保存模型配置失败:', error);
      throw error;
    }
  }

  /**
   * 加载所有模型配置
   * @returns {Promise<Array>}
   */
  async loadModelConfigs() {
    try {
      const configs = await this.loadData('modelConfigs');
      return configs || [];
    } catch (error) {
      console.error('加载模型配置失败:', error);
      return [];
    }
  }

  /**
   * 删除模型配置
   * @param {string} configName - 配置名称
   * @returns {Promise<void>}
   */
  async deleteModelConfig(configName) {
    try {
      const configs = await this.loadModelConfigs();
      const updatedConfigs = configs.filter(config => config.name !== configName);
      await this.saveData('modelConfigs', updatedConfigs);
    } catch (error) {
      console.error('删除模型配置失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除模型配置
   * @param {Array<string>} configNames - 配置名称数组
   * @returns {Promise<void>}
   */
  async deleteModelConfigs(configNames) {
    try {
      const configs = await this.loadModelConfigs();
      const updatedConfigs = configs.filter(config => !configNames.includes(config.name));
      await this.saveData('modelConfigs', updatedConfigs);
    } catch (error) {
      console.error('批量删除模型配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定名称的模型配置
   * @param {string} configName - 配置名称
   * @returns {Promise<Object|null>}
   */
  async getModelConfig(configName) {
    try {
      const configs = await this.loadModelConfigs();
      const config = configs.find(c => c.name === configName);
      return config || null;
    } catch (error) {
      console.error('获取模型配置失败:', error);
      return null;
    }
  }

  /**
   * 保存改写记录
   * @param {Object} record - 改写记录对象
   * @returns {Promise<void>}
   */
  async saveRewriteRecord(record) {
    try {
      // 获取现有的改写记录列表
      const records = await this.loadRewriteRecords();
      
      // 检查是否已存在同名记录
      const existingIndex = records.findIndex(r => r.name === record.name);
      
      if (existingIndex >= 0) {
        // 更新现有记录
        records[existingIndex] = record;
      } else {
        // 添加新记录
        records.push(record);
      }
      
      // 保存更新后的记录列表
      await this.saveData('rewriteRecords', records);
    } catch (error) {
      console.error('保存改写记录失败:', error);
      throw error;
    }
  }

  /**
   * 加载所有改写记录
   * @returns {Promise<Array>}
   */
  async loadRewriteRecords() {
    try {
      const records = await this.loadData('rewriteRecords');
      return records || [];
    } catch (error) {
      console.error('加载改写记录失败:', error);
      return [];
    }
  }

  /**
   * 删除改写记录
   * @param {string} recordName - 记录名称
   * @returns {Promise<void>}
   */
  async deleteRewriteRecord(recordName) {
    try {
      const records = await this.loadRewriteRecords();
      const updatedRecords = records.filter(record => record.name !== recordName);
      await this.saveData('rewriteRecords', updatedRecords);
    } catch (error) {
      console.error('删除改写记录失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除改写记录
   * @param {Array<string>} recordNames - 记录名称数组
   * @returns {Promise<void>}
   */
  async deleteRewriteRecords(recordNames) {
    try {
      const records = await this.loadRewriteRecords();
      const updatedRecords = records.filter(record => !recordNames.includes(record.name));
      await this.saveData('rewriteRecords', updatedRecords);
    } catch (error) {
      console.error('批量删除改写记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定名称的改写记录
   * @param {string} recordName - 记录名称
   * @returns {Promise<Object|null>}
   */
  async getRewriteRecord(recordName) {
    try {
      const records = await this.loadRewriteRecords();
      const record = records.find(r => r.name === recordName);
      return record || null;
    } catch (error) {
      console.error('获取改写记录失败:', error);
      return null;
    }
  }

  /**
   * 编辑改写记录
   * @param {string} recordName - 记录名称
   * @param {Object} updates - 更新内容
   * @returns {Promise<void>}
   */
  async editRewriteRecord(recordName, updates) {
    try {
      const records = await this.loadRewriteRecords();
      const index = records.findIndex(record => record.name === recordName);
      
      if (index >= 0) {
        // 更新记录
        records[index] = { ...records[index], ...updates, updatedAt: new Date().toISOString() };
        await this.saveData('rewriteRecords', records);
      } else {
        throw new Error(`未找到名称为 "${recordName}" 的改写记录`);
      }
    } catch (error) {
      console.error('编辑改写记录失败:', error);
      throw error;
    }
  }
}

// 导出存储服务实例
const storageService = new StorageService();
export default storageService;