/**
 * 记录数据模型
 * 定义各种记录的数据结构和操作方法
 */

/**
 * 改写记录模型
 */
class RewriteRecord {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.originalText = data.originalText || '';
    this.rewrittenText = data.rewrittenText || '';
    this.modelType = data.modelType || '';
    this.modelName = data.modelName || '';
    this.modelConfigId = data.modelConfigId || '';
    this.modelConfigName = data.modelConfigName || '';
    this.prompt = data.prompt || '';
    this.category = data.category || '通用';
    this.tags = data.tags || [];
    this.quality = data.quality || 0; // 0-5星评级
    this.isFavorite = data.isFavorite || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    // 扩展字段
    this.sourceUrl = data.sourceUrl || '';
    this.sourceTitle = data.sourceTitle || '';
    this.wordCount = data.wordCount || this.calculateWordCount();
    this.processingTime = data.processingTime || 0; // 处理时间(毫秒)
    this.cost = data.cost || 0; // API调用成本
    
    // 同步状态
    this.syncStatus = data.syncStatus || 'pending'; // pending, syncing, synced, failed
    this.syncTargets = data.syncTargets || []; // 同步目标列表
    this.lastSyncAt = data.lastSyncAt || null;
    this.syncErrors = data.syncErrors || [];
    
    this.metadata = data.metadata || {};
  }

  /**
   * 计算字数
   * @returns {number} 字数
   */
  calculateWordCount() {
    if (!this.originalText) return 0;
    // 中文字符按字计算，英文按单词计算
    const chineseChars = (this.originalText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (this.originalText.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }

  /**
   * 验证记录数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];
    
    if (!this.originalText.trim()) errors.push('原始文本不能为空');
    if (!this.rewrittenText.trim()) errors.push('改写文本不能为空');
    if (!this.modelType) errors.push('模型类型不能为空');
    
    if (this.quality < 0 || this.quality > 5) {
      errors.push('质量评级必须在0-5之间');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 更新同步状态
   * @param {string} status - 同步状态
   * @param {string} target - 同步目标
   * @param {string} error - 错误信息
   */
  updateSyncStatus(status, target = null, error = null) {
    this.syncStatus = status;
    this.updatedAt = new Date().toISOString();
    
    if (status === 'synced') {
      this.lastSyncAt = new Date().toISOString();
      if (target && !this.syncTargets.includes(target)) {
        this.syncTargets.push(target);
      }
    }
    
    if (error) {
      this.syncErrors.push({
        target,
        error,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 添加标签
   * @param {string} tag - 标签
   */
  addTag(tag) {
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * 移除标签
   * @param {string} tag - 标签
   */
  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * 设置质量评级
   * @param {number} rating - 评级(0-5)
   */
  setQuality(rating) {
    if (rating >= 0 && rating <= 5) {
      this.quality = rating;
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * 转换为存储格式
   * @returns {Object} 存储格式数据
   */
  toStorageFormat() {
    return {
      id: this.id,
      originalText: this.originalText,
      rewrittenText: this.rewrittenText,
      modelType: this.modelType,
      modelName: this.modelName,
      modelConfigId: this.modelConfigId,
      modelConfigName: this.modelConfigName,
      prompt: this.prompt,
      category: this.category,
      tags: this.tags,
      quality: this.quality,
      isFavorite: this.isFavorite,
      sourceUrl: this.sourceUrl,
      sourceTitle: this.sourceTitle,
      wordCount: this.wordCount,
      processingTime: this.processingTime,
      cost: this.cost,
      syncStatus: this.syncStatus,
      syncTargets: this.syncTargets,
      lastSyncAt: this.lastSyncAt,
      syncErrors: this.syncErrors,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  /**
   * 从存储格式创建实例
   * @param {Object} data - 存储格式数据
   * @returns {RewriteRecord} 改写记录实例
   */
  static fromStorageFormat(data) {
    return new RewriteRecord(data);
  }

  /**
   * 获取统计信息
   * @param {Array} records - 记录数组
   * @returns {Object} 统计信息
   */
  static getStatistics(records) {
    if (!records || records.length === 0) {
      return {
        total: 0,
        byModel: {},
        byCategory: {},
        averageQuality: 0,
        totalWordCount: 0,
        syncedCount: 0
      };
    }
    
    const stats = {
      total: records.length,
      byModel: {},
      byCategory: {},
      averageQuality: 0,
      totalWordCount: 0,
      syncedCount: 0
    };
    
    let totalQuality = 0;
    
    records.forEach(record => {
      // 按模型统计
      stats.byModel[record.modelType] = (stats.byModel[record.modelType] || 0) + 1;
      
      // 按类别统计
      stats.byCategory[record.category] = (stats.byCategory[record.category] || 0) + 1;
      
      // 质量统计
      totalQuality += record.quality;
      
      // 字数统计
      stats.totalWordCount += record.wordCount;
      
      // 同步状态统计
      if (record.syncStatus === 'synced') {
        stats.syncedCount++;
      }
    });
    
    stats.averageQuality = totalQuality / records.length;
    
    return stats;
  }

  generateId() {
    return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 同步记录模型
 */
class SyncRecord {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.type = data.type || 'single'; // single, batch, full
    this.sourceType = data.sourceType || 'rewrite'; // rewrite, config
    this.targetPlatform = data.targetPlatform || '';
    this.targetConfig = data.targetConfig || {};
    this.status = data.status || 'pending'; // pending, running, completed, failed
    this.progress = data.progress || 0; // 0-100
    this.startTime = data.startTime || null;
    this.endTime = data.endTime || null;
    this.duration = data.duration || 0;
    
    // 同步数据
    this.sourceIds = data.sourceIds || []; // 源数据ID列表
    this.successCount = data.successCount || 0;
    this.failedCount = data.failedCount || 0;
    this.totalCount = data.totalCount || 0;
    
    // 结果和错误
    this.results = data.results || [];
    this.errors = data.errors || [];
    this.summary = data.summary || {};
    
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  /**
   * 开始同步
   */
  start() {
    this.status = 'running';
    this.startTime = new Date().toISOString();
    this.progress = 0;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 更新进度
   * @param {number} progress - 进度百分比
   */
  updateProgress(progress) {
    this.progress = Math.min(100, Math.max(0, progress));
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 添加成功结果
   * @param {Object} result - 成功结果
   */
  addSuccess(result) {
    this.results.push({
      ...result,
      status: 'success',
      timestamp: new Date().toISOString()
    });
    this.successCount++;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 添加失败结果
   * @param {Object} error - 错误信息
   */
  addError(error) {
    this.errors.push({
      ...error,
      timestamp: new Date().toISOString()
    });
    this.failedCount++;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 完成同步
   * @param {Object} summary - 同步摘要
   */
  complete(summary = {}) {
    this.status = this.failedCount === 0 ? 'completed' : 'failed';
    this.endTime = new Date().toISOString();
    this.progress = 100;
    this.duration = new Date(this.endTime) - new Date(this.startTime);
    this.summary = {
      ...summary,
      successRate: this.totalCount > 0 ? (this.successCount / this.totalCount * 100).toFixed(2) + '%' : '0%'
    };
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 转换为存储格式
   * @returns {Object} 存储格式数据
   */
  toStorageFormat() {
    return {
      id: this.id,
      type: this.type,
      sourceType: this.sourceType,
      targetPlatform: this.targetPlatform,
      targetConfig: this.targetConfig,
      status: this.status,
      progress: this.progress,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      sourceIds: this.sourceIds,
      successCount: this.successCount,
      failedCount: this.failedCount,
      totalCount: this.totalCount,
      results: this.results,
      errors: this.errors,
      summary: this.summary,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  /**
   * 从存储格式创建实例
   * @param {Object} data - 存储格式数据
   * @returns {SyncRecord} 同步记录实例
   */
  static fromStorageFormat(data) {
    return new SyncRecord(data);
  }

  generateId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 操作日志模型
 */
class OperationLog {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.action = data.action || ''; // create, update, delete, sync, etc.
    this.target = data.target || ''; // record, config, etc.
    this.targetId = data.targetId || '';
    this.userId = data.userId || 'system';
    this.details = data.details || {};
    this.result = data.result || 'success'; // success, failed
    this.error = data.error || null;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  /**
   * 转换为存储格式
   * @returns {Object} 存储格式数据
   */
  toStorageFormat() {
    return {
      id: this.id,
      action: this.action,
      target: this.target,
      targetId: this.targetId,
      userId: this.userId,
      details: this.details,
      result: this.result,
      error: this.error,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }

  /**
   * 从存储格式创建实例
   * @param {Object} data - 存储格式数据
   * @returns {OperationLog} 操作日志实例
   */
  static fromStorageFormat(data) {
    return new OperationLog(data);
  }

  generateId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 导出记录模型类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RewriteRecord,
    SyncRecord,
    OperationLog
  };
} else {
  window.RewriteRecord = RewriteRecord;
  window.SyncRecord = SyncRecord;
  window.OperationLog = OperationLog;
}