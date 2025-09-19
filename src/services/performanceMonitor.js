/**
 * 性能监控服务
 * 提供应用性能监控、日志记录和分析功能
 */

import { EVENT_TYPES, ERROR_CODES } from '../utils/constants.js';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.logs = [];
    this.maxLogSize = 1000; // 最大日志条数
    this.isEnabled = true;
    this.startTime = Date.now();
    this.sessionId = this.generateSessionId();
    
    // 性能阈值配置
    this.thresholds = {
      apiResponse: 5000, // API响应时间阈值（毫秒）
      syncOperation: 10000, // 同步操作时间阈值
      memoryUsage: 100 * 1024 * 1024, // 内存使用阈值（100MB）
      errorRate: 0.1 // 错误率阈值（10%）
    };
    
    // 监控间隔
    this.monitoringInterval = null;
    this.metricsCollectionInterval = 30000; // 30秒收集一次指标
    
    this.initializeMonitoring();
  }

  /**
   * 初始化监控
   */
  initializeMonitoring() {
    if (this.isEnabled) {
      this.startPeriodicCollection();
      this.setupErrorHandling();
      this.log('info', 'PerformanceMonitor', '性能监控已启动', { sessionId: this.sessionId });
    }
  }

  /**
   * 开始性能计时
   * @param {string} operation - 操作名称
   * @param {Object} metadata - 元数据
   * @returns {string} 计时器ID
   */
  startTiming(operation, metadata = {}) {
    const timerId = this.generateTimerId();
    const startTime = performance.now();
    
    this.metrics.set(timerId, {
      operation,
      startTime,
      metadata,
      status: 'running'
    });
    
    return timerId;
  }

  /**
   * 结束性能计时
   * @param {string} timerId - 计时器ID
   * @param {boolean} success - 是否成功
   * @param {Object} result - 结果数据
   * @returns {Object} 性能指标
   */
  endTiming(timerId, success = true, result = {}) {
    const metric = this.metrics.get(timerId);
    if (!metric) {
      this.log('warn', 'PerformanceMonitor', '无效的计时器ID', { timerId });
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    const performanceData = {
      ...metric,
      endTime,
      duration,
      success,
      result,
      status: 'completed'
    };
    
    // 更新指标
    this.updateOperationMetrics(metric.operation, duration, success);
    
    // 检查性能阈值
    this.checkPerformanceThresholds(metric.operation, duration);
    
    // 记录日志
    this.log(
      success ? 'info' : 'error',
      'Performance',
      `${metric.operation} ${success ? '完成' : '失败'}`,
      {
        duration: `${duration.toFixed(2)}ms`,
        success,
        ...metric.metadata,
        ...result
      }
    );
    
    // 清理计时器
    this.metrics.delete(timerId);
    
    return performanceData;
  }

  /**
   * 记录日志
   * @param {string} level - 日志级别
   * @param {string} category - 分类
   * @param {string} message - 消息
   * @param {Object} data - 附加数据
   */
  log(level, category, message, data = {}) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      sessionId: this.sessionId,
      url: window.location?.href || 'unknown'
    };
    
    this.logs.unshift(logEntry);
    
    // 限制日志大小
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(0, this.maxLogSize);
    }
    
    // 输出到控制台
    this.outputToConsole(logEntry);
    
    // 触发日志事件
    this.dispatchLogEvent(logEntry);
  }

  /**
   * 记录API调用性能
   * @param {string} apiName - API名称
   * @param {string} method - HTTP方法
   * @param {string} url - 请求URL
   * @param {number} duration - 耗时
   * @param {boolean} success - 是否成功
   * @param {Object} details - 详细信息
   */
  recordApiCall(apiName, method, url, duration, success, details = {}) {
    this.log(
      success ? 'info' : 'error',
      'API',
      `${method} ${apiName} ${success ? '成功' : '失败'}`,
      {
        url,
        duration: `${duration}ms`,
        success,
        ...details
      }
    );
    
    this.updateOperationMetrics(`api_${apiName}`, duration, success);
  }

  /**
   * 记录用户操作
   * @param {string} action - 操作类型
   * @param {string} target - 操作目标
   * @param {Object} details - 详细信息
   */
  recordUserAction(action, target, details = {}) {
    this.log('info', 'UserAction', `${action} ${target}`, {
      action,
      target,
      timestamp: Date.now(),
      ...details
    });
  }

  /**
   * 记录错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @param {Object} additionalData - 附加数据
   */
  recordError(error, context, additionalData = {}) {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      ...additionalData
    };
    
    this.log('error', 'Error', `${context}: ${error.message}`, errorData);
    
    // 更新错误统计
    this.updateErrorMetrics(context, error);
  }

  /**
   * 获取性能报告
   * @param {string} timeRange - 时间范围（'1h', '24h', '7d'）
   * @returns {Object} 性能报告
   */
  getPerformanceReport(timeRange = '1h') {
    const timeRangeMs = this.parseTimeRange(timeRange);
    const cutoffTime = Date.now() - timeRangeMs;
    
    // 过滤指定时间范围内的日志
    const filteredLogs = this.logs.filter(log => log.timestamp >= cutoffTime);
    
    // 统计各类指标
    const report = {
      timeRange,
      sessionId: this.sessionId,
      generatedAt: Date.now(),
      summary: {
        totalLogs: filteredLogs.length,
        errorCount: filteredLogs.filter(log => log.level === 'error').length,
        warningCount: filteredLogs.filter(log => log.level === 'warn').length,
        infoCount: filteredLogs.filter(log => log.level === 'info').length
      },
      performance: this.getPerformanceStats(filteredLogs),
      errors: this.getErrorStats(filteredLogs),
      userActions: this.getUserActionStats(filteredLogs),
      apiCalls: this.getApiCallStats(filteredLogs)
    };
    
    return report;
  }

  /**
   * 获取实时指标
   * @returns {Object} 实时指标
   */
  getRealTimeMetrics() {
    return {
      sessionId: this.sessionId,
      uptime: Date.now() - this.startTime,
      activeTimers: this.metrics.size,
      totalLogs: this.logs.length,
      memoryUsage: this.getMemoryUsage(),
      performanceMetrics: this.getAggregatedMetrics(),
      systemHealth: this.getSystemHealth()
    };
  }

  /**
   * 导出日志
   * @param {string} format - 导出格式（'json', 'csv'）
   * @param {string} timeRange - 时间范围
   * @returns {string} 导出数据
   */
  exportLogs(format = 'json', timeRange = '24h') {
    const timeRangeMs = this.parseTimeRange(timeRange);
    const cutoffTime = Date.now() - timeRangeMs;
    const filteredLogs = this.logs.filter(log => log.timestamp >= cutoffTime);
    
    if (format === 'csv') {
      return this.convertToCSV(filteredLogs);
    }
    
    return JSON.stringify(filteredLogs, null, 2);
  }

  /**
   * 清理旧日志
   * @param {string} olderThan - 清理时间范围
   */
  cleanupLogs(olderThan = '7d') {
    const timeRangeMs = this.parseTimeRange(olderThan);
    const cutoffTime = Date.now() - timeRangeMs;
    
    const originalLength = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffTime);
    
    const cleanedCount = originalLength - this.logs.length;
    if (cleanedCount > 0) {
      this.log('info', 'PerformanceMonitor', `清理了 ${cleanedCount} 条旧日志`);
    }
  }

  /**
   * 启用/禁用监控
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.startPeriodicCollection();
      this.log('info', 'PerformanceMonitor', '性能监控已启用');
    } else {
      this.stopPeriodicCollection();
      this.log('info', 'PerformanceMonitor', '性能监控已禁用');
    }
  }

  // 私有方法
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTimerId() {
    return `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateOperationMetrics(operation, duration, success) {
    // 这里可以实现更复杂的指标聚合逻辑
    // 暂时简化处理
  }

  checkPerformanceThresholds(operation, duration) {
    const threshold = this.thresholds.apiResponse;
    if (duration > threshold) {
      this.log('warn', 'Performance', `${operation} 响应时间超过阈值`, {
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${threshold}ms`
      });
    }
  }

  updateErrorMetrics(context, error) {
    // 实现错误指标更新逻辑
  }

  outputToConsole(logEntry) {
    const { level, category, message, data } = logEntry;
    const prefix = `[${new Date(logEntry.timestamp).toISOString()}] [${category}]`;
    
    switch (level) {
      case 'error':
        console.error(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'info':
      default:
        console.log(prefix, message, data);
        break;
    }
  }

  dispatchLogEvent(logEntry) {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new CustomEvent('performanceLog', {
        detail: logEntry
      });
      window.dispatchEvent(event);
    }
  }

  startPeriodicCollection() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.metricsCollectionInterval);
  }

  stopPeriodicCollection() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  collectSystemMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memoryUsage: this.getMemoryUsage(),
      activeTimers: this.metrics.size,
      logCount: this.logs.length
    };
    
    this.log('debug', 'SystemMetrics', '系统指标收集', metrics);
  }

  setupErrorHandling() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.recordError(event.error, 'GlobalError', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        this.recordError(new Error(event.reason), 'UnhandledPromiseRejection');
      });
    }
  }

  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  getAggregatedMetrics() {
    // 实现聚合指标计算
    return {};
  }

  getSystemHealth() {
    const memoryUsage = this.getMemoryUsage();
    const errorRate = this.calculateErrorRate();
    
    return {
      status: 'healthy', // 'healthy', 'warning', 'critical'
      memoryHealth: memoryUsage ? (memoryUsage.used / memoryUsage.limit < 0.8 ? 'good' : 'warning') : 'unknown',
      errorRate,
      uptime: Date.now() - this.startTime
    };
  }

  calculateErrorRate() {
    const recentLogs = this.logs.filter(log => log.timestamp > Date.now() - 300000); // 5分钟内
    const errorCount = recentLogs.filter(log => log.level === 'error').length;
    return recentLogs.length > 0 ? errorCount / recentLogs.length : 0;
  }

  parseTimeRange(timeRange) {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    const match = timeRange.match(/^(\d+)([mhd])$/);
    if (match) {
      const [, value, unit] = match;
      return parseInt(value) * units[unit];
    }
    
    return 60 * 60 * 1000; // 默认1小时
  }

  getPerformanceStats(logs) {
    // 实现性能统计计算
    return {};
  }

  getErrorStats(logs) {
    // 实现错误统计计算
    return {};
  }

  getUserActionStats(logs) {
    // 实现用户操作统计计算
    return {};
  }

  getApiCallStats(logs) {
    // 实现API调用统计计算
    return {};
  }

  convertToCSV(logs) {
    if (logs.length === 0) return '';
    
    const headers = ['timestamp', 'level', 'category', 'message', 'data'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = [
        new Date(log.timestamp).toISOString(),
        log.level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.data).replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceMonitor, performanceMonitor };
} else {
  window.PerformanceMonitor = PerformanceMonitor;
  window.performanceMonitor = performanceMonitor;
}

export { PerformanceMonitor, performanceMonitor };
export default performanceMonitor;