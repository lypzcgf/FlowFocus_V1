/**
 * 数据同步服务类
 * 提供数据同步引擎功能
 * 支持单条同步、批量同步、全选同步、进度跟踪和错误处理
 */
class SyncService {
  constructor() {
    this.syncQueue = [];
    this.isRunning = false;
    this.syncStatus = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.batchSize = 10; // 批量处理大小
    this.concurrentLimit = 3; // 并发限制
    this.progressCallbacks = new Map(); // 进度回调
    this.performanceMetrics = new Map(); // 性能指标
    this.errorStats = new Map(); // 错误统计
    this.circuitBreakers = new Map(); // 熔断器
    
    // 同步策略配置
    this.syncStrategies = {
      'conservative': { 
        batchSize: 5, 
        concurrentLimit: 1, 
        delay: 500,
        retryDelay: 2000,
        maxRetries: 5
      },
      'balanced': { 
        batchSize: 10, 
        concurrentLimit: 3, 
        delay: 200,
        retryDelay: 1000,
        maxRetries: 3
      },
      'aggressive': { 
        batchSize: 20, 
        concurrentLimit: 5, 
        delay: 100,
        retryDelay: 500,
        maxRetries: 2
      }
    };
    
    // 平台特定配置
    this.platformConfigs = {
      'feishu': {
        supportsBatch: true,
        maxBatchSize: 100,
        recommendedConcurrency: 5,
        rateLimit: 1000,
        retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
      },
      'dingtalk': {
        supportsBatch: false,
        maxBatchSize: 1,
        recommendedConcurrency: 3,
        rateLimit: 600,
        retryableErrors: ['RATE_LIMIT', 'TIMEOUT']
      },
      'wework': {
        supportsBatch: true,
        maxBatchSize: 50,
        recommendedConcurrency: 3,
        rateLimit: 500,
        retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'NETWORK_ERROR']
      }
    };
  }

  /**
   * 单条同步（增强版）
   * @param {Object} record - 记录数据
   * @param {Object} targetConfig - 目标配置
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncSingle(record, targetConfig, options = {}) {
    const syncId = this.generateSyncId();
    const startTime = Date.now();
    const platform = targetConfig.platform;
    
    try {
      // 检查熔断器状态
      if (this.isCircuitBreakerOpen(platform)) {
        throw new Error(`平台 ${platform} 熔断器已开启，暂停同步`);
      }
      
      this.updateSyncStatus(syncId, 'syncing', record.id);
      
      // 数据映射
      const mappedData = DataMapper.serializeForTable(record, record.type);
      
      // 创建表格服务实例
      const tableService = new TableService(targetConfig);
      
      // 执行同步（带重试机制）
      const result = await this.executeWithRetry(
        () => tableService.createRecord(mappedData),
        options.maxRetries || this.maxRetries,
        options.retryDelay || this.retryDelay,
        platform
      );
      
      // 记录成功指标
      this.recordPerformanceMetric(platform, 'syncSingle', Date.now() - startTime, true);
      this.updateCircuitBreakerSuccess(platform);
      
      this.updateSyncStatus(syncId, 'success', record.id, result);
      return { syncId, status: 'success', result, duration: Date.now() - startTime };
      
    } catch (error) {
      // 记录失败指标
      this.recordPerformanceMetric(platform, 'syncSingle', Date.now() - startTime, false);
      this.recordError(platform, error);
      this.updateCircuitBreakerFailure(platform);
      
      this.updateSyncStatus(syncId, 'failed', record.id, null, error.message);
      throw error;
    }
  }

  /**
   * 带重试机制的执行函数
   * @param {Function} fn - 执行函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} retryDelay - 重试延迟
   * @param {string} platform - 平台名称
   * @returns {Promise} 执行结果
   */
  async executeWithRetry(fn, maxRetries, retryDelay, platform) {
    let lastError;
    const platformConfig = this.platformConfigs[platform] || {};
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // 检查是否为可重试错误
        if (!this.isRetryableError(error, platformConfig.retryableErrors)) {
          throw error;
        }
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt); // 指数退避
          console.log(`同步失败，${delay}ms后进行第${attempt + 1}次重试:`, error.message);
          await this.delay(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 检查是否为可重试错误
   * @param {Error} error - 错误对象
   * @param {Array} retryableErrors - 可重试错误类型
   * @returns {boolean} 是否可重试
   */
  isRetryableError(error, retryableErrors = []) {
    const errorMessage = error.message.toLowerCase();
    const errorCode = error.code;
    
    // 默认可重试错误
    const defaultRetryableErrors = [
      'timeout', 'network', 'rate limit', 'too many requests',
      'service unavailable', 'internal server error', 'bad gateway'
    ];
    
    const allRetryableErrors = [...defaultRetryableErrors, ...retryableErrors];
    
    return allRetryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase()) ||
      errorCode === retryableError
    );
  }

  /**
   * 批量同步（改进版）
   * @param {Array} records - 记录数组
   * @param {Object} targetConfig - 目标配置
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncBatch(records, targetConfig, options = {}) {
    const batchId = this.generateBatchId();
    const strategy = options.strategy || 'balanced';
    const config = this.syncStrategies[strategy] || this.syncStrategies.balanced;
    
    // 应用策略配置
    const batchSize = options.batchSize || config.batchSize;
    const concurrentLimit = options.concurrentLimit || config.concurrentLimit;
    const delay = options.delay || config.delay;
    
    const results = [];
    const totalRecords = records.length;
    let processedCount = 0;
    
    // 注册进度回调
    const progressCallback = options.onProgress;
    if (progressCallback) {
      this.progressCallbacks.set(batchId, progressCallback);
    }
    
    try {
      // 分批处理
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        // 并发处理当前批次
        const batchPromises = [];
        for (let j = 0; j < batch.length; j += concurrentLimit) {
          const concurrentBatch = batch.slice(j, j + concurrentLimit);
          const concurrentPromise = this.processConcurrentBatch(concurrentBatch, targetConfig);
          batchPromises.push(concurrentPromise);
        }
        
        // 等待当前批次完成
        const batchResults = await Promise.allSettled(batchPromises);
        
        // 处理批次结果
        for (const batchResult of batchResults) {
          if (batchResult.status === 'fulfilled') {
            results.push(...batchResult.value);
            processedCount += batchResult.value.length;
          } else {
            console.error('批次处理失败:', batchResult.reason);
            // 为失败的批次创建错误记录
            const errorCount = Math.min(concurrentLimit, batch.length - results.length + processedCount - i);
            for (let k = 0; k < errorCount; k++) {
              results.push({
                recordId: `unknown_${i + k}`,
                status: 'failed',
                error: batchResult.reason.message || '批次处理失败'
              });
            }
            processedCount += errorCount;
          }
        }
        
        // 更新进度
        if (progressCallback) {
          const progress = {
            batchId,
            processed: processedCount,
            total: totalRecords,
            percentage: Math.round((processedCount / totalRecords) * 100),
            currentBatch: Math.floor(i / batchSize) + 1,
            totalBatches: Math.ceil(totalRecords / batchSize)
          };
          progressCallback(progress);
        }
        
        // 批次间延迟
        if (i + batchSize < records.length) {
          await this.delay(delay);
        }
      }
      
      return {
        batchId,
        strategy,
        results,
        summary: this.generateBatchSummary(results),
        timing: {
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0
        }
      };
      
    } finally {
      // 清理进度回调
      this.progressCallbacks.delete(batchId);
    }
  }

  /**
   * 处理并发批次
   * @param {Array} batch - 批次记录
   * @param {Object} targetConfig - 目标配置
   * @returns {Promise<Array>} 批次结果
   */
  async processConcurrentBatch(batch, targetConfig) {
    const promises = batch.map(async (record) => {
      try {
        const result = await this.syncSingle(record, targetConfig);
        return {
          recordId: record.id,
          status: 'success',
          result: result.result,
          syncId: result.syncId
        };
      } catch (error) {
        return {
          recordId: record.id,
          status: 'failed',
          error: error.message
        };
      }
    });
    
    const results = await Promise.allSettled(promises);
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        recordId: 'unknown',
        status: 'failed',
        error: result.reason?.message || '处理失败'
      }
    );
  }

  /**
   * 全选同步（改进版）
   * @param {Object} targetConfig - 目标配置
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncAll(targetConfig, options = {}) {
    try {
      // 获取所有记录
      const allRecords = await this.getAllRecords();
      
      if (allRecords.length === 0) {
        return {
          status: 'completed',
          message: '没有可同步的记录',
          results: [],
          summary: { total: 0, success: 0, failed: 0, successRate: '100%' }
        };
      }
      
      // 根据记录数量选择合适的策略
      if (!options.strategy) {
        if (allRecords.length <= 10) {
          options.strategy = 'conservative';
        } else if (allRecords.length <= 100) {
          options.strategy = 'balanced';
        } else {
          options.strategy = 'aggressive';
        }
      }
      
      console.log(`开始全选同步，共 ${allRecords.length} 条记录，使用策略: ${options.strategy}`);
      
      // 执行批量同步
      const result = await this.syncBatch(allRecords, targetConfig, options);
      
      return {
        ...result,
        type: 'syncAll',
        totalRecords: allRecords.length,
        status: 'completed'
      };
      
    } catch (error) {
      console.error('全选同步失败:', error);
      throw error;
    }
  }

  /**
   * 智能同步 - 根据目标平台优化同步策略
   * @param {Array} records - 记录数组
   * @param {Object} targetConfig - 目标配置
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async smartSync(records, targetConfig, options = {}) {
    const platform = targetConfig.platform;
    
    // 根据平台特性优化同步策略
    const platformOptimizations = {
      'feishu': {
        supportsBatch: true,
        maxBatchSize: 100,
        recommendedConcurrency: 5,
        rateLimit: 1000 // 每分钟请求数
      },
      'dingtalk': {
        supportsBatch: false,
        maxBatchSize: 1,
        recommendedConcurrency: 3,
        rateLimit: 600
      },
      'wework': {
        supportsBatch: true,
        maxBatchSize: 100,
        recommendedConcurrency: 3,
        rateLimit: 500
      }
    };
    
    const optimization = platformOptimizations[platform] || platformOptimizations.dingtalk;
    
    // 应用平台优化
    const optimizedOptions = {
      ...options,
      batchSize: Math.min(options.batchSize || 10, optimization.maxBatchSize),
      concurrentLimit: Math.min(options.concurrentLimit || 3, optimization.recommendedConcurrency),
      delay: options.delay || Math.max(100, 60000 / optimization.rateLimit)
    };
    
    console.log(`智能同步 - 平台: ${platform}, 优化配置:`, optimizedOptions);
    
    // 如果平台支持真正的批量操作，使用适配器的批量方法
    if (optimization.supportsBatch && records.length > 10) {
      return await this.syncWithAdapterBatch(records, targetConfig, optimizedOptions);
    } else {
      return await this.syncBatch(records, targetConfig, optimizedOptions);
    }
  }

  /**
   * 使用适配器批量方法同步
   * @param {Array} records - 记录数组
   * @param {Object} targetConfig - 目标配置
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncWithAdapterBatch(records, targetConfig, options = {}) {
    const batchId = this.generateBatchId();
    const batchSize = options.batchSize || 50;
    const results = [];
    
    try {
      // 创建表格服务实例
      const tableService = new TableService(targetConfig);
      
      // 分批处理
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        // 数据映射
        const mappedData = batch.map(record => 
          DataMapper.serializeForTable(record, record.type)
        );
        
        try {
          // 使用适配器的批量创建方法
          const batchResults = await tableService.batchCreateRecords(mappedData);
          
          // 处理批量结果
          batchResults.forEach((result, index) => {
            results.push({
              recordId: batch[index].id,
              status: result.error ? 'failed' : 'success',
              result: result.error ? null : result,
              error: result.error || null,
              syncId: this.generateSyncId()
            });
          });
          
        } catch (error) {
          // 批量失败时，为整个批次创建失败记录
          batch.forEach(record => {
            results.push({
              recordId: record.id,
              status: 'failed',
              error: error.message,
              syncId: this.generateSyncId()
            });
          });
        }
        
        // 更新进度
        const progressCallback = this.progressCallbacks.get(batchId);
        if (progressCallback) {
          const progress = {
            batchId,
            processed: Math.min(i + batchSize, records.length),
            total: records.length,
            percentage: Math.round((Math.min(i + batchSize, records.length) / records.length) * 100)
          };
          progressCallback(progress);
        }
        
        // 批次间延迟
        if (i + batchSize < records.length) {
          await this.delay(options.delay || 200);
        }
      }
      
      return {
        batchId,
        type: 'adapterBatch',
        results,
        summary: this.generateBatchSummary(results)
      };
      
    } catch (error) {
      console.error('适配器批量同步失败:', error);
      throw error;
    }
  }

  /**
   * 重试同步
   * @param {string} syncId - 同步ID
   * @param {Object} targetConfig - 目标配置
   * @returns {Promise<Object>} 重试结果
   */
  async retrySynce(syncId, targetConfig) {
    const syncInfo = this.syncStatus.get(syncId);
    
    if (!syncInfo || syncInfo.status !== 'failed') {
      throw new Error('无效的同步ID或同步状态');
    }
    
    if (syncInfo.retryCount >= this.maxRetries) {
      throw new Error('已达到最大重试次数');
    }
    
    try {
      // 获取原始记录
      const record = await this.getRecordById(syncInfo.recordId);
      
      // 增加重试次数
      syncInfo.retryCount = (syncInfo.retryCount || 0) + 1;
      
      // 添加重试延迟
      await this.delay(this.retryDelay * syncInfo.retryCount);
      
      // 重新执行同步
      return await this.syncSingle(record, targetConfig);
      
    } catch (error) {
      console.error('重试同步失败:', error);
      throw error;
    }
  }

  /**
   * 获取同步状态
   * @param {string} syncId - 同步ID
   * @returns {Object} 同步状态信息
   */
  getSyncStatus(syncId) {
    return this.syncStatus.get(syncId) || null;
  }

  /**
   * 获取所有同步状态
   * @returns {Array} 所有同步状态
   */
  getAllSyncStatus() {
    return Array.from(this.syncStatus.values());
  }

  /**
   * 清理同步状态
   * @param {number} olderThanDays - 清理多少天前的状态
   */
  cleanupSyncStatus(olderThanDays = 7) {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    for (const [syncId, status] of this.syncStatus.entries()) {
      if (status.timestamp < cutoffTime) {
        this.syncStatus.delete(syncId);
      }
    }
  }

  // 私有方法
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateSyncStatus(syncId, status, recordId, result = null, error = null) {
    this.syncStatus.set(syncId, {
      syncId,
      status,
      recordId,
      result,
      error,
      timestamp: Date.now()
    });
  }

  generateBatchSummary(results) {
    const total = results.length;
    const success = results.filter(r => r.status === 'success').length;
    const failed = total - success;
    
    return {
      total,
      success,
      failed,
      successRate: total > 0 ? (success / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 记录性能指标
   * @param {string} platform - 平台名称
   * @param {string} operation - 操作类型
   * @param {number} duration - 耗时（毫秒）
   * @param {boolean} success - 是否成功
   */
  recordPerformanceMetric(platform, operation, duration, success) {
    const key = `${platform}_${operation}`;
    
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, {
        totalRequests: 0,
        successRequests: 0,
        failedRequests: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastUpdated: Date.now()
      });
    }
    
    const metrics = this.performanceMetrics.get(key);
    metrics.totalRequests++;
    
    if (success) {
      metrics.successRequests++;
    } else {
      metrics.failedRequests++;
    }
    
    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.totalRequests;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.lastUpdated = Date.now();
  }

  /**
   * 记录错误统计
   * @param {string} platform - 平台名称
   * @param {Error} error - 错误对象
   */
  recordError(platform, error) {
    if (!this.errorStats.has(platform)) {
      this.errorStats.set(platform, {
        totalErrors: 0,
        errorTypes: new Map(),
        recentErrors: [],
        lastErrorTime: null
      });
    }
    
    const stats = this.errorStats.get(platform);
    stats.totalErrors++;
    stats.lastErrorTime = Date.now();
    
    // 统计错误类型
    const errorType = error.name || 'UnknownError';
    const errorCount = stats.errorTypes.get(errorType) || 0;
    stats.errorTypes.set(errorType, errorCount + 1);
    
    // 保留最近的错误（最多10个）
    stats.recentErrors.unshift({
      message: error.message,
      type: errorType,
      timestamp: Date.now()
    });
    
    if (stats.recentErrors.length > 10) {
      stats.recentErrors = stats.recentErrors.slice(0, 10);
    }
  }

  /**
   * 检查熔断器是否开启
   * @param {string} platform - 平台名称
   * @returns {boolean} 是否开启
   */
  isCircuitBreakerOpen(platform) {
    const breaker = this.circuitBreakers.get(platform);
    if (!breaker) return false;
    
    // 如果熔断器开启且还在冷却期内
    if (breaker.state === 'open' && Date.now() < breaker.nextAttempt) {
      return true;
    }
    
    // 如果冷却期结束，切换到半开状态
    if (breaker.state === 'open' && Date.now() >= breaker.nextAttempt) {
      breaker.state = 'half-open';
      breaker.consecutiveFailures = 0;
    }
    
    return false;
  }

  /**
   * 更新熔断器成功状态
   * @param {string} platform - 平台名称
   */
  updateCircuitBreakerSuccess(platform) {
    if (!this.circuitBreakers.has(platform)) {
      this.circuitBreakers.set(platform, {
        state: 'closed',
        consecutiveFailures: 0,
        lastFailureTime: null,
        nextAttempt: null,
        failureThreshold: 5,
        timeout: 60000 // 1分钟
      });
    }
    
    const breaker = this.circuitBreakers.get(platform);
    breaker.consecutiveFailures = 0;
    
    // 如果是半开状态，成功后关闭熔断器
    if (breaker.state === 'half-open') {
      breaker.state = 'closed';
    }
  }

  /**
   * 更新熔断器失败状态
   * @param {string} platform - 平台名称
   */
  updateCircuitBreakerFailure(platform) {
    if (!this.circuitBreakers.has(platform)) {
      this.circuitBreakers.set(platform, {
        state: 'closed',
        consecutiveFailures: 0,
        lastFailureTime: null,
        nextAttempt: null,
        failureThreshold: 5,
        timeout: 60000 // 1分钟
      });
    }
    
    const breaker = this.circuitBreakers.get(platform);
    breaker.consecutiveFailures++;
    breaker.lastFailureTime = Date.now();
    
    // 如果连续失败次数达到阈值，开启熔断器
    if (breaker.consecutiveFailures >= breaker.failureThreshold) {
      breaker.state = 'open';
      breaker.nextAttempt = Date.now() + breaker.timeout;
      console.warn(`平台 ${platform} 熔断器已开启，${breaker.timeout}ms后重试`);
    }
  }

  /**
   * 获取性能指标
   * @param {string} platform - 平台名称（可选）
   * @returns {Object} 性能指标
   */
  getPerformanceMetrics(platform = null) {
    if (platform) {
      const result = {};
      for (const [key, metrics] of this.performanceMetrics) {
        if (key.startsWith(platform)) {
          result[key] = metrics;
        }
      }
      return result;
    }
    
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * 获取错误统计
   * @param {string} platform - 平台名称（可选）
   * @returns {Object} 错误统计
   */
  getErrorStats(platform = null) {
    if (platform) {
      return this.errorStats.get(platform) || null;
    }
    
    return Object.fromEntries(this.errorStats);
  }

  /**
   * 获取熔断器状态
   * @param {string} platform - 平台名称（可选）
   * @returns {Object} 熔断器状态
   */
  getCircuitBreakerStatus(platform = null) {
    if (platform) {
      return this.circuitBreakers.get(platform) || null;
    }
    
    return Object.fromEntries(this.circuitBreakers);
  }

  /**
   * 重置熔断器
   * @param {string} platform - 平台名称
   */
  resetCircuitBreaker(platform) {
    if (this.circuitBreakers.has(platform)) {
      const breaker = this.circuitBreakers.get(platform);
      breaker.state = 'closed';
      breaker.consecutiveFailures = 0;
      breaker.lastFailureTime = null;
      breaker.nextAttempt = null;
    }
  }

  /**
   * 清理过期数据
   * @param {number} olderThanHours - 清理多少小时前的数据
   */
  cleanupOldData(olderThanHours = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    // 清理同步状态
    for (const [syncId, status] of this.syncStatus.entries()) {
      if (status.timestamp < cutoffTime) {
        this.syncStatus.delete(syncId);
      }
    }
    
    // 清理性能指标
    for (const [key, metrics] of this.performanceMetrics.entries()) {
      if (metrics.lastUpdated < cutoffTime) {
        this.performanceMetrics.delete(key);
      }
    }
    
    // 清理错误统计中的旧错误
    for (const [platform, stats] of this.errorStats.entries()) {
      stats.recentErrors = stats.recentErrors.filter(
        error => error.timestamp > cutoffTime
      );
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAllRecords() {
    // 从存储服务获取所有记录
    return await StorageService.getAllRewriteRecords();
  }

  async getRecordById(recordId) {
    // 从存储服务获取指定记录
    return await StorageService.getRewriteRecord(recordId);
  }
}

// 导出服务类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncService;
} else {
  window.SyncService = SyncService;
}