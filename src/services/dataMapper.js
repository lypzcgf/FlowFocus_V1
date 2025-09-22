/**
 * 数据映射服务类
 * 提供JSON数据序列化和反序列化功能
 * 支持跨平台数据转换、压缩优化、版本管理和数据迁移
 */
import { DateUtils } from '../utils/helpers.js';

class DataMapper {
  /**
   * 序列化本地数据为多维表格格式
   * @param {Object} localData - 本地数据
   * @param {string} dataType - 数据类型
   * @returns {Object} 序列化后的数据
   */
  static serializeForTable(localData, dataType) {
    try {
      // 创建基础序列化数据对象
      const serializedData = {
        id: localData.id || this.generateId(),
        type: dataType,
        name: localData.name || localData.title || '未命名',
        data: JSON.stringify(localData),
        metadata: {
          version: '2.0',
          dataType: dataType,
          createdAt: localData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'FlowFocus',
          schema: this.getDataSchema(dataType)
        }
      };
      
      // 保留必要的表格信息字段，确保在飞书适配器中能正确构建URL
      if (localData.tableToken) {
        serializedData.tableToken = localData.tableToken;
      }
      if (localData.tableId) {
        serializedData.tableId = localData.tableId;
      }
      
      
      // 根据数据类型添加特定字段
      switch (dataType) {
        case 'modelConfig':
          serializedData.modelType = localData.type;
          serializedData.modelName = localData.name;
          serializedData.isActive = localData.isActive || false;
          
          // 为大模型配置特别构建"数据集合"字段
          // 确保包含完整的大模型配置信息
          serializedData['数据集合'] = JSON.stringify({
            '配置名称': localData.name,
            '大模型品牌': localData.modelType || localData.type || '未知',
            'API Key': localData.apiKey ? '已设置' : '未设置',
            'Base URL': localData.baseUrl,
            '模型端点': localData.modelEndpoint,
            '创建时间': localData.createdAt ? DateUtils.format(new Date(localData.createdAt), 'YYYY-MM-DD HH:mm:ss') : DateUtils.format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
            '更新时间': DateUtils.format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
            '状态': '正常'
          });
          break;
          
        case 'rewriteRecord':
          serializedData.originalText = localData.originalText;
          serializedData.rewrittenText = localData.rewrittenText;
          serializedData.modelUsed = localData.modelType;
          serializedData.category = localData.category || '通用';
          serializedData.quality = localData.quality || 0;
          alert(`数据类型信息:\n- 原始类型: ${dataType || '未设置'}\n- 确定类型: ${dataType}\n- 记录ID: ${localData.id || '未知'}`);
          // 为改写工作记录构建"数据集合"字段
          // 包含所有必要的信息
          serializedData['数据集合'] = JSON.stringify({
            '工作ID': localData.id,
            '工作名称': localData.name,
            '原文所属网页URL': localData.metadata.url || '',
            '原文所属网页标题': localData.metadata.title || '',
            '原文': localData.originalText,
            '提示词': localData.prompt || '',
            '改写结果': localData.rewrittenText,
            'AI配置ID': localData.modelConfigId || '',
            '大模型品牌': localData.modelBrand || '未知',
            '大模型名称': localData.modelName || '未知',
            '创建时间': localData.createdAt ? DateUtils.format(new Date(localData.createdAt), 'YYYY-MM-DD HH:mm:ss') : DateUtils.format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
            '更新时间': localData.updatedAt ? DateUtils.format(new Date(localData.updatedAt), 'YYYY-MM-DD HH:mm:ss') : DateUtils.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
          });
          break;
          
        case 'tableConfig':
          serializedData.platform = localData.platform;
          serializedData.tableName = localData.tableName;
          serializedData.isConnected = localData.isConnected || false;
          break;
      }
      
      return serializedData;
      
    } catch (error) {
      console.error('数据序列化失败:', error);
      throw new Error(`数据序列化失败: ${error.message}`);
    }
  }

  /**
   * 反序列化多维表格数据为本地格式
   * @param {Object} tableData - 多维表格数据
   * @returns {Object} 反序列化后的本地数据
   */
  static deserializeFromTable(tableData) {
    try {
      if (!tableData.data) {
        throw new Error('缺少数据字段');
      }
      
      const localData = JSON.parse(tableData.data);
      
      // 添加同步元数据
      localData.syncMetadata = {
        syncId: tableData.id,
        syncedAt: new Date().toISOString(),
        source: 'MultiTable',
        version: tableData.metadata?.version || '1.0',
        originalMetadata: tableData.metadata
      };
      
      // 验证数据完整性
      this.validateDeserializedData(localData, tableData.type);
      
      return localData;
      
    } catch (error) {
      console.error('数据反序列化失败:', error);
      throw new Error(`数据反序列化失败: ${error.message}`);
    }
  }

  /**
   * 验证数据格式
   * @param {Object} data - 待验证数据
   * @param {Object} schema - 数据模式
   * @returns {boolean} 验证结果
   */
  static validateData(data, schema) {
    try {
      const requiredFields = schema.required || [];
      
      // 检查必需字段
      for (const field of requiredFields) {
        if (!data.hasOwnProperty(field)) {
          throw new Error(`缺少必需字段: ${field}`);
        }
      }
      
      // 检查字段类型
      if (schema.properties) {
        for (const [field, fieldSchema] of Object.entries(schema.properties)) {
          if (data.hasOwnProperty(field)) {
            if (!this.validateFieldType(data[field], fieldSchema.type)) {
              throw new Error(`字段 ${field} 类型不匹配，期望: ${fieldSchema.type}`);
            }
          }
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('数据验证失败:', error);
      throw error;
    }
  }

  /**
   * 批量序列化数据
   * @param {Array} dataArray - 数据数组
   * @param {string} dataType - 数据类型
   * @returns {Array} 序列化后的数据数组
   */
  static serializeBatch(dataArray, dataType) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < dataArray.length; i++) {
      try {
        const serialized = this.serializeForTable(dataArray[i], dataType);
        results.push(serialized);
      } catch (error) {
        errors.push({
          index: i,
          data: dataArray[i],
          error: error.message
        });
      }
    }
    
    return {
      results,
      errors,
      summary: {
        total: dataArray.length,
        success: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * 批量反序列化数据
   * @param {Array} tableDataArray - 多维表格数据数组
   * @returns {Array} 反序列化后的数据数组
   */
  static deserializeBatch(tableDataArray) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < tableDataArray.length; i++) {
      try {
        const deserialized = this.deserializeFromTable(tableDataArray[i]);
        results.push(deserialized);
      } catch (error) {
        errors.push({
          index: i,
          data: tableDataArray[i],
          error: error.message
        });
      }
    }
    
    return {
      results,
      errors,
      summary: {
        total: tableDataArray.length,
        success: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * 跨平台数据转换
   * @param {Object} data - 源数据
   * @param {string} sourcePlatform - 源平台
   * @param {string} targetPlatform - 目标平台
   * @returns {Object} 转换后的数据
   */
  static transformForPlatform(data, sourcePlatform, targetPlatform) {
    try {
      // 如果是相同平台，直接返回
      if (sourcePlatform === targetPlatform) {
        return data;
      }
      
      // 获取平台特定的转换规则
      const transformRules = this.getPlatformTransformRules(sourcePlatform, targetPlatform);
      
      const transformedData = { ...data };
      
      // 应用字段映射
      if (transformRules.fieldMapping) {
        for (const [sourceField, targetField] of Object.entries(transformRules.fieldMapping)) {
          if (data.hasOwnProperty(sourceField)) {
            transformedData[targetField] = data[sourceField];
            if (sourceField !== targetField) {
              delete transformedData[sourceField];
            }
          }
        }
      }
      
      // 应用数据格式转换
      if (transformRules.formatTransforms) {
        for (const [field, transform] of Object.entries(transformRules.formatTransforms)) {
          if (transformedData.hasOwnProperty(field)) {
            transformedData[field] = this.applyFormatTransform(transformedData[field], transform);
          }
        }
      }
      
      // 添加平台特定的元数据
      transformedData.platformMetadata = {
        sourcePlatform,
        targetPlatform,
        transformedAt: new Date().toISOString(),
        transformRules: transformRules.name || 'default'
      };
      
      return transformedData;
      
    } catch (error) {
      console.error('跨平台数据转换失败:', error);
      throw new Error(`跨平台数据转换失败: ${error.message}`);
    }
  }

  /**
   * 压缩数据
   * @param {Object} data - 待压缩数据
   * @param {Object} options - 压缩选项
   * @returns {Object} 压缩后的数据
   */
  static compressData(data, options = {}) {
    try {
      const compressed = {
        _compressed: true,
        _version: '2.0',
        _timestamp: Date.now()
      };
      
      // 移除空值和默认值
      if (options.removeEmpty !== false) {
        data = this.removeEmptyValues(data);
      }
      
      // 压缩重复字符串
      if (options.compressStrings !== false) {
        const { compressedData, dictionary } = this.compressStrings(data);
        compressed.data = compressedData;
        compressed.dictionary = dictionary;
      } else {
        compressed.data = data;
      }
      
      // 计算压缩率
      const originalSize = JSON.stringify(data).length;
      const compressedSize = JSON.stringify(compressed).length;
      compressed._compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2) + '%';
      
      return compressed;
      
    } catch (error) {
      console.error('数据压缩失败:', error);
      throw new Error(`数据压缩失败: ${error.message}`);
    }
  }

  /**
   * 解压数据
   * @param {Object} compressedData - 压缩数据
   * @returns {Object} 解压后的数据
   */
  static decompressData(compressedData) {
    try {
      if (!compressedData._compressed) {
        return compressedData; // 未压缩的数据直接返回
      }
      
      let data = compressedData.data;
      
      // 解压字符串
      if (compressedData.dictionary) {
        data = this.decompressStrings(data, compressedData.dictionary);
      }
      
      return data;
      
    } catch (error) {
      console.error('数据解压失败:', error);
      throw new Error(`数据解压失败: ${error.message}`);
    }
  }

  /**
   * 数据版本迁移
   * @param {Object} data - 待迁移数据
   * @param {string} fromVersion - 源版本
   * @param {string} toVersion - 目标版本
   * @returns {Object} 迁移后的数据
   */
  static migrateDataVersion(data, fromVersion, toVersion) {
    try {
      if (fromVersion === toVersion) {
        return data;
      }
      
      const migrationPath = this.getMigrationPath(fromVersion, toVersion);
      let migratedData = { ...data };
      
      for (const migration of migrationPath) {
        migratedData = this.applyMigration(migratedData, migration);
      }
      
      // 更新版本信息
      if (migratedData.metadata) {
        migratedData.metadata.version = toVersion;
        migratedData.metadata.migratedAt = new Date().toISOString();
        migratedData.metadata.migrationPath = migrationPath.map(m => m.name);
      }
      
      return migratedData;
      
    } catch (error) {
      console.error('数据版本迁移失败:', error);
      throw new Error(`数据版本迁移失败: ${error.message}`);
    }
  }

  /**
   * 智能数据映射
   * @param {Object} sourceData - 源数据
   * @param {Object} targetSchema - 目标模式
   * @param {Object} options - 映射选项
   * @returns {Object} 映射后的数据
   */
  static smartMapping(sourceData, targetSchema, options = {}) {
    try {
      const mappedData = {};
      const unmappedFields = [];
      const warnings = [];
      
      // 自动字段映射
      for (const [targetField, fieldSchema] of Object.entries(targetSchema.properties || {})) {
        let mapped = false;
        
        // 1. 精确匹配
        if (sourceData.hasOwnProperty(targetField)) {
          mappedData[targetField] = this.convertFieldType(sourceData[targetField], fieldSchema.type);
          mapped = true;
        }
        // 2. 模糊匹配
        else {
          const fuzzyMatch = this.findFuzzyMatch(targetField, Object.keys(sourceData));
          if (fuzzyMatch && fuzzyMatch.confidence > 0.8) {
            mappedData[targetField] = this.convertFieldType(sourceData[fuzzyMatch.field], fieldSchema.type);
            mapped = true;
            warnings.push(`字段 '${targetField}' 通过模糊匹配映射到 '${fuzzyMatch.field}'`);
          }
        }
        
        // 3. 默认值
        if (!mapped && fieldSchema.default !== undefined) {
          mappedData[targetField] = fieldSchema.default;
          mapped = true;
        }
        
        // 4. 必需字段检查
        if (!mapped && targetSchema.required && targetSchema.required.includes(targetField)) {
          if (options.strict !== false) {
            throw new Error(`缺少必需字段: ${targetField}`);
          } else {
            unmappedFields.push(targetField);
          }
        }
      }
      
      return {
        data: mappedData,
        unmappedFields,
        warnings,
        mappingSuccess: unmappedFields.length === 0
      };
      
    } catch (error) {
      console.error('智能数据映射失败:', error);
      throw new Error(`智能数据映射失败: ${error.message}`);
    }
  }

  /**
   * 获取数据模式
   * @param {string} dataType - 数据类型
   * @returns {Object} 数据模式
   */
  static getDataSchema(dataType) {
    const schemas = {
      modelConfig: {
        required: ['id', 'type', 'name', 'apiKey'],
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          name: { type: 'string' },
          apiKey: { type: 'string' },
          baseUrl: { type: 'string', default: '' },
          defaultModel: { type: 'string', default: '' },
          temperature: { type: 'number', default: 0.7 },
          maxTokens: { type: 'number', default: 2000 },
          isActive: { type: 'boolean', default: false }
        }
      },
      rewriteRecord: {
        required: ['id', 'originalText', 'rewrittenText', 'modelType'],
        properties: {
          id: { type: 'string' },
          originalText: { type: 'string' },
          rewrittenText: { type: 'string' },
          modelType: { type: 'string' },
          category: { type: 'string', default: '通用' },
          quality: { type: 'number', default: 0 },
          status: { type: 'string', default: 'completed' },
          tags: { type: 'array', default: [] },
          processingTime: { type: 'number', default: 0 },
          tokenUsage: { type: 'object', default: {} }
        }
      },
      tableConfig: {
        required: ['id', 'platform', 'name'],
        properties: {
          id: { type: 'string' },
          platform: { type: 'string' },
          name: { type: 'string' },
          tableName: { type: 'string', default: '' },
          tableToken: { type: 'string', default: '' },
          appId: { type: 'string', default: '' },
          appSecret: { type: 'string', default: '' },
          isConnected: { type: 'boolean', default: false },
          lastSyncAt: { type: 'string', default: '' },
          syncCount: { type: 'number', default: 0 }
        }
      },
      syncRecord: {
        required: ['id', 'recordId', 'platform', 'status'],
        properties: {
          id: { type: 'string' },
          recordId: { type: 'string' },
          platform: { type: 'string' },
          status: { type: 'string' },
          syncedAt: { type: 'string' },
          error: { type: 'string', default: '' },
          retryCount: { type: 'number', default: 0 },
          metadata: { type: 'object', default: {} }
        }
      }
    };
    
    return schemas[dataType] || { required: [], properties: {} };
  }

  // 私有方法
  static generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static validateFieldType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  static validateDeserializedData(data, dataType) {
    const schema = this.getDataSchema(dataType);
    return this.validateData(data, schema);
  }

  // 新增辅助方法
  
  /**
   * 获取平台转换规则
   * @param {string} sourcePlatform - 源平台
   * @param {string} targetPlatform - 目标平台
   * @returns {Object} 转换规则
   */
  static getPlatformTransformRules(sourcePlatform, targetPlatform) {
    const transformRules = {
      'feishu_to_dingtalk': {
        name: 'feishu_to_dingtalk',
        fieldMapping: {
          'record_id': 'instanceId',
          'fields': 'formData',
          'created_time': 'createTime',
          'last_modified_time': 'modifyTime'
        },
        formatTransforms: {
          'fields': 'feishu_to_dingtalk_fields'
        }
      },
      'dingtalk_to_wework': {
        name: 'dingtalk_to_wework',
        fieldMapping: {
          'instanceId': 'record_id',
          'formData': 'values',
          'createTime': 'create_time',
          'modifyTime': 'update_time'
        },
        formatTransforms: {
          'formData': 'dingtalk_to_wework_values'
        }
      },
      'wework_to_feishu': {
        name: 'wework_to_feishu',
        fieldMapping: {
          'record_id': 'record_id',
          'values': 'fields',
          'create_time': 'created_time',
          'update_time': 'last_modified_time'
        },
        formatTransforms: {
          'values': 'wework_to_feishu_fields'
        }
      }
    };
    
    const ruleKey = `${sourcePlatform}_to_${targetPlatform}`;
    return transformRules[ruleKey] || { fieldMapping: {}, formatTransforms: {} };
  }

  /**
   * 应用格式转换
   * @param {any} value - 待转换值
   * @param {string} transformType - 转换类型
   * @returns {any} 转换后的值
   */
  static applyFormatTransform(value, transformType) {
    switch (transformType) {
      case 'feishu_to_dingtalk_fields':
        // 飞书字段格式转换为钉钉格式
        if (typeof value === 'object') {
          const transformed = {};
          for (const [key, val] of Object.entries(value)) {
            if (Array.isArray(val) && val[0] && val[0].text) {
              transformed[key] = val[0].text;
            } else {
              transformed[key] = val;
            }
          }
          return transformed;
        }
        return value;
        
      case 'dingtalk_to_wework_values':
        // 钉钉表单数据转换为企业微信值数组
        if (typeof value === 'object') {
          return Object.values(value).map(val => ({
            type: 'text',
            value: String(val)
          }));
        }
        return value;
        
      case 'wework_to_feishu_fields':
        // 企业微信值数组转换为飞书字段格式
        if (Array.isArray(value)) {
          const fields = {};
          value.forEach((item, index) => {
            fields[`field_${index}`] = [{
              type: item.type || 'text',
              text: item.value
            }];
          });
          return fields;
        }
        return value;
        
      default:
        return value;
    }
  }

  /**
   * 移除空值
   * @param {Object} data - 数据对象
   * @returns {Object} 清理后的数据
   */
  static removeEmptyValues(data) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && Object.keys(value).length === 0)) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedValue = this.removeEmptyValues(value);
          if (Object.keys(cleanedValue).length > 0) {
            cleaned[key] = cleanedValue;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }

  /**
   * 压缩字符串
   * @param {Object} data - 数据对象
   * @returns {Object} 压缩结果
   */
  static compressStrings(data) {
    const dictionary = new Map();
    let dictIndex = 0;
    
    const compress = (obj) => {
      if (typeof obj === 'string' && obj.length > 10) {
        if (!dictionary.has(obj)) {
          dictionary.set(obj, `__STR_${dictIndex++}__`);
        }
        return dictionary.get(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(compress);
      } else if (typeof obj === 'object' && obj !== null) {
        const compressed = {};
        for (const [key, value] of Object.entries(obj)) {
          compressed[key] = compress(value);
        }
        return compressed;
      }
      return obj;
    };
    
    const compressedData = compress(data);
    const dictionaryObj = Object.fromEntries(
      Array.from(dictionary.entries()).map(([str, token]) => [token, str])
    );
    
    return { compressedData, dictionary: dictionaryObj };
  }

  /**
   * 解压字符串
   * @param {Object} data - 压缩数据
   * @param {Object} dictionary - 字典
   * @returns {Object} 解压后的数据
   */
  static decompressStrings(data, dictionary) {
    const decompress = (obj) => {
      if (typeof obj === 'string' && obj.startsWith('__STR_') && obj.endsWith('__')) {
        return dictionary[obj] || obj;
      } else if (Array.isArray(obj)) {
        return obj.map(decompress);
      } else if (typeof obj === 'object' && obj !== null) {
        const decompressed = {};
        for (const [key, value] of Object.entries(obj)) {
          decompressed[key] = decompress(value);
        }
        return decompressed;
      }
      return obj;
    };
    
    return decompress(data);
  }

  /**
   * 获取迁移路径
   * @param {string} fromVersion - 源版本
   * @param {string} toVersion - 目标版本
   * @returns {Array} 迁移路径
   */
  static getMigrationPath(fromVersion, toVersion) {
    const migrations = {
      '1.0_to_1.1': {
        name: '1.0_to_1.1',
        description: '添加质量评估字段',
        transform: (data) => {
          if (data.type === 'rewriteRecord' && !data.hasOwnProperty('quality')) {
            data.quality = 0;
          }
          return data;
        }
      },
      '1.1_to_2.0': {
        name: '1.1_to_2.0',
        description: '重构元数据结构',
        transform: (data) => {
          if (data.metadata && typeof data.metadata === 'string') {
            try {
              data.metadata = JSON.parse(data.metadata);
            } catch (e) {
              data.metadata = { legacy: data.metadata };
            }
          }
          return data;
        }
      }
    };
    
    // 简化版本路径计算
    const path = [];
    if (fromVersion === '1.0' && toVersion === '2.0') {
      path.push(migrations['1.0_to_1.1'], migrations['1.1_to_2.0']);
    } else if (fromVersion === '1.0' && toVersion === '1.1') {
      path.push(migrations['1.0_to_1.1']);
    } else if (fromVersion === '1.1' && toVersion === '2.0') {
      path.push(migrations['1.1_to_2.0']);
    }
    
    return path;
  }

  /**
   * 应用迁移
   * @param {Object} data - 数据
   * @param {Object} migration - 迁移规则
   * @returns {Object} 迁移后的数据
   */
  static applyMigration(data, migration) {
    try {
      return migration.transform(data);
    } catch (error) {
      console.error(`迁移 ${migration.name} 失败:`, error);
      throw error;
    }
  }

  /**
   * 模糊匹配字段名
   * @param {string} targetField - 目标字段
   * @param {Array} sourceFields - 源字段列表
   * @returns {Object|null} 匹配结果
   */
  static findFuzzyMatch(targetField, sourceFields) {
    const target = targetField.toLowerCase();
    let bestMatch = null;
    let bestConfidence = 0;
    
    for (const sourceField of sourceFields) {
      const source = sourceField.toLowerCase();
      
      // 计算相似度
      let confidence = 0;
      
      // 精确匹配
      if (source === target) {
        confidence = 1.0;
      }
      // 包含匹配
      else if (source.includes(target) || target.includes(source)) {
        confidence = 0.9;
      }
      // 编辑距离匹配
      else {
        const distance = this.levenshteinDistance(source, target);
        const maxLength = Math.max(source.length, target.length);
        confidence = 1 - (distance / maxLength);
      }
      
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = { field: sourceField, confidence };
      }
    }
    
    return bestMatch;
  }

  /**
   * 计算编辑距离
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} 编辑距离
   */
  static levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 转换字段类型
   * @param {any} value - 值
   * @param {string} targetType - 目标类型
   * @returns {any} 转换后的值
   */
  static convertFieldType(value, targetType) {
    try {
      switch (targetType) {
        case 'string':
          return String(value);
        case 'number':
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        case 'boolean':
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
          }
          return Boolean(value);
        case 'array':
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return value.split(',').map(s => s.trim());
            }
          }
          return [value];
        case 'object':
          if (typeof value === 'object' && value !== null) return value;
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return { value };
            }
          }
          return { value };
        default:
          return value;
      }
    } catch (error) {
      console.warn(`字段类型转换失败: ${error.message}`);
      return value;
    }
  }
}

// 导出服务类 - 支持ES模块和CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataMapper;
  module.exports.default = DataMapper; // 兼容ES模块默认导入
} else if (typeof define === 'function' && define.amd) {
  define([], function() { return DataMapper; });
} else {
  window.DataMapper = DataMapper;
}

// ES模块默认导出
export default DataMapper;