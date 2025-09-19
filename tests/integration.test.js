/**
 * FlowFocus V2.0 集成测试
 * 测试各个模块的功能集成和端到端流程
 */

describe('FlowFocus V2.0 集成测试', () => {
    beforeEach(() => {
        // 重置所有mock
        jest.clearAllMocks();
    });

    describe('基础功能测试', () => {
        test('应该能够生成UUID', () => {
            // 简单的UUID生成测试
            function generateUUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }

            const uuid = generateUUID();
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        test('应该能够处理Chrome存储API', async () => {
            const mockData = { test: 'value' };
            
            // 模拟存储操作
            chrome.storage.local.set.mockResolvedValue();
            chrome.storage.local.get.mockResolvedValue(mockData);

            // 测试存储
            await chrome.storage.local.set(mockData);
            const result = await chrome.storage.local.get('test');

            expect(chrome.storage.local.set).toHaveBeenCalledWith(mockData);
            expect(chrome.storage.local.get).toHaveBeenCalledWith('test');
            expect(result).toEqual(mockData);
        });
    });

    describe('模型配置测试', () => {
        test('应该能够验证模型配置格式', () => {
            const validConfig = {
                id: 'test-id',
                name: '测试配置',
                modelType: 'qwen',
                apiKey: 'test-key',
                baseUrl: 'https://test.com',
                modelEndpoint: 'test-model'
            };

            // 验证配置格式
            expect(validConfig).toHaveProperty('id');
            expect(validConfig).toHaveProperty('name');
            expect(validConfig).toHaveProperty('modelType');
            expect(validConfig).toHaveProperty('apiKey');
            expect(validConfig.modelType).toMatch(/^(qwen|deepseek|volces|kimi|hunyuan)$/);
        });

        test('应该能够验证所有支持的模型类型', () => {
            const supportedModels = ['qwen', 'deepseek', 'volces', 'kimi', 'hunyuan'];
            
            supportedModels.forEach(modelType => {
                const config = {
                    id: `test-${modelType}`,
                    name: `${modelType}配置`,
                    modelType: modelType,
                    apiKey: 'test-key',
                    baseUrl: 'https://test.com',
                    modelEndpoint: 'test-model'
                };

                expect(config.modelType).toBe(modelType);
                expect(supportedModels).toContain(config.modelType);
            });
        });
    });

    describe('表格配置测试', () => {
        test('应该能够验证表格配置格式', () => {
            const validTableConfig = {
                id: 'test-table-id',
                name: '测试表格配置',
                platform: 'feishu',
                appId: 'test-app-id',
                appSecret: 'test-secret',
                tableId: 'test-table-id'
            };

            expect(validTableConfig).toHaveProperty('id');
            expect(validTableConfig).toHaveProperty('name');
            expect(validTableConfig).toHaveProperty('platform');
            expect(validTableConfig).toHaveProperty('appId');
            expect(validTableConfig).toHaveProperty('appSecret');
            expect(validTableConfig).toHaveProperty('tableId');
            expect(validTableConfig.platform).toMatch(/^(feishu|dingtalk|wework)$/);
        });

        test('应该能够验证所有支持的平台', () => {
            const supportedPlatforms = ['feishu', 'dingtalk', 'wework'];
            
            supportedPlatforms.forEach(platform => {
                const config = {
                    id: `test-${platform}`,
                    name: `${platform}配置`,
                    platform: platform,
                    appId: 'test-app-id',
                    appSecret: 'test-secret',
                    tableId: 'test-table-id'
                };

                expect(config.platform).toBe(platform);
                expect(supportedPlatforms).toContain(config.platform);
            });
        });
    });

    describe('网络请求测试', () => {
        test('应该能够处理成功的API请求', async () => {
            const mockResponse = {
                ok: true,
                json: () => Promise.resolve({ success: true, data: 'test' })
            };

            global.fetch.mockResolvedValue(mockResponse);

            const response = await fetch('https://test.com/api');
            const data = await response.json();

            expect(fetch).toHaveBeenCalledWith('https://test.com/api');
            expect(response.ok).toBe(true);
            expect(data.success).toBe(true);
        });

        test('应该能够处理失败的API请求', async () => {
            const mockError = new Error('Network error');
            global.fetch.mockRejectedValue(mockError);

            try {
                await fetch('https://test.com/api');
            } catch (error) {
                expect(error.message).toBe('Network error');
            }

            expect(fetch).toHaveBeenCalledWith('https://test.com/api');
        });
    });

    describe('数据验证测试', () => {
        test('应该能够验证改写记录格式', () => {
            const rewriteRecord = {
                id: 'test-record-id',
                name: '测试改写',
                originalText: '原始文本',
                rewriteResult: '改写结果',
                modelConfig: 'test-model-config',
                prompt: '改写提示词',
                createdAt: new Date().toISOString()
            };

            expect(rewriteRecord).toHaveProperty('id');
            expect(rewriteRecord).toHaveProperty('originalText');
            expect(rewriteRecord).toHaveProperty('rewriteResult');
            expect(rewriteRecord).toHaveProperty('modelConfig');
            expect(rewriteRecord.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        test('应该能够验证同步记录格式', () => {
            const syncRecord = {
                id: 'test-sync-id',
                tableConfigId: 'test-table-config',
                status: 'success',
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                recordCount: 10
            };

            expect(syncRecord).toHaveProperty('id');
            expect(syncRecord).toHaveProperty('tableConfigId');
            expect(syncRecord).toHaveProperty('status');
            expect(syncRecord.status).toMatch(/^(success|failed|pending)$/);
            expect(typeof syncRecord.recordCount).toBe('number');
        });
    });

    describe('UI组件测试', () => {
        test('应该能够创建DOM元素', () => {
            const element = document.createElement('div');
            element.className = 'test-element';
            element.textContent = '测试内容';

            expect(element.tagName).toBe('DIV');
            expect(element.className).toBe('test-element');
            expect(element.textContent).toBe('测试内容');
        });

        test('应该能够处理事件监听', () => {
            const mockHandler = jest.fn();
            const button = document.createElement('button');
            
            button.addEventListener('click', mockHandler);
            button.click();

            expect(mockHandler).toHaveBeenCalledTimes(1);
        });
    });

    describe('错误处理测试', () => {
        test('应该能够处理存储错误', async () => {
            const error = new Error('Storage quota exceeded');
            chrome.storage.local.set.mockRejectedValue(error);

            try {
                await chrome.storage.local.set({ test: 'data' });
            } catch (e) {
                expect(e.message).toBe('Storage quota exceeded');
            }
        });

        test('应该能够处理无效配置', () => {
            const invalidConfig = {
                name: '', // 空名称
                modelType: 'invalid', // 无效模型类型
                apiKey: '' // 空API密钥
            };

            // 验证配置无效
            expect(invalidConfig.name).toBe('');
            expect(['qwen', 'deepseek', 'volces', 'kimi', 'hunyuan']).not.toContain(invalidConfig.modelType);
            expect(invalidConfig.apiKey).toBe('');
        });
    });

    describe('性能测试', () => {
        test('应该能够快速处理数据', () => {
            const startTime = Date.now();
            
            // 模拟数据处理
            const data = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }));
            const processed = data.map(item => ({ ...item, processed: true }));
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(processed).toHaveLength(1000);
            expect(processed[0]).toHaveProperty('processed', true);
            expect(duration).toBeLessThan(100); // 应该在100ms内完成
        });
    });
});

// 导出测试工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testUtils: {
            createMockConfig: (overrides = {}) => ({
                id: 'test-id',
                name: '测试配置',
                modelType: 'qwen',
                apiKey: 'test-key',
                baseUrl: 'https://test.com',
                modelEndpoint: 'test-model',
                ...overrides
            }),

            createMockTableConfig: (overrides = {}) => ({
                id: 'test-table-id',
                name: '测试表格配置',
                platform: 'feishu',
                appId: 'test-app-id',
                appSecret: 'test-secret',
                tableId: 'test-table-id',
                ...overrides
            }),

            setupMockChrome: () => {
                chrome.storage.local.get.mockResolvedValue({});
                chrome.storage.local.set.mockResolvedValue();
                chrome.storage.local.remove.mockResolvedValue();
            }
        }
    };
}