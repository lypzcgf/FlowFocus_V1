/**
 * 应用常量定义
 * 包含应用中使用的各种常量
 */

// 应用信息
export const APP_INFO = {
  NAME: 'FlowFocus',
  VERSION: '2.0.0',
  DESCRIPTION: '多维表格和大模型配置管理插件',
  AUTHOR: 'FlowFocus Team'
};

// 支持的大模型类型
export const MODEL_TYPES = {
  QWEN: 'qwen',
  DEEPSEEK: 'deepseek',
  VOLCES: 'volces',
  KIMI: 'kimi',
  HUNYUAN: 'hunyuan'
};

// 大模型配置
export const MODEL_CONFIGS = {
  [MODEL_TYPES.QWEN]: {
    name: 'Qwen模型',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
    maxTokens: 2000,
    temperature: 0.7
  },
  [MODEL_TYPES.DEEPSEEK]: {
    name: 'DeepSeek模型',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    maxTokens: 2000,
    temperature: 0.7
  },
  [MODEL_TYPES.VOLCES]: {
    name: 'Volces模型',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: '',
    maxTokens: 2000,
    temperature: 0.7
  },
  [MODEL_TYPES.KIMI]: {
    name: 'Kimi模型',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    maxTokens: 2000,
    temperature: 0.7
  },
  [MODEL_TYPES.HUNYUAN]: {
    name: 'Hunyuan模型',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    defaultModel: 'hunyuan-turbos-latest',
    maxTokens: 2000,
    temperature: 0.7
  }
};

// 支持的多维表格平台
export const TABLE_PLATFORMS = {
  FEISHU: 'feishu',
  DINGTALK: 'dingtalk',
  WEWORK: 'wework'
};

// 多维表格平台配置
export const PLATFORM_CONFIGS = {
  [TABLE_PLATFORMS.FEISHU]: {
    name: '飞书多维表格',
    baseUrl: 'https://open.feishu.cn/open-apis/bitable/v1',
    authUrl: 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    requiredFields: ['appId', 'appSecret', 'tableToken'],
    optionalFields: ['tableId', 'baseUrl']
  },
  [TABLE_PLATFORMS.DINGTALK]: {
    name: '钉钉智能表格',
    baseUrl: 'https://oapi.dingtalk.com',
    authUrl: 'https://oapi.dingtalk.com/gettoken',
    requiredFields: ['appKey', 'appSecret', 'workbookId', 'sheetId'],
    optionalFields: ['baseUrl']
  },
  [TABLE_PLATFORMS.WEWORK]: {
    name: '企业微信智能表格',
    baseUrl: 'https://qyapi.weixin.qq.com',
    authUrl: 'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
    requiredFields: ['corpId', 'corpSecret', 'agentId', 'docId', 'sheetId'],
    optionalFields: ['baseUrl']
  }
};

// 同步状态
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed'
};

// 同步类型
export const SYNC_TYPES = {
  SINGLE: 'single',
  BATCH: 'batch',
  FULL: 'full'
};

// 数据类型
export const DATA_TYPES = {
  MODEL_CONFIG: 'modelConfig',
  REWRITE_RECORD: 'rewriteRecord',
  TABLE_CONFIG: 'tableConfig',
  SYNC_RECORD: 'syncRecord',
  OPERATION_LOG: 'operationLog'
};

// 操作类型
export const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  SYNC: 'sync',
  IMPORT: 'import',
  EXPORT: 'export'
};

// 记录类别
export const RECORD_CATEGORIES = {
  GENERAL: '通用',
  BUSINESS: '商务',
  ACADEMIC: '学术',
  CREATIVE: '创意',
  TECHNICAL: '技术',
  MARKETING: '营销',
  LEGAL: '法律',
  MEDICAL: '医疗'
};

// 质量评级
export const QUALITY_RATINGS = {
  POOR: 1,
  FAIR: 2,
  GOOD: 3,
  VERY_GOOD: 4,
  EXCELLENT: 5
};

// 存储键名
export const STORAGE_KEYS = {
  MODEL_CONFIGS: 'flowfocus_model_configs',
  TABLE_CONFIGS: 'flowfocus_table_configs',
  REWRITE_RECORDS: 'flowfocus_rewrite_records',
  SYNC_RECORDS: 'flowfocus_sync_records',
  OPERATION_LOGS: 'flowfocus_operation_logs',
  APP_CONFIG: 'flowfocus_app_config',
  USER_PREFERENCES: 'flowfocus_user_preferences'
};

// 事件类型
export const EVENT_TYPES = {
  MODEL_CONFIG_CHANGED: 'modelConfigChanged',
  TABLE_CONFIG_CHANGED: 'tableConfigChanged',
  RECORD_CREATED: 'recordCreated',
  RECORD_UPDATED: 'recordUpdated',
  RECORD_DELETED: 'recordDeleted',
  SYNC_STARTED: 'syncStarted',
  SYNC_COMPLETED: 'syncCompleted',
  SYNC_FAILED: 'syncFailed'
};

// 错误代码
export const ERROR_CODES = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  DATA_ERROR: 'DATA_ERROR',
  SYNC_ERROR: 'SYNC_ERROR'
};

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// 默认配置
export const DEFAULT_CONFIG = {
  REQUEST_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BATCH_SIZE: 50,
  MAX_CONCURRENT_REQUESTS: 5,
  CACHE_EXPIRY: 300000, // 5分钟
  MAX_CACHE_SIZE: 100,
  AUTO_SAVE_INTERVAL: 30000, // 30秒
  SYNC_INTERVAL: 300000, // 5分钟
  LOG_RETENTION_DAYS: 30
};

// UI常量
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 400,
  POPUP_WIDTH: 350,
  POPUP_HEIGHT: 500,
  MAX_TEXT_LENGTH: 10000,
  ITEMS_PER_PAGE: 20,
  ANIMATION_DURATION: 300
};

// 主题配置
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// 语言配置
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
  JA_JP: 'ja-JP'
};

// 文件类型
export const FILE_TYPES = {
  JSON: 'json',
  CSV: 'csv',
  XLSX: 'xlsx',
  TXT: 'txt'
};

// 导出格式
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  EXCEL: 'xlsx',
  TEXT: 'txt'
};

// 正则表达式
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  CHINESE: /[\u4e00-\u9fa5]/g,
  ENGLISH_WORDS: /[a-zA-Z]+/g,
  NUMBERS: /\d+/g,
  SPECIAL_CHARS: /[!@#$%^&*(),.?":{}|<>]/g
};

// 验证规则
export const VALIDATION_RULES = {
  MIN_TEXT_LENGTH: 1,
  MAX_TEXT_LENGTH: 10000,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_TEMPERATURE: 0,
  MAX_TEMPERATURE: 2,
  MIN_MAX_TOKENS: 1,
  MAX_MAX_TOKENS: 8000,
  MIN_QUALITY_RATING: 0,
  MAX_QUALITY_RATING: 5
};

// 性能监控
export const PERFORMANCE_METRICS = {
  API_RESPONSE_TIME: 'api_response_time',
  SYNC_DURATION: 'sync_duration',
  UI_RENDER_TIME: 'ui_render_time',
  MEMORY_USAGE: 'memory_usage',
  ERROR_RATE: 'error_rate'
};

// 功能开关
export const FEATURE_FLAGS = {
  MULTI_TABLE_SYNC: 'multiTableSync',
  BATCH_OPERATIONS: 'batchOperations',
  AUTO_BACKUP: 'autoBackup',
  ADVANCED_FILTERS: 'advancedFilters',
  PERFORMANCE_MONITORING: 'performanceMonitoring',
  DEBUG_MODE: 'debugMode'
};

// 导出所有常量
export default {
  APP_INFO,
  MODEL_TYPES,
  MODEL_CONFIGS,
  TABLE_PLATFORMS,
  PLATFORM_CONFIGS,
  SYNC_STATUS,
  SYNC_TYPES,
  DATA_TYPES,
  OPERATION_TYPES,
  RECORD_CATEGORIES,
  QUALITY_RATINGS,
  STORAGE_KEYS,
  EVENT_TYPES,
  ERROR_CODES,
  HTTP_STATUS,
  DEFAULT_CONFIG,
  UI_CONSTANTS,
  THEMES,
  LANGUAGES,
  FILE_TYPES,
  EXPORT_FORMATS,
  REGEX_PATTERNS,
  VALIDATION_RULES,
  PERFORMANCE_METRICS,
  FEATURE_FLAGS
};

// 兼容CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APP_INFO,
    MODEL_TYPES,
    MODEL_CONFIGS,
    TABLE_PLATFORMS,
    PLATFORM_CONFIGS,
    SYNC_STATUS,
    SYNC_TYPES,
    DATA_TYPES,
    OPERATION_TYPES,
    RECORD_CATEGORIES,
    QUALITY_RATINGS,
    STORAGE_KEYS,
    EVENT_TYPES,
    ERROR_CODES,
    HTTP_STATUS,
    DEFAULT_CONFIG,
    UI_CONSTANTS,
    THEMES,
    LANGUAGES,
    FILE_TYPES,
    EXPORT_FORMATS,
    REGEX_PATTERNS,
    VALIDATION_RULES,
    PERFORMANCE_METRICS,
    FEATURE_FLAGS
  };
}