/**
 * 增强改写服务
 * 支持5种大模型的智能文本改写功能
 * 包含质量评估、风格适配、批量处理等高级功能
 */

import modelService from './modelService.js';
import modelConfigManager from './modelConfigManager.js';
import performanceMonitor from './performanceMonitor.js';
import { RewriteRecord } from '../models/recordModels.js';
import { RECORD_CATEGORIES, QUALITY_RATINGS } from '../utils/constants.js';

class EnhancedRewriteService {
  constructor() {
    this.rewriteHistory = new Map();
    this.qualityThresholds = {
      minLength: 10,
      maxLength: 10000,
      qualityScore: 3 // 最低质量分数
    };
    
    // 预设改写模板
    this.rewriteTemplates = {
      'formal': {
        name: '正式化',
        prompt: '请将以下文本改写为更加正式、专业的表达方式，保持原意不变：',
        category: RECORD_CATEGORIES.BUSINESS
      },
      'casual': {
        name: '口语化',
        prompt: '请将以下文本改写为更加轻松、口语化的表达方式，保持原意不变：',
        category: RECORD_CATEGORIES.GENERAL
      },
      'academic': {
        name: '学术化',
        prompt: '请将以下文本改写为学术论文风格，使用更加严谨、准确的表达：',
        category: RECORD_CATEGORIES.ACADEMIC
      },
      'creative': {
        name: '创意化',
        prompt: '请将以下文本进行创意改写，使其更加生动有趣，富有表现力：',
        category: RECORD_CATEGORIES.CREATIVE
      },
      'concise': {
        name: '简洁化',
        prompt: '请将以下文本改写得更加简洁明了，去除冗余表达，保留核心信息：',
        category: RECORD_CATEGORIES.GENERAL
      },
      'detailed': {
        name: '详细化',
        prompt: '请将以下文本进行详细扩展，增加更多描述和解释，使内容更加丰富：',
        category: RECORD_CATEGORIES.GENERAL
      },
      'technical': {
        name: '技术化',
        prompt: '请将以下文本改写为技术文档风格，使用准确的技术术语和规范表达：',
        category: RECORD_CATEGORIES.TECHNICAL
      },
      'marketing': {
        name: '营销化',
        prompt: '请将以下文本改写为营销推广风格，使其更具吸引力和说服力：',
        category: RECORD_CATEGORIES.MARKETING
      }
    };
    
    // 模型特性配置
    this.modelCapabilities = {
      'qwen': {
        strengths: ['中文理解', '逻辑推理', '多轮对话'],
        bestFor: ['general', 'formal', 'academic'],
        temperature: { creative: 0.8, formal: 0.3, balanced: 0.7 }
      },
      'deepseek': {
        strengths: ['代码理解', '技术文档', '逻辑分析'],
        bestFor: ['technical', 'academic', 'concise'],
        temperature: { creative: 0.6, formal: 0.2, balanced: 0.5 }
      },
      'volces': {
        strengths: ['中文优化', '内容创作', '风格转换'],
        bestFor: ['creative', 'casual', 'marketing'],
        temperature: { creative: 0.9, formal: 0.4, balanced: 0.7 }
      },
      'kimi': {
        strengths: ['长文本处理', '文档理解', '创意写作'],
        bestFor: ['detailed', 'creative', 'academic'],
        temperature: { creative: 0.8, formal: 0.4, balanced: 0.6 }
      },
      'hunyuan': {
        strengths: ['中文表达', '多场景适配', '智能问答'],
        bestFor: ['formal', 'casual', 'general'],
        temperature: { creative: 0.8, formal: 0.5, balanced: 0.7 }
      }
    };
  }

  /**
   * 智能改写文本
   * @param {string} text - 原始文本
   * @param {string} style - 改写风格
   * @param {Object} options - 改写选项
   * @returns {Promise<Object>} 改写结果
   */
  async rewriteText(text, style = 'general', options = {}) {
    const timerId = performanceMonitor.startTiming('EnhancedRewriteService.rewriteText');
    
    try {
      // 验证输入
      const validation = this.validateInput(text, style);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      // 获取最佳模型配置
      const modelConfig = await this.selectBestModel(style, text.length, options.preferredModel);
      if (!modelConfig) {
        throw new Error('没有可用的模型配置');
      }
      
      // 构建改写提示
      const prompt = this.buildRewritePrompt(style, options.customPrompt);
      
      // 优化模型参数
      const modelOptions = this.optimizeModelParameters(modelConfig.type, style, text.length);
      
      // 执行改写
      const rewriteResult = await modelService.rewriteText(
        modelConfig.toStorageFormat(),
        text,
        prompt,
        modelOptions
      );
      
      if (!rewriteResult.success) {
        throw new Error(rewriteResult.error || '改写失败');
      }
      
      // 质量评估
      const qualityAssessment = await this.assessQuality(
        text,
        rewriteResult.data,
        style,
        modelConfig.type
      );
      
      // 创建改写记录
      const record = new RewriteRecord({
        originalText: text,
        rewrittenText: rewriteResult.data,
        style,
        modelType: modelConfig.type,
        modelName: modelConfig.name,
        category: this.rewriteTemplates[style]?.category || RECORD_CATEGORIES.GENERAL,
        qualityRating: qualityAssessment.rating,
        qualityScore: qualityAssessment.score,
        metadata: {
          prompt,
          modelOptions,
          usage: rewriteResult.usage,
          duration: Date.now() - timerId,
          qualityDetails: qualityAssessment.details
        }
      });
      
      // 缓存结果
      this.rewriteHistory.set(record.id, record);
      
      performanceMonitor.endTiming(timerId, true, {
        textLength: text.length,
        style,
        modelType: modelConfig.type,
        qualityRating: qualityAssessment.rating
      });
      
      performanceMonitor.log('info', 'EnhancedRewriteService', '文本改写成功', {
        recordId: record.id,
        style,
        modelType: modelConfig.type,
        qualityRating: qualityAssessment.rating,
        originalLength: text.length,
        rewrittenLength: rewriteResult.data.length
      });
      
      return {
        success: true,
        record,
        result: rewriteResult.data,
        quality: qualityAssessment,
        model: {
          type: modelConfig.type,
          name: modelConfig.name
        },
        usage: rewriteResult.usage
      };
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'EnhancedRewriteService.rewriteText');
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量改写
   * @param {Array<Object>} texts - 文本数组
   * @param {string} style - 改写风格
   * @param {Object} options - 改写选项
   * @returns {Promise<Object>} 批量改写结果
   */
  async batchRewrite(texts, style = 'general', options = {}) {
    const timerId = performanceMonitor.startTiming('EnhancedRewriteService.batchRewrite');
    
    try {
      const results = {
        total: texts.length,
        success: 0,
        failed: 0,
        results: [],
        errors: []
      };
      
      const batchSize = options.batchSize || 5;
      const concurrentLimit = options.concurrentLimit || 3;
      
      // 分批处理
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        // 并发处理当前批次
        const batchPromises = [];
        for (let j = 0; j < batch.length; j += concurrentLimit) {
          const concurrentBatch = batch.slice(j, j + concurrentLimit);
          const concurrentPromise = Promise.allSettled(
            concurrentBatch.map(textItem => 
              this.rewriteText(textItem.text || textItem, style, {
                ...options,
                id: textItem.id
              })
            )
          );
          batchPromises.push(concurrentPromise);
        }
        
        // 等待当前批次完成
        const batchResults = await Promise.all(batchPromises);
        
        // 处理批次结果
        for (const concurrentResults of batchResults) {
          for (const result of concurrentResults) {
            if (result.status === 'fulfilled' && result.value.success) {
              results.success++;
              results.results.push(result.value);
            } else {
              results.failed++;
              const error = result.status === 'fulfilled' 
                ? result.value.error 
                : result.reason.message;
              results.errors.push(error);
            }
          }
        }
        
        // 批次间延迟
        if (i + batchSize < texts.length) {
          await this.delay(options.delay || 200);
        }
      }
      
      performanceMonitor.endTiming(timerId, true, results);
      performanceMonitor.log('info', 'EnhancedRewriteService', '批量改写完成', results);
      
      return results;
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'EnhancedRewriteService.batchRewrite');
      throw error;
    }
  }

  /**
   * 多模型对比改写
   * @param {string} text - 原始文本
   * @param {string} style - 改写风格
   * @param {Array<string>} modelTypes - 模型类型数组
   * @returns {Promise<Object>} 对比结果
   */
  async compareModels(text, style = 'general', modelTypes = null) {
    const timerId = performanceMonitor.startTiming('EnhancedRewriteService.compareModels');
    
    try {
      // 获取要对比的模型
      const availableModels = modelConfigManager.getAllConfigs()
        .filter(config => !modelTypes || modelTypes.includes(config.type));
      
      if (availableModels.length === 0) {
        throw new Error('没有可用的模型进行对比');
      }
      
      // 并发执行改写
      const promises = availableModels.map(async (config) => {
        try {
          const result = await this.rewriteText(text, style, {
            preferredModel: config.type
          });
          
          return {
            modelType: config.type,
            modelName: config.name,
            success: result.success,
            result: result.success ? result.result : null,
            quality: result.success ? result.quality : null,
            usage: result.success ? result.usage : null,
            error: result.success ? null : result.error
          };
        } catch (error) {
          return {
            modelType: config.type,
            modelName: config.name,
            success: false,
            error: error.message
          };
        }
      });
      
      const results = await Promise.allSettled(promises);
      
      // 处理结果
      const comparison = {
        originalText: text,
        style,
        models: results.map(result => 
          result.status === 'fulfilled' ? result.value : {
            success: false,
            error: result.reason.message
          }
        ),
        summary: this.generateComparisonSummary(results)
      };
      
      performanceMonitor.endTiming(timerId, true, {
        modelsCompared: availableModels.length,
        successCount: comparison.summary.successCount
      });
      
      return comparison;
      
    } catch (error) {
      performanceMonitor.endTiming(timerId, false, { error: error.message });
      performanceMonitor.recordError(error, 'EnhancedRewriteService.compareModels');
      throw error;
    }
  }

  /**
   * 获取改写建议
   * @param {string} text - 原始文本
   * @returns {Object} 改写建议
   */
  getRewriteSuggestions(text) {
    const textLength = text.length;
    const suggestions = [];
    
    // 基于文本长度的建议
    if (textLength < 50) {
      suggestions.push({
        style: 'detailed',
        reason: '文本较短，建议详细化扩展',
        priority: 'high'
      });
    } else if (textLength > 500) {
      suggestions.push({
        style: 'concise',
        reason: '文本较长，建议简洁化处理',
        priority: 'medium'
      });
    }
    
    // 基于内容特征的建议
    const hasNumbers = /\d/.test(text);
    const hasTechnicalTerms = /\b(API|SDK|HTTP|JSON|XML|SQL)\b/i.test(text);
    const hasBusinessTerms = /\b(合同|协议|条款|责任|义务)\b/.test(text);
    
    if (hasTechnicalTerms) {
      suggestions.push({
        style: 'technical',
        reason: '检测到技术术语，建议技术化改写',
        priority: 'high',
        recommendedModel: 'deepseek'
      });
    }
    
    if (hasBusinessTerms) {
      suggestions.push({
        style: 'formal',
        reason: '检测到商务内容，建议正式化改写',
        priority: 'high'
      });
    }
    
    // 通用建议
    suggestions.push(
      {
        style: 'formal',
        reason: '适合商务场合使用',
        priority: 'medium'
      },
      {
        style: 'casual',
        reason: '适合日常交流使用',
        priority: 'medium'
      },
      {
        style: 'creative',
        reason: '增加文本表现力',
        priority: 'low'
      }
    );
    
    return {
      textAnalysis: {
        length: textLength,
        hasNumbers,
        hasTechnicalTerms,
        hasBusinessTerms
      },
      suggestions: suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    };
  }

  /**
   * 获取可用的改写风格
   * @returns {Array<Object>} 风格列表
   */
  getAvailableStyles() {
    return Object.entries(this.rewriteTemplates).map(([key, template]) => ({
      key,
      name: template.name,
      prompt: template.prompt,
      category: template.category
    }));
  }

  /**
   * 获取改写历史
   * @param {number} limit - 限制数量
   * @returns {Array<RewriteRecord>} 历史记录
   */
  getRewriteHistory(limit = 50) {
    const records = Array.from(this.rewriteHistory.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
    
    return records;
  }

  /**
   * 清理改写历史
   * @param {number} olderThanDays - 清理多少天前的记录
   */
  cleanupHistory(olderThanDays = 30) {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    for (const [id, record] of this.rewriteHistory.entries()) {
      if (new Date(record.createdAt).getTime() < cutoffTime) {
        this.rewriteHistory.delete(id);
      }
    }
  }

  // 私有方法
  validateInput(text, style) {
    if (!text || typeof text !== 'string') {
      return { isValid: false, error: '文本不能为空' };
    }
    
    if (text.length < this.qualityThresholds.minLength) {
      return { isValid: false, error: `文本长度不能少于${this.qualityThresholds.minLength}个字符` };
    }
    
    if (text.length > this.qualityThresholds.maxLength) {
      return { isValid: false, error: `文本长度不能超过${this.qualityThresholds.maxLength}个字符` };
    }
    
    if (style && !this.rewriteTemplates[style]) {
      return { isValid: false, error: `不支持的改写风格: ${style}` };
    }
    
    return { isValid: true };
  }

  async selectBestModel(style, textLength, preferredModel = null) {
    const availableConfigs = modelConfigManager.getAllConfigs();
    
    if (availableConfigs.length === 0) {
      return null;
    }
    
    // 如果指定了首选模型
    if (preferredModel) {
      const preferredConfig = availableConfigs.find(config => config.type === preferredModel);
      if (preferredConfig) {
        return preferredConfig;
      }
    }
    
    // 根据风格和模型能力选择最佳模型
    const scoredConfigs = availableConfigs.map(config => {
      const capabilities = this.modelCapabilities[config.type] || {};
      let score = 0;
      
      // 基于模型擅长领域评分
      if (capabilities.bestFor && capabilities.bestFor.includes(style)) {
        score += 10;
      }
      
      // 基于文本长度评分
      if (config.type === 'kimi' && textLength > 1000) {
        score += 5; // Kimi擅长长文本
      }
      
      // 基于模型特性评分
      if (capabilities.strengths) {
        if (style === 'technical' && capabilities.strengths.includes('技术文档')) {
          score += 8;
        }
        if (style === 'creative' && capabilities.strengths.includes('内容创作')) {
          score += 8;
        }
      }
      
      return { config, score };
    });
    
    // 返回得分最高的配置
    scoredConfigs.sort((a, b) => b.score - a.score);
    return scoredConfigs[0].config;
  }

  buildRewritePrompt(style, customPrompt = null) {
    if (customPrompt) {
      return customPrompt;
    }
    
    const template = this.rewriteTemplates[style];
    return template ? template.prompt : '请改写以下文本，保持原意不变：';
  }

  optimizeModelParameters(modelType, style, textLength) {
    const capabilities = this.modelCapabilities[modelType] || {};
    const temperatures = capabilities.temperature || { creative: 0.7, formal: 0.3, balanced: 0.5 };
    
    let temperature;
    if (style === 'creative' || style === 'casual') {
      temperature = temperatures.creative;
    } else if (style === 'formal' || style === 'academic' || style === 'technical') {
      temperature = temperatures.formal;
    } else {
      temperature = temperatures.balanced;
    }
    
    // 基于文本长度调整maxTokens
    const maxTokens = Math.min(Math.max(textLength * 1.5, 500), 4000);
    
    return {
      temperature,
      maxTokens,
      topP: 0.9
    };
  }

  async assessQuality(originalText, rewrittenText, style, modelType) {
    // 简化的质量评估算法
    let score = 5; // 基础分数
    const details = [];
    
    // 长度变化评估
    const lengthRatio = rewrittenText.length / originalText.length;
    if (style === 'concise' && lengthRatio > 0.8) {
      score -= 1;
      details.push('简洁化效果不明显');
    } else if (style === 'detailed' && lengthRatio < 1.2) {
      score -= 1;
      details.push('详细化扩展不足');
    }
    
    // 相似度检查（避免过度相似）
    const similarity = this.calculateSimilarity(originalText, rewrittenText);
    if (similarity > 0.9) {
      score -= 2;
      details.push('改写程度不足');
    } else if (similarity < 0.3) {
      score -= 1;
      details.push('改写可能偏离原意');
    }
    
    // 确保分数在有效范围内
    score = Math.max(1, Math.min(5, score));
    
    return {
      score,
      rating: this.scoreToRating(score),
      details,
      similarity,
      lengthRatio
    };
  }

  calculateSimilarity(text1, text2) {
    // 简化的相似度计算
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  scoreToRating(score) {
    if (score >= 4.5) return QUALITY_RATINGS.EXCELLENT;
    if (score >= 3.5) return QUALITY_RATINGS.VERY_GOOD;
    if (score >= 2.5) return QUALITY_RATINGS.GOOD;
    if (score >= 1.5) return QUALITY_RATINGS.FAIR;
    return QUALITY_RATINGS.POOR;
  }

  generateComparisonSummary(results) {
    const successResults = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => r.value);
    
    const summary = {
      totalModels: results.length,
      successCount: successResults.length,
      failedCount: results.length - successResults.length
    };
    
    if (successResults.length > 0) {
      // 找出质量最高的结果
      const bestResult = successResults.reduce((best, current) => 
        (current.quality?.score || 0) > (best.quality?.score || 0) ? current : best
      );
      
      summary.bestModel = {
        type: bestResult.modelType,
        name: bestResult.modelName,
        qualityScore: bestResult.quality?.score
      };
      
      // 平均质量分数
      const avgQuality = successResults.reduce((sum, r) => sum + (r.quality?.score || 0), 0) / successResults.length;
      summary.averageQuality = avgQuality;
    }
    
    return summary;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建全局实例
const enhancedRewriteService = new EnhancedRewriteService();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnhancedRewriteService, enhancedRewriteService };
} else {
  window.EnhancedRewriteService = EnhancedRewriteService;
  window.enhancedRewriteService = enhancedRewriteService;
}

export { EnhancedRewriteService, enhancedRewriteService };
export default enhancedRewriteService;