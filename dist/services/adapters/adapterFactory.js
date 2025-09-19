/**
 * 适配器工厂类
 * 统一管理和创建不同平台的适配器实例
 */
class AdapterFactory {
  /**
   * 创建适配器实例
   * @param {string} platform - 平台类型
   * @param {Object} config - 配置信息
   * @returns {BaseAdapter} 适配器实例
   */
  static createAdapter(platform, config) {
    // 验证平台类型
    if (!this.isSupportedPlatform(platform)) {
      throw new Error(`不支持的平台类型: ${platform}`);
    }

    // 添加平台信息到配置
    const adapterConfig = {
      ...config,
      platform: platform
    };

    try {
      switch (platform.toLowerCase()) {
        case 'feishu':
          return new FeishuAdapter(adapterConfig);
        case 'dingtalk':
          return new DingtalkAdapter(adapterConfig);
        case 'wework':
          return new WeworkAdapter(adapterConfig);
        default:
          throw new Error(`未实现的平台适配器: ${platform}`);
      }
    } catch (error) {
      console.error(`创建${platform}适配器失败:`, error);
      throw new Error(`创建${platform}适配器失败: ${error.message}`);
    }
  }

  /**
   * 获取支持的平台列表
   * @returns {Array} 支持的平台列表
   */
  static getSupportedPlatforms() {
    return [
      {
        key: 'feishu',
        name: '飞书多维表格',
        description: '飞书(Lark)多维表格集成',
        requiredFields: ['appId', 'appSecret', 'tableToken'],
        optionalFields: ['tableId', 'baseUrl']
      },
      {
        key: 'dingtalk',
        name: '钉钉智能表格',
        description: '钉钉智能表格集成',
        requiredFields: ['appKey', 'appSecret', 'workbookId', 'sheetId'],
        optionalFields: ['baseUrl']
      },
      {
        key: 'wework',
        name: '企业微信智能表格',
        description: '企业微信智能表格集成',
        requiredFields: ['corpId', 'corpSecret', 'agentId', 'docId', 'sheetId'],
        optionalFields: ['baseUrl']
      }
    ];
  }

  /**
   * 检查是否支持指定平台
   * @param {string} platform - 平台类型
   * @returns {boolean} 是否支持
   */
  static isSupportedPlatform(platform) {
    const supportedPlatforms = this.getSupportedPlatforms().map(p => p.key);
    return supportedPlatforms.includes(platform.toLowerCase());
  }

  /**
   * 获取平台配置模板
   * @param {string} platform - 平台类型
   * @returns {Object} 配置模板
   */
  static getConfigTemplate(platform) {
    const platformInfo = this.getSupportedPlatforms().find(
      p => p.key === platform.toLowerCase()
    );

    if (!platformInfo) {
      throw new Error(`不支持的平台类型: ${platform}`);
    }

    const template = {
      platform: platform.toLowerCase(),
      name: '',
      description: ''
    };

    // 添加必需字段
    platformInfo.requiredFields.forEach(field => {
      template[field] = '';
    });

    // 添加可选字段
    platformInfo.optionalFields.forEach(field => {
      template[field] = '';
    });

    return template;
  }

  /**
   * 验证配置信息
   * @param {string} platform - 平台类型
   * @param {Object} config - 配置信息
   * @returns {Object} 验证结果
   */
  static validateConfig(platform, config) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      const platformInfo = this.getSupportedPlatforms().find(
        p => p.key === platform.toLowerCase()
      );

      if (!platformInfo) {
        result.isValid = false;
        result.errors.push(`不支持的平台类型: ${platform}`);
        return result;
      }

      // 检查必需字段
      platformInfo.requiredFields.forEach(field => {
        if (!config[field] || config[field].trim() === '') {
          result.isValid = false;
          result.errors.push(`缺少必需字段: ${field}`);
        }
      });

      // 检查字段格式
      this.validateFieldFormats(platform, config, result);

      // 检查可选字段的警告
      platformInfo.optionalFields.forEach(field => {
        if (!config[field] || config[field].trim() === '') {
          result.warnings.push(`建议配置可选字段: ${field}`);
        }
      });

    } catch (error) {
      result.isValid = false;
      result.errors.push(`配置验证失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 验证字段格式
   * @param {string} platform - 平台类型
   * @param {Object} config - 配置信息
   * @param {Object} result - 验证结果对象
   */
  static validateFieldFormats(platform, config, result) {
    switch (platform.toLowerCase()) {
      case 'feishu':
        if (config.appId && !config.appId.startsWith('cli_')) {
          result.warnings.push('飞书AppId通常以"cli_"开头');
        }
        if (config.tableToken && !config.tableToken.startsWith('bascn')) {
          result.warnings.push('飞书TableToken通常以"bascn"开头');
        }
        break;
        
      case 'dingtalk':
        if (config.appKey && config.appKey.length < 10) {
          result.warnings.push('钉钉AppKey长度可能不正确');
        }
        break;
        
      case 'wework':
        if (config.corpId && config.corpId.length !== 18) {
          result.warnings.push('企业微信CorpId长度通常为18位');
        }
        break;
    }
  }

  /**
   * 批量创建适配器
   * @param {Array} configs - 配置数组
   * @returns {Array} 适配器实例数组
   */
  static createBatchAdapters(configs) {
    const results = [];
    const errors = [];

    configs.forEach((config, index) => {
      try {
        const adapter = this.createAdapter(config.platform, config);
        results.push({
          index,
          platform: config.platform,
          adapter,
          success: true
        });
      } catch (error) {
        errors.push({
          index,
          platform: config.platform,
          error: error.message,
          success: false
        });
      }
    });

    return {
      results,
      errors,
      summary: {
        total: configs.length,
        success: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * 测试适配器连接
   * @param {string} platform - 平台类型
   * @param {Object} config - 配置信息
   * @returns {Promise<Object>} 测试结果
   */
  static async testAdapterConnection(platform, config) {
    const startTime = Date.now();
    
    try {
      // 验证配置
      const validation = this.validateConfig(platform, config);
      if (!validation.isValid) {
        return {
          success: false,
          platform,
          error: validation.errors.join(', '),
          duration: Date.now() - startTime
        };
      }

      // 创建适配器
      const adapter = this.createAdapter(platform, config);
      
      // 测试连接
      const isConnected = await adapter.testConnection();
      
      return {
        success: isConnected,
        platform,
        duration: Date.now() - startTime,
        warnings: validation.warnings
      };
      
    } catch (error) {
      return {
        success: false,
        platform,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * 获取平台特定的帮助信息
   * @param {string} platform - 平台类型
   * @returns {Object} 帮助信息
   */
  static getPlatformHelp(platform) {
    const helpInfo = {
      feishu: {
        title: '飞书多维表格配置帮助',
        steps: [
          '1. 登录飞书开放平台 (https://open.feishu.cn)',
          '2. 创建企业自建应用',
          '3. 获取App ID和App Secret',
          '4. 开通"多维表格"权限',
          '5. 获取多维表格的Table Token'
        ],
        links: [
          { name: '飞书开放平台', url: 'https://open.feishu.cn' },
          { name: '多维表格API文档', url: 'https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN' }
        ]
      },
      dingtalk: {
        title: '钉钉智能表格配置帮助',
        steps: [
          '1. 登录钉钉开放平台 (https://open.dingtalk.com)',
          '2. 创建企业内部应用',
          '3. 获取AppKey和AppSecret',
          '4. 开通"智能表格"权限',
          '5. 获取工作簿ID和表格ID'
        ],
        links: [
          { name: '钉钉开放平台', url: 'https://open.dingtalk.com' },
          { name: '智能表格API文档', url: 'https://open.dingtalk.com/document/orgapp-server/yida-overview' }
        ]
      },
      wework: {
        title: '企业微信智能表格配置帮助',
        steps: [
          '1. 登录企业微信管理后台',
          '2. 创建企业应用',
          '3. 获取CorpID、CorpSecret和AgentID',
          '4. 开通"智能表格"权限',
          '5. 获取文档ID和表格ID'
        ],
        links: [
          { name: '企业微信开发文档', url: 'https://developer.work.weixin.qq.com' },
          { name: '智能表格API文档', url: 'https://developer.work.weixin.qq.com/document/path/97465' }
        ]
      }
    };

    return helpInfo[platform.toLowerCase()] || {
      title: '未知平台',
      steps: [],
      links: []
    };
  }
}

// 导出适配器工厂类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdapterFactory;
} else {