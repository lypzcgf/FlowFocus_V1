# FlowFocus V2.0 架构设计文档

## 版本信息
- **版本号**: v2.0
- **发布日期**: 2025年9月
- **基于版本**: v1.0

---

## 1. V2版本整体架构设计

### 1.1 架构概述

FlowFocus V2.0 在 V1.0 基础上进行了重大架构升级，新增了多维表格集成服务、数据同步引擎和JSON数据映射层，形成了更加完整和强大的数据管理生态系统。

### 1.2 技术栈升级

- **前端**: 原生 JavaScript + HTML + CSS
- **构建工具**: Webpack
- **存储**: Chrome Storage API + 多维表格云存储
- **AI 模型**: 支持 Qwen、DeepSeek、Volces、Kimi、Hunyuan 等5种主流大模型
- **多维表格**: 支持飞书、钉钉、企业微信多维表格
- **数据映射**: JSON序列化数据映射层

### 1.3 V2架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Chrome 浏览器界面                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        侧边栏 (Sidebar)                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  功能切换区域 (标签页)                                              │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  多维表格配置标签页 (NEW)                                           │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  大模型配置标签页 (ENHANCED)                                        │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  改写功能标签页 (ENHANCED)                                          │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        后台服务层 (Background)                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  多维表格集成服务 (NEW)                                             │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  数据同步引擎 (NEW)                                                 │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  JSON数据映射层 (NEW)                                               │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  大模型服务 (ENHANCED)                                              │ │ │
│  │  ├─────────────────────────────────────────────────────────────────────┤ │ │
│  │  │  存储服务 (ENHANCED)                                                │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        外部服务集成层                                   │ │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐ │ │
│  │  │  飞书多维表格   │ │  钉钉多维表格   │ │  企业微信智能表格           │ │ │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────────────────┘ │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │ │
│  │  │  Qwen API   │ │ DeepSeek API│ │ Volces API  │ │  Kimi API   │ │Hunyuan API  │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 V2数据流设计

```
用户操作 → 前端界面 → 数据映射层 → 同步引擎 → 多维表格/本地存储
    ↓                                    ↓
结果反馈 ← 界面更新 ← 数据处理 ← API响应 ← 外部服务
```

---

## 2. 新增的多维表格集成服务

### 2.1 服务架构

多维表格集成服务是V2版本的核心新增功能，提供统一的多维表格操作接口，支持飞书、钉钉、企业微信三大平台。

```
┌─────────────────────────────────────────────────────────────┐
│                  多维表格集成服务                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              统一接口层 (Unified API Layer)             │ │
│  │  • createRecord()    • updateRecord()                  │ │
│  │  • deleteRecord()    • queryRecords()                  │ │
│  │  • testConnection()  • batchSync()                     │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              平台适配层 (Platform Adapter)              │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │ │
│  │  │ 飞书适配器   │ │ 钉钉适配器   │ │ 企业微信适配器       │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              认证管理层 (Auth Manager)                   │ │
│  │  • Token管理     • 权限验证     • 连接池管理            │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心功能模块

#### 2.2.1 飞书多维表格适配器
- **API端点**: `https://open.feishu.cn/open-apis/bitable/v1`
- **认证方式**: App Token + Table Token
- **核心方法**:
  - `createFeishuRecord()`: 创建记录
  - `updateFeishuRecord()`: 更新记录
  - `queryFeishuRecords()`: 查询记录
  - `testFeishuConnection()`: 测试连接

#### 2.2.2 钉钉多维表格适配器
- **API端点**: `https://oapi.dingtalk.com/v1.0/yida`
- **认证方式**: Access Token + App Token
- **核心方法**:
  - `createDingRecord()`: 创建记录
  - `updateDingRecord()`: 更新记录
  - `queryDingRecords()`: 查询记录
  - `testDingConnection()`: 测试连接

#### 2.2.3 企业微信智能表格适配器
- **API端点**: `https://qyapi.weixin.qq.com/cgi-bin/wedoc`
- **认证方式**: Corp ID + Corp Secret + Table ID
- **核心方法**:
  - `createWeworkRecord()`: 创建记录
  - `updateWeworkRecord()`: 更新记录
  - `queryWeworkRecords()`: 查询记录
  - `testWeworkConnection()`: 测试连接

### 2.3 配置管理

```javascript
// 多维表格配置数据结构
{
  id: "unique-id",
  name: "配置名称",
  platform: "feishu|dingtalk|wework",
  appId: "应用ID",
  appSecret: "加密后的应用密钥",
  tableToken: "表格Token",
  baseUrl: "API基础URL",
  active: true,
  createdAt: "创建时间",
  updatedAt: "更新时间"
}
```

---

## 3. 数据同步引擎设计

### 3.1 同步引擎架构

数据同步引擎负责在本地存储和多维表格之间进行数据同步，支持单条同步和批量同步。

```
┌─────────────────────────────────────────────────────────────┐
│                    数据同步引擎                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              同步调度器 (Sync Scheduler)                │ │
│  │  • 单条同步     • 批量同步     • 定时同步              │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              冲突解决器 (Conflict Resolver)             │ │
│  │  • 时间戳比较   • 用户选择     • 自动合并              │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              状态管理器 (State Manager)                 │ │
│  │  • 同步状态     • 错误处理     • 重试机制              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 同步策略

#### 3.2.1 单条同步
- **触发方式**: 用户手动点击记录后的"同步"按钮
- **触发条件**: 用户选择目标多维表格配置
- **同步范围**: 单条记录
- **同步方向**: 本地 → 多维表格
- **交互流程**: 
  1. 用户点击单条记录的"同步"按钮
  2. 弹出多维表格选择对话框
  3. 用户选择目标多维表格配置
  4. 系统执行数据序列化和API调用
  5. 显示同步结果状态
- **冲突处理**: 覆盖远程记录

#### 3.2.2 批量同步
- **触发方式**: 用户选择多条记录复选框后点击"批量同步"按钮
- **触发条件**: 至少选择一条记录且选择目标多维表格
- **同步范围**: 多条选中记录
- **同步方向**: 本地 → 多维表格
- **交互流程**:
  1. 用户勾选多条记录的复选框
  2. 点击列表顶部的"批量同步"按钮
  3. 弹出批量同步确认对话框，显示选中记录数量
  4. 用户选择目标多维表格配置
  5. 系统逐条执行同步操作
  6. 实时显示同步进度和结果
- **冲突处理**: 批量覆盖

#### 3.2.3 全选同步
- **触发方式**: 用户点击"全选"复选框后点击"批量同步"按钮
- **触发条件**: 全选所有记录且选择目标多维表格
- **同步范围**: 当前标签页的所有记录
- **同步方向**: 本地 → 多维表格
- **交互流程**:
  1. 用户点击列表顶部的"全选"复选框
  2. 所有记录被自动选中
  3. 点击"批量同步"按钮
  4. 系统提示同步所有记录的确认信息
  5. 用户确认后开始批量同步
  6. 显示整体同步进度和详细结果
- **冲突处理**: 批量覆盖

### 3.3 同步状态管理

```javascript
// 同步状态枚举
const SyncStatus = {
  PENDING: 'pending',     // 待同步
  SYNCING: 'syncing',     // 同步中
  SUCCESS: 'success',     // 同步成功
  FAILED: 'failed',       // 同步失败
  CONFLICT: 'conflict'    // 存在冲突
};

// 同步记录数据结构
{
  recordId: "记录ID",
  recordType: "modelConfig|tableConfig|rewriteRecord",
  syncStatus: SyncStatus.PENDING,
  lastSyncTime: "最后同步时间",
  errorMessage: "错误信息",
  retryCount: 0
}
```

---

## 4. JSON数据映射层架构

### 4.1 映射层设计理念

JSON数据映射层是V2版本的创新设计，将本地复杂数据结构序列化为JSON字符串存储到多维表格中，实现了数据结构的统一性和扩展性。

### 4.2 映射层架构

```
┌─────────────────────────────────────────────────────────────┐
│                   JSON数据映射层                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              序列化引擎 (Serialization Engine)          │ │
│  │  • JSON序列化   • 数据压缩     • 类型转换              │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              反序列化引擎 (Deserialization Engine)      │ │
│  │  • JSON解析     • 数据还原     • 类型恢复              │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              数据验证器 (Data Validator)                │ │
│  │  • 结构验证     • 类型检查     • 完整性校验            │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 统一数据结构设计

#### 4.3.1 多维表格统一结构

```javascript
// 多维表格中的统一记录结构
{
  id: "记录唯一标识",
  type: "数据类型标识(modelConfig|tableConfig|rewriteRecord)",
  name: "记录名称",
  data: "JSON序列化的完整数据",
  metadata: {
    version: "数据版本",
    createdAt: "创建时间",
    updatedAt: "更新时间",
    source: "数据来源"
  }
}
```

#### 4.3.2 数据类型标准化

```javascript
// 大模型配置的JSON映射
{
  type: "modelConfig",
  data: JSON.stringify({
    id: "config-id",
    name: "配置名称",
    modelType: "Qwen",
    apiKey: "encrypted-key",
    baseUrl: "https://api.example.com",
    modelEndpoint: "model-name",
    temperature: 0.7,
    maxTokens: 1024,
    active: true
  })
}

// 改写记录的JSON映射
{
  type: "rewriteRecord",
  data: JSON.stringify({
    id: "record-id",
    name: "改写工作名称",
    originalText: "原始文本",
    rewritePrompt: "改写提示词",
    rewriteResult: "改写结果",
    modelConfigId: "使用的模型配置ID",
    sourceUrl: "来源URL",
    sourceTitle: "来源标题"
  })
}
```

### 4.4 映射层核心方法

```javascript
class DataMapper {
  // 序列化本地数据为多维表格格式
  serializeForTable(localData, dataType) {
    return {
      id: localData.id,
      type: dataType,
      name: localData.name,
      data: JSON.stringify(localData),
      metadata: {
        version: "2.0",
        createdAt: localData.createdAt,
        updatedAt: localData.updatedAt,
        source: "FlowFocus"
      }
    };
  }

  // 反序列化多维表格数据为本地格式
  deserializeFromTable(tableData) {
    const localData = JSON.parse(tableData.data);
    localData.syncMetadata = tableData.metadata;
    return localData;
  }

  // 数据验证
  validateData(data, schema) {
    // 实现数据结构验证逻辑
  }
}
```

---

## 5. 扩展的大模型支持

### 5.1 新增模型支持

V2版本在原有Qwen、DeepSeek基础上，新增了Volces、Kimi和hunyuan三个大模型平台的支持。

#### 5.1.1 Volces集成
- **API端点**: `https://ark.cn-beijing.volces.com/api/v3`
- **认证方式**: API Key
- **默认模型**: `ep-20241230140207-8v2kz`
- **特性**: 支持流式响应、多轮对话

#### 5.1.2 Kimi集成
- **API端点**: `https://api.moonshot.cn/v1`
- **认证方式**: Bearer Token
- **默认模型**: `moonshot-v1-8k`
- **特性**: 长文本处理、上下文理解

#### 5.1.3 Hunyuan集成
- **API端点**: `https://api.hunyuan.cloud.tencent.com/v1`
- **认证方式**: API Key
- **默认模型**: `hunyuan-turbos-latest`
- **特性**: 腾讯混元大模型，支持中文优化、多模态理解

### 5.2 模型管理器升级

```javascript
class ModelManager {
  constructor() {
    this.supportedModels = {
      'qwen': new QwenAdapter(),
      'deepseek': new DeepSeekAdapter(),
      'volces': new VolcesAdapter(),
      'kimi': new KimiAdapter(),
      'hunyuan': new HunyuanAdapter()
    };
  }

  // 统一的模型调用接口
  async callModel(configId, prompt, options = {}) {
    const config = await this.getModelConfig(configId);
    const adapter = this.supportedModels[config.modelType.toLowerCase()];
    return await adapter.generateText(config, prompt, options);
  }

  // 模型健康检查
  async testModelHealth(configId) {
    const config = await this.getModelConfig(configId);
    const adapter = this.supportedModels[config.modelType.toLowerCase()];
    return await adapter.testConnection(config);
  }
}
```

### 5.3 模型适配器接口

```javascript
// 统一的模型适配器接口
class BaseModelAdapter {
  async generateText(config, prompt, options) {
    throw new Error('Method must be implemented');
  }

  async testConnection(config) {
    throw new Error('Method must be implemented');
  }

  formatRequest(config, prompt, options) {
    throw new Error('Method must be implemented');
  }

  parseResponse(response) {
    throw new Error('Method must be implemented');
  }
}

// Hunyuan模型适配器实现示例
class HunyuanAdapter extends BaseModelAdapter {
  async generateText(config, prompt, options = {}) {
    const requestData = this.formatRequest(config, prompt, options);
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`Hunyuan API error: ${response.status}`);
    }
    
    const data = await response.json();
    return this.parseResponse(data);
  }

  async testConnection(config) {
    try {
      const testPrompt = '你好';
      await this.generateText(config, testPrompt, { max_tokens: 10 });
      return { success: true, message: 'Hunyuan连接测试成功' };
    } catch (error) {
      return { success: false, message: `Hunyuan连接测试失败: ${error.message}` };
    }
  }

  formatRequest(config, prompt, options) {
    return {
      model: config.modelEndpoint || 'hunyuan-turbos-latest',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || config.temperature || 0.7,
      max_tokens: options.max_tokens || config.maxTokens || 1024,
      top_p: options.top_p || config.topP || 0.9,
      frequency_penalty: options.frequency_penalty || config.frequencyPenalty || 0.0,
      presence_penalty: options.presence_penalty || config.presencePenalty || 0.0
    };
  }

  parseResponse(response) {
    if (response.choices && response.choices.length > 0) {
      return {
        text: response.choices[0].message.content,
        usage: response.usage,
        model: response.model
      };
    }
    throw new Error('Invalid response format from Hunyuan API');
  }
}
```

---

## 6. 新的数据结构设计

### 6.1 扩展的大模型配置结构

```javascript
{
  id: "unique-id",
  name: "配置名称",
  modelType: "Qwen|DeepSeek|Volces|Kimi|Hunyuan",
  apiKey: "加密后的API密钥",
  baseUrl: "API基础URL",
  modelEndpoint: "模型端点",
  // V2新增字段
  temperature: 0.7,              // 模型温度参数
  maxTokens: 1024,               // 最大生成token数
  topP: 0.9,                     // 核采样参数
  frequencyPenalty: 0.0,         // 频率惩罚
  presencePenalty: 0.0,          // 存在惩罚
  systemPrompt: "系统提示词",     // 系统级提示词
  active: true,                  // 配置是否激活
  priority: 1,                   // 配置优先级
  tags: ["标签1", "标签2"],       // 配置标签
  usage: {                       // 使用统计
    totalCalls: 0,
    totalTokens: 0,
    lastUsed: "最后使用时间"
  },
  createdAt: "创建时间",
  updatedAt: "更新时间",
  // 同步相关字段
  syncStatus: "pending|syncing|success|failed",
  lastSyncTime: "最后同步时间",
  syncTarget: "目标多维表格配置ID"
}
```

### 6.2 多维表格配置结构

```javascript
{
  id: "unique-id",
  name: "配置名称",
  platform: "feishu|dingtalk|wework",
  appId: "应用ID",
  appSecret: "加密后的应用密钥",
  tableToken: "表格Token",
  baseUrl: "API基础URL",
  // V2新增字段
  tableId: "表格ID",
  viewId: "视图ID",
  permissions: {                 // 权限配置
    read: true,
    write: true,
    delete: false
  },
  rateLimits: {                  // 速率限制
    requestsPerMinute: 60,
    requestsPerHour: 1000
  },
  active: true,
  priority: 1,
  tags: ["标签1", "标签2"],
  usage: {                       // 使用统计
    totalSyncs: 0,
    totalRecords: 0,
    lastUsed: "最后使用时间"
  },
  createdAt: "创建时间",
  updatedAt: "更新时间"
}
```

### 6.3 增强的改写记录结构

```javascript
{
  id: "unique-id",
  name: "改写工作名称",
  originalText: "原始文本",
  rewritePrompt: "改写提示词",
  rewriteResult: "改写结果",
  modelConfigId: "使用的大模型配置ID",
  sourceUrl: "原文所属网页URL",
  sourceTitle: "原文所属网页标题",
  // V2新增字段
  category: "改写类别",           // 如：正式化、简化、翻译等
  quality: {                     // 质量评估
    score: 0.85,                 // 质量分数
    feedback: "用户反馈",
    metrics: {                   // 质量指标
      fluency: 0.9,
      accuracy: 0.8,
      creativity: 0.7
    }
  },
  performance: {                 // 性能指标
    processingTime: 2.5,         // 处理时间(秒)
    tokenUsage: {
      input: 150,
      output: 200,
      total: 350
    }
  },
  tags: ["标签1", "标签2"],
  status: "draft|completed|archived",
  version: 1,                    // 版本号
  history: [                     // 历史版本
    {
      version: 1,
      rewriteResult: "历史结果",
      timestamp: "时间戳"
    }
  ],
  createdAt: "创建时间",
  updatedAt: "更新时间",
  // 同步相关字段
  syncStatus: "pending|syncing|success|failed",
  lastSyncTime: "最后同步时间",
  syncTarget: "目标多维表格配置ID"
}
```

---

## 7. 安全性和性能优化方案

### 7.1 安全性增强

#### 7.1.1 数据加密升级
```javascript
class SecurityManager {
  constructor() {
    this.encryptionKey = this.generateEncryptionKey();
  }

  // AES-256加密
  encrypt(data) {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // AES-256解密
  decrypt(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  // 敏感数据脱敏
  maskSensitiveData(data) {
    const masked = { ...data };
    if (masked.apiKey) {
      masked.apiKey = masked.apiKey.substring(0, 8) + '***';
    }
    if (masked.appSecret) {
      masked.appSecret = masked.appSecret.substring(0, 8) + '***';
    }
    return masked;
  }
}
```

#### 7.1.2 权限控制
```javascript
class PermissionManager {
  // 检查操作权限
  checkPermission(operation, resourceType, resourceId) {
    const permissions = this.getUserPermissions();
    return permissions[resourceType]?.[operation] === true;
  }

  // 数据访问控制
  filterDataByPermission(data, operation) {
    return data.filter(item => 
      this.checkPermission(operation, item.type, item.id)
    );
  }
}
```

### 7.2 性能优化

#### 7.2.1 缓存策略
```javascript
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟
  }

  // 多级缓存
  async get(key, fetchFunction) {
    // L1: 内存缓存
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    // L2: Chrome Storage缓存
    const storageData = await chrome.storage.local.get(key);
    if (storageData[key]) {
      this.cache.set(key, {
        data: storageData[key],
        timestamp: Date.now()
      });
      return storageData[key];
    }

    // L3: 远程获取
    const data = await fetchFunction();
    this.set(key, data);
    return data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    chrome.storage.local.set({ [key]: data });
  }
}
```

#### 7.2.2 批量操作优化
```javascript
class BatchProcessor {
  constructor() {
    this.batchSize = 10;
    this.batchDelay = 100; // ms
  }

  // 批量同步
  async batchSync(records, targetConfig) {
    const batches = this.createBatches(records, this.batchSize);
    const results = [];

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(record => this.syncSingleRecord(record, targetConfig))
      );
      results.push(...batchResults);
      
      // 批次间延迟，避免API限流
      await this.delay(this.batchDelay);
    }

    return results;
  }

  createBatches(array, size) {
    const batches = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 7.2.3 连接池管理
```javascript
class ConnectionPool {
  constructor() {
    this.pools = new Map();
    this.maxConnections = 5;
  }

  async getConnection(platform) {
    if (!this.pools.has(platform)) {
      this.pools.set(platform, {
        active: 0,
        queue: []
      });
    }

    const pool = this.pools.get(platform);
    
    if (pool.active < this.maxConnections) {
      pool.active++;
      return this.createConnection(platform);
    }

    // 等待可用连接
    return new Promise((resolve) => {
      pool.queue.push(resolve);
    });
  }

  releaseConnection(platform) {
    const pool = this.pools.get(platform);
    pool.active--;
    
    if (pool.queue.length > 0) {
      const resolve = pool.queue.shift();
      pool.active++;
      resolve(this.createConnection(platform));
    }
  }
}
```

---

## 8. 详细的技术实现方案

### 8.1 项目结构升级

```
FlowFocus_V2/
├── dist/                           # 构建输出目录
├── src/                            # 源代码目录
│   ├── sidebar/                    # 侧边栏相关代码
│   │   ├── html/                   # HTML 模板
│   │   ├── css/                    # 样式文件
│   │   └── js/                     # JavaScript 逻辑
│   ├── background/                 # 后台服务
│   ├── content/                    # 内容脚本
│   ├── services/                   # 服务层
│   │   ├── modelService.js         # 大模型服务
│   │   ├── tableService.js         # 多维表格服务 (NEW)
│   │   ├── syncService.js          # 同步服务 (NEW)
│   │   └── storageService.js       # 存储服务
│   ├── adapters/                   # 适配器层 (NEW)
│   │   ├── models/                 # 模型适配器
│   │   │   ├── qwenAdapter.js
│   │   │   ├── deepseekAdapter.js
│   │   │   ├── volcesAdapter.js    # (NEW)
│   │   │   ├── hunyuanAdapter.js   # (NEW)
│   │   │   └── kimiAdapter.js      # (NEW)
│   │   └── tables/                 # 表格适配器
│   │       ├── feishuAdapter.js    # (NEW)
│   │       ├── dingtalkAdapter.js  # (NEW)
│   │       └── weworkAdapter.js    # (NEW)
│   ├── mappers/                    # 数据映射层 (NEW)
│   │   ├── dataMapper.js
│   │   └── schemaValidator.js
│   ├── managers/                   # 管理器层 (NEW)
│   │   ├── cacheManager.js
│   │   ├── securityManager.js
│   │   └── permissionManager.js
│   └── utils/                      # 工具函数
│       ├── encryption.js           # 加密工具
│       ├── retry.js               # 重试机制
│       ├── batchProcessor.js      # 批量处理 (NEW)
│       └── connectionPool.js      # 连接池 (NEW)
├── icons/                          # 插件图标
├── manifest.json                   # 插件配置文件
├── FlowFocus需求分析V2.MD          # V2需求文档
├── FlowFocus架构设计V2.MD          # V2架构设计文档
└── README.md                       # 项目说明
```

### 8.2 核心模块实现

#### 8.2.1 多维表格服务实现

```javascript
// src/services/tableService.js
class TableService {
  constructor() {
    this.adapters = {
      'feishu': new FeishuAdapter(),
      'dingtalk': new DingtalkAdapter(),
      'wework': new WeworkAdapter()
    };
    this.dataMapper = new DataMapper();
  }

  async syncRecord(record, tableConfig) {
    try {
      const adapter = this.adapters[tableConfig.platform];
      const mappedData = this.dataMapper.serializeForTable(record, record.type);
      
      const result = await adapter.createOrUpdateRecord(
        tableConfig,
        mappedData
      );
      
      return {
        success: true,
        recordId: result.recordId,
        syncTime: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        syncTime: new Date().toISOString()
      };
    }
  }

  async batchSync(records, tableConfig) {
    const batchProcessor = new BatchProcessor();
    return await batchProcessor.batchSync(records, tableConfig);
  }

  async testConnection(tableConfig) {
    const adapter = this.adapters[tableConfig.platform];
    return await adapter.testConnection(tableConfig);
  }
}
```

#### 8.2.2 数据同步引擎实现

```javascript
// src/services/syncService.js
class SyncService {
  constructor() {
    this.tableService = new TableService();
    this.storageService = new StorageService();
    this.syncQueue = [];
    this.isProcessing = false;
  }

  async queueSync(recordId, recordType, targetTableId) {
    const syncTask = {
      id: this.generateTaskId(),
      recordId,
      recordType,
      targetTableId,
      status: 'queued',
      createdAt: new Date().toISOString()
    };

    this.syncQueue.push(syncTask);
    this.processSyncQueue();
    
    return syncTask.id;
  }

  async processSyncQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.syncQueue.length > 0) {
      const task = this.syncQueue.shift();
      await this.processSyncTask(task);
    }
    
    this.isProcessing = false;
  }

  async processSyncTask(task) {
    try {
      task.status = 'processing';
      
      // 获取记录数据
      const record = await this.storageService.getRecord(
        task.recordType, 
        task.recordId
      );
      
      // 获取目标表格配置
      const tableConfig = await this.storageService.getTableConfig(
        task.targetTableId
      );
      
      // 执行同步
      const result = await this.tableService.syncRecord(record, tableConfig);
      
      if (result.success) {
        task.status = 'completed';
        // 更新记录的同步状态
        await this.updateRecordSyncStatus(
          task.recordType,
          task.recordId,
          'success',
          result.syncTime
        );
      } else {
        task.status = 'failed';
        task.error = result.error;
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }
  }

  async updateRecordSyncStatus(recordType, recordId, status, syncTime) {
    const record = await this.storageService.getRecord(recordType, recordId);
    record.syncStatus = status;
    record.lastSyncTime = syncTime;
    await this.storageService.saveRecord(recordType, record);
  }
}
```

#### 8.2.3 前端界面增强

```javascript
// src/sidebar/js/tableConfigTab.js
class TableConfigTab {
  constructor() {
    this.tableService = new TableService();
    this.syncService = new SyncService();
    this.initEventListeners();
  }

  initEventListeners() {
    // 保存配置
    document.getElementById('saveTableConfig').addEventListener('click', 
      () => this.saveTableConfig()
    );
    
    // 测试连接
    document.getElementById('testTableConnection').addEventListener('click', 
      () => this.testConnection()
    );
    
    // 批量同步
    document.getElementById('batchSyncConfigs').addEventListener('click', 
      () => this.batchSyncConfigs()
    );
  }

  async saveTableConfig() {
    const config = this.getFormData();
    
    try {
      await this.storageService.saveTableConfig(config);
      this.showSuccess('配置保存成功');
      this.refreshConfigList();
    } catch (error) {
      this.showError('配置保存失败: ' + error.message);
    }
  }

  async testConnection() {
    const config = this.getFormData();
    
    try {
      this.showLoading('正在测试连接...');
      const result = await this.tableService.testConnection(config);
      
      if (result.success) {
        this.showSuccess('连接测试成功');
      } else {
        this.showError('连接测试失败: ' + result.error);
      }
    } catch (error) {
      this.showError('连接测试失败: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  async batchSyncConfigs() {
    const selectedConfigs = this.getSelectedConfigs();
    
    if (selectedConfigs.length === 0) {
      this.showWarning('请选择要同步的配置');
      return;
    }

    try {
      this.showLoading('正在批量同步...');
      
      for (const config of selectedConfigs) {
        await this.syncService.queueSync(
          config.id, 
          'tableConfig', 
          this.getTargetTableId()
        );
      }
      
      this.showSuccess(`已提交 ${selectedConfigs.length} 个配置的同步任务`);
    } catch (error) {
      this.showError('批量同步失败: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }
}
```

### 8.3 部署和构建

#### 8.3.1 Webpack配置升级

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  entry: {
    background: './src/background/background.js',
    sidebar: './src/sidebar/js/sidebar.js',
    content: './src/content/content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@adapters': path.resolve(__dirname, 'src/adapters'),
      '@mappers': path.resolve(__dirname, 'src/mappers'),
      '@managers': path.resolve(__dirname, 'src/managers'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

#### 8.3.2 Manifest V3配置

```json
{
  "manifest_version": 3,
  "name": "FlowFocus V2.0",
  "version": "2.0.0",
  "description": "AI-powered text rewriting with multi-dimensional table integration",
  "permissions": [
    "storage",
    "activeTab",
    "sidePanel",
    "scripting"
  ],
  "host_permissions": [
    "https://dashscope.aliyuncs.com/*",
    "https://api.deepseek.com/*",
    "https://ark.cn-beijing.volces.com/*",
    "https://api.moonshot.cn/*",
    "https://api.hunyuan.cloud.tencent.com/*",
    "https://open.feishu.cn/*",
    "https://oapi.dingtalk.com/*",
    "https://qyapi.weixin.qq.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "side_panel": {
    "default_path": "sidebar.html"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "action": {
    "default_title": "FlowFocus V2.0",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

---

## 9. 测试和质量保证

### 9.1 测试策略

#### 9.1.1 单元测试
- 数据映射层测试
- 适配器功能测试
- 同步引擎测试
- 安全管理器测试

#### 9.1.2 集成测试
- 多维表格API集成测试
- 大模型API集成测试
- 端到端同步流程测试

#### 9.1.3 性能测试
- 批量同步性能测试
- 缓存效率测试
- 内存使用测试

### 9.2 监控和日志

```javascript
// src/utils/logger.js
class Logger {
  constructor() {
    this.logLevel = 'INFO';
  }

  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source: 'FlowFocus-V2'
    };

    console.log(JSON.stringify(logEntry));
    
    // 存储关键日志到本地
    if (level === 'ERROR' || level === 'WARN') {
      this.persistLog(logEntry);
    }
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  debug(message, data) {
    this.log('DEBUG', message, data);
  }
}
```

---

## 10. 版本迁移和兼容性

### 10.1 数据迁移策略

```javascript
// src/utils/migrator.js
class DataMigrator {
  async migrateFromV1() {
    const v1Data = await this.getV1Data();
    
    // 迁移大模型配置
    const migratedModelConfigs = v1Data.modelConfigs.map(config => {
      return {
        ...config,
        // V2新增字段的默认值
        temperature: 0.7,
        maxTokens: 1024,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        systemPrompt: '',
        priority: 1,
        tags: [],
        usage: {
          totalCalls: 0,
          totalTokens: 0,
          lastUsed: null
        },
        syncStatus: 'pending',
        lastSyncTime: null,
        syncTarget: null
      };
    });

    // 迁移改写记录
    const migratedRewriteRecords = v1Data.rewriteRecords.map(record => {
      return {
        ...record,
        // V2新增字段的默认值
        category: '通用改写',
        quality: {
          score: null,
          feedback: '',
          metrics: {
            fluency: null,
            accuracy: null,
            creativity: null
          }
        },
        performance: {
          processingTime: null,
          tokenUsage: {
            input: null,
            output: null,
            total: null
          }
        },
        tags: [],
        status: 'completed',
        version: 1,
        history: [],
        syncStatus: 'pending',
        lastSyncTime: null,
        syncTarget: null
      };
    });

    // 保存迁移后的数据
    await this.saveV2Data({
      modelConfigs: migratedModelConfigs,
      rewriteRecords: migratedRewriteRecords,
      tableConfigs: [], // V2新增
      migrationInfo: {
        fromVersion: '1.0',
        toVersion: '2.0',
        migratedAt: new Date().toISOString()
      }
    });
  }
}
```

---

**文档维护**: 本文档记录FlowFocus V2.0版本的完整技术架构设计，包含所有新增功能和技术实现细节。后续版本更新时需同步更新此文档。

**更新日志**:
- 2025年9月: 创建V2.0架构设计文档
- 新增多维表格集成服务架构
- 新增数据同步引擎设计
- 新增JSON数据映射层架构
- 扩展大模型支持(Volces、Kimi、Hunyuan)
- 增强安全性和性能优化方案
- 完善技术实现方案和部署策略
