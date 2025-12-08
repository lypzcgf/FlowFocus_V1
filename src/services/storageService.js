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
      const configs = await this.loadModelConfigs();
      
      const configWithType = {
        ...config,
        type: 'modelConfig',
        updatedAt: new Date().toISOString()
      };
      
      let existingIndex = -1;
      
      if (configWithType.id) {
        existingIndex = configs.findIndex(c => c.id === configWithType.id);
      } else {
        existingIndex = configs.findIndex(c => c.name === configWithType.name);
      }
      
      if (existingIndex >= 0) {
        configs[existingIndex] = configWithType;
      } else {
        configs.push(configWithType);
      }
      
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
      const records = await this.loadRewriteRecords();
      
      const recordWithType = {
        ...record,
        type: 'rewriteRecord',
        updatedAt: new Date().toISOString()
      };
      
      let existingIndex = -1;
      
      if (recordWithType.id) {
        existingIndex = records.findIndex(r => r.id === recordWithType.id);
      } else {
        existingIndex = records.findIndex(r => r.name === recordWithType.name);
      }
      
      if (existingIndex >= 0) {
        records[existingIndex] = recordWithType;
      } else {
        records.push(recordWithType);
      }
      
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
  
  /**
   * 保存表格配置
   * @param {Object} config - 表格配置对象
   * @returns {Promise<void>}
   */
  async saveTableConfig(config) {
    try {
      const configs = await this.loadData('tableConfigs') || [];
      
      const configWithType = {
        ...config,
        type: 'tableConfig',
        updatedAt: new Date().toISOString()
      };
      
      let existingIndex = -1;
      
      if (configWithType.id) {
        existingIndex = configs.findIndex(c => c.id === configWithType.id);
      } else {
        existingIndex = configs.findIndex(c => c.name === configWithType.name);
      }
      
      if (existingIndex >= 0) {
        configs[existingIndex] = configWithType;
      } else {
        configs.push(configWithType);
      }
      
      await this.saveData('tableConfigs', configs);
    } catch (error) {
      console.error('保存表格配置失败:', error);
      throw error;
    }
  }

  /**
   * 加载所有表格配置
   * @returns {Promise<Array>}
   */
  async loadTableConfigs() {
    try {
      const configs = await this.loadData('tableConfigs');
      return configs || [];
    } catch (error) {
      console.error('加载表格配置失败:', error);
      return [];
    }
  }

  /**
   * 删除表格配置
   * @param {string} configId - 配置ID
   * @returns {Promise<void>}
   */
  async deleteTableConfig(configId) {
    try {
      const configs = await this.loadTableConfigs();
      const updatedConfigs = configs.filter(config => config.id !== configId);
      await this.saveData('tableConfigs', updatedConfigs);
    } catch (error) {
      console.error('删除表格配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定ID的表格配置
   * @param {string} configId - 配置ID
   * @returns {Promise<Object|null>}
   */
  async getTableConfig(configId) {
    try {
      const configs = await this.loadTableConfigs();
      const config = configs.find(c => c.id === configId);
      return config || null;
    } catch (error) {
      console.error('获取表格配置失败:', error);
      return null;
    }
  }

  /**
   * 批量添加类型标记到现有记录
   */
  async upgradeExistingRecords() {
    try {
      const modelConfigs = await this.loadModelConfigs();
      const upgradedModelConfigs = modelConfigs.map(config => ({
        ...config,
        type: 'modelConfig'
      }));
      await this.saveData('modelConfigs', upgradedModelConfigs);
      
      const rewriteRecords = await this.loadRewriteRecords();
      const upgradedRewriteRecords = rewriteRecords.map(record => ({
        ...record,
        type: 'rewriteRecord'
      }));
      await this.saveData('rewriteRecords', upgradedRewriteRecords);
      
      const tableConfigs = await this.loadTableConfigs();
      const upgradedTableConfigs = tableConfigs.map(config => ({
        ...config,
        type: 'tableConfig'
      }));
      await this.saveData('tableConfigs', upgradedTableConfigs);
      
      console.log('成功升级所有记录，添加了类型标记');
    } catch (error) {
      console.error('升级记录失败:', error);
    }
  }

  async migrateTargetTableFields() {
    try {
      const modelConfigs = await this.loadModelConfigs();
      const migratedModelConfigs = (modelConfigs || []).map(c => {
        if (!c.targetTableName && c.targetTableId) {
          return { ...c, targetTableName: c.targetTableId };
        }
        return c;
      });
      if (JSON.stringify(modelConfigs) !== JSON.stringify(migratedModelConfigs)) {
        await this.saveData('modelConfigs', migratedModelConfigs);
      }

      const tableConfigs = await this.loadTableConfigs();
      const migratedTableConfigs = (tableConfigs || []).map(c => {
        if (!c.targetTableName && c.targetTableId) {
          return { ...c, targetTableName: c.targetTableId };
        }
        return c;
      });
      if (JSON.stringify(tableConfigs) !== JSON.stringify(migratedTableConfigs)) {
        await this.saveData('tableConfigs', migratedTableConfigs);
      }

      const rewriteRecords = await this.loadRewriteRecords();
      const migratedRewriteRecords = (rewriteRecords || []).map(r => {
        if (!r.targetTableName && r.targetTableId) {
          return { ...r, targetTableName: r.targetTableId };
        }
        return r;
      });
      if (JSON.stringify(rewriteRecords) !== JSON.stringify(migratedRewriteRecords)) {
        await this.saveData('rewriteRecords', migratedRewriteRecords);
      }

      const defaultKeys = ['rewriteDefaultTarget', 'modelDefaultTarget', 'tableDefaultTarget'];
      for (const key of defaultKeys) {
        const obj = await this.loadData(key);
        if (obj && typeof obj === 'object') {
          if (!obj.targetTableName && obj.targetTableId) {
            const updated = { ...obj, targetTableName: obj.targetTableId };
            await this.saveData(key, updated);
          }
        }
      }
    } catch (error) {
      console.error('迁移字段失败:', error);
    }
  }
}

// 导出存储服务实例
const storageService = new StorageService();
export default storageService;