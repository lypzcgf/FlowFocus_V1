/**
 * 工具函数集合
 * 包含各种实用的工具函数
 */

import { REGEX_PATTERNS, VALIDATION_RULES } from './constants.js';

/**
 * 字符串工具函数
 */
export const StringUtils = {
  /**
   * 生成唯一ID
   * @param {string} prefix - 前缀
   * @returns {string} 唯一ID
   */
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * 截断文本
   * @param {string} text - 原始文本
   * @param {number} maxLength - 最大长度
   * @param {string} suffix - 后缀
   * @returns {string} 截断后的文本
   */
  truncate(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * 计算文本字数
   * @param {string} text - 文本
   * @returns {number} 字数
   */
  countWords(text) {
    if (!text) return 0;
    const chineseChars = (text.match(REGEX_PATTERNS.CHINESE) || []).length;
    const englishWords = (text.match(REGEX_PATTERNS.ENGLISH_WORDS) || []).length;
    return chineseChars + englishWords;
  },

  /**
   * 清理文本
   * @param {string} text - 原始文本
   * @returns {string} 清理后的文本
   */
  cleanText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  },

  /**
   * 转换为驼峰命名
   * @param {string} str - 原始字符串
   * @returns {string} 驼峰命名字符串
   */
  toCamelCase(str) {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  },

  /**
   * 转换为短横线命名
   * @param {string} str - 原始字符串
   * @returns {string} 短横线命名字符串
   */
  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  },

  /**
   * 高亮关键词
   * @param {string} text - 原始文本
   * @param {string} keyword - 关键词
   * @param {string} className - CSS类名
   * @returns {string} 高亮后的HTML
   */
  highlight(text, keyword, className = 'highlight') {
    if (!text || !keyword) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, `<span class="${className}">$1</span>`);
  }
};

/**
 * 日期时间工具函数
 */
export const DateUtils = {
  /**
   * 格式化日期
   * @param {Date|string} date - 日期
   * @param {string} format - 格式
   * @returns {string} 格式化后的日期
   */
  format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  /**
   * 获取相对时间
   * @param {Date|string} date - 日期
   * @returns {string} 相对时间描述
   */
  getRelativeTime(date) {
    const now = new Date();
    const target = new Date(date);
    const diff = now - target;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return this.format(date, 'YYYY-MM-DD');
  },

  /**
   * 计算持续时间
   * @param {Date|string} startTime - 开始时间
   * @param {Date|string} endTime - 结束时间
   * @returns {string} 持续时间描述
   */
  getDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end - start;
    
    if (diff < 0) return '0秒';
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  },

  /**
   * 检查是否为今天
   * @param {Date|string} date - 日期
   * @returns {boolean} 是否为今天
   */
  isToday(date) {
    const today = new Date();
    const target = new Date(date);
    return today.toDateString() === target.toDateString();
  }
};

/**
 * 数据验证工具函数
 */
export const ValidationUtils = {
  /**
   * 验证邮箱
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  isValidEmail(email) {
    return REGEX_PATTERNS.EMAIL.test(email);
  },

  /**
   * 验证URL
   * @param {string} url - URL地址
   * @returns {boolean} 是否有效
   */
  isValidUrl(url) {
    return REGEX_PATTERNS.URL.test(url);
  },

  /**
   * 验证文本长度
   * @param {string} text - 文本
   * @param {number} minLength - 最小长度
   * @param {number} maxLength - 最大长度
   * @returns {Object} 验证结果
   */
  validateTextLength(text, minLength = VALIDATION_RULES.MIN_TEXT_LENGTH, maxLength = VALIDATION_RULES.MAX_TEXT_LENGTH) {
    const length = text ? text.length : 0;
    return {
      isValid: length >= minLength && length <= maxLength,
      length,
      minLength,
      maxLength,
      message: length < minLength ? `文本长度不能少于${minLength}个字符` : 
               length > maxLength ? `文本长度不能超过${maxLength}个字符` : ''
    };
  },

  /**
   * 验证数值范围
   * @param {number} value - 数值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {Object} 验证结果
   */
  validateNumberRange(value, min, max) {
    const num = Number(value);
    return {
      isValid: !isNaN(num) && num >= min && num <= max,
      value: num,
      min,
      max,
      message: isNaN(num) ? '请输入有效数字' :
               num < min ? `数值不能小于${min}` :
               num > max ? `数值不能大于${max}` : ''
    };
  },

  /**
   * 验证必填字段
   * @param {Object} data - 数据对象
   * @param {Array} requiredFields - 必填字段列表
   * @returns {Object} 验证结果
   */
  validateRequiredFields(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`${field}不能为空`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * 数组工具函数
 */
export const ArrayUtils = {
  /**
   * 数组去重
   * @param {Array} array - 原数组
   * @param {string} key - 去重键名（对象数组）
   * @returns {Array} 去重后的数组
   */
  unique(array, key = null) {
    if (!Array.isArray(array)) return [];
    
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
          return false;
        }
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(array)];
  },

  /**
   * 数组分组
   * @param {Array} array - 原数组
   * @param {string|Function} key - 分组键名或函数
   * @returns {Object} 分组后的对象
   */
  groupBy(array, key) {
    if (!Array.isArray(array)) return {};
    
    return array.reduce((groups, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  },

  /**
   * 数组分页
   * @param {Array} array - 原数组
   * @param {number} page - 页码（从1开始）
   * @param {number} pageSize - 每页大小
   * @returns {Object} 分页结果
   */
  paginate(array, page = 1, pageSize = 20) {
    if (!Array.isArray(array)) return { items: [], total: 0, page: 1, pageSize, totalPages: 0 };
    
    const total = array.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = array.slice(startIndex, endIndex);
    
    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  },

  /**
   * 数组排序
   * @param {Array} array - 原数组
   * @param {string} key - 排序键名
   * @param {string} order - 排序方向（asc/desc）
   * @returns {Array} 排序后的数组
   */
  sortBy(array, key, order = 'asc') {
    if (!Array.isArray(array)) return [];
    
    return [...array].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
};

/**
 * 对象工具函数
 */
export const ObjectUtils = {
  /**
   * 深拷贝
   * @param {any} obj - 原对象
   * @returns {any} 拷贝后的对象
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }
  },

  /**
   * 对象合并
   * @param {Object} target - 目标对象
   * @param {...Object} sources - 源对象
   * @returns {Object} 合并后的对象
   */
  merge(target, ...sources) {
    if (!target) target = {};
    
    sources.forEach(source => {
      if (source) {
        Object.keys(source).forEach(key => {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            target[key] = this.merge(target[key] || {}, source[key]);
          } else {
            target[key] = source[key];
          }
        });
      }
    });
    
    return target;
  },

  /**
   * 获取嵌套属性值
   * @param {Object} obj - 对象
   * @param {string} path - 属性路径
   * @param {any} defaultValue - 默认值
   * @returns {any} 属性值
   */
  get(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || !result.hasOwnProperty(key)) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result;
  },

  /**
   * 设置嵌套属性值
   * @param {Object} obj - 对象
   * @param {string} path - 属性路径
   * @param {any} value - 属性值
   */
  set(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  },

  /**
   * 检查对象是否为空
   * @param {Object} obj - 对象
   * @returns {boolean} 是否为空
   */
  isEmpty(obj) {
    if (!obj) return true;
    return Object.keys(obj).length === 0;
  }
};

/**
 * 文件工具函数
 */
export const FileUtils = {
  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 获取文件扩展名
   * @param {string} filename - 文件名
   * @returns {string} 扩展名
   */
  getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  /**
   * 下载文件
   * @param {string} content - 文件内容
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME类型
   */
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  },

  /**
   * 读取文件内容
   * @param {File} file - 文件对象
   * @returns {Promise<string>} 文件内容
   */
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsText(file);
    });
  }
};

/**
 * 性能工具函数
 */
export const PerformanceUtils = {
  /**
   * 防抖函数
   * @param {Function} func - 原函数
   * @param {number} delay - 延迟时间
   * @returns {Function} 防抖后的函数
   */
  debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  /**
   * 节流函数
   * @param {Function} func - 原函数
   * @param {number} delay - 延迟时间
   * @returns {Function} 节流后的函数
   */
  throttle(func, delay = 300) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  },

  /**
   * 延迟执行
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} Promise对象
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 测量执行时间
   * @param {Function} func - 要测量的函数
   * @returns {Object} 执行结果和时间
   */
  async measureTime(func) {
    const startTime = performance.now();
    const result = await func();
    const endTime = performance.now();
    
    return {
      result,
      duration: endTime - startTime
    };
  }
};

// 导出所有工具函数
export default {
  StringUtils,
  DateUtils,
  ValidationUtils,
  ArrayUtils,
  ObjectUtils,
  FileUtils,
  PerformanceUtils
};

// 兼容CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    StringUtils,
    DateUtils,
    ValidationUtils,
    ArrayUtils,
    ObjectUtils,
    FileUtils,
    PerformanceUtils
  };
}