/**
 * 侧边栏JavaScript逻辑
 */
import storageService from '../services/storageService.js';
import modelService from '../services/modelService.js';
import { generateUUID } from '../utils/utils.js';

// 当前选中的标签页
let currentTab = 'modelConfig';

// 大模型默认配置
const MODEL_DEFAULTS = {
    'qwen': {
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        modelEndpoint: 'qwen-turbo'
    },
    'deepseek': {
        baseUrl: 'https://api.deepseek.com/v1',
        modelEndpoint: 'deepseek-chat'
    }
};

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签页
    initTabs();
    
    // 初始化大模型配置标签页
    initModelConfigTab();
    
    // 初始化改写功能标签页
    initRewriteTab();
    
    // 插件加载时填充默认值
    fillModelDefaults();
});

// 初始化标签页切换功能
function initTabs() {
    const modelConfigTab = document.getElementById('modelConfigTab');
    const rewriteTab = document.getElementById('rewriteTab');
    const modelConfigPanel = document.getElementById('modelConfigPanel');
    const rewritePanel = document.getElementById('rewritePanel');
    
    modelConfigTab.addEventListener('click', function() {
        currentTab = 'modelConfig';
        modelConfigTab.classList.add('active');
        rewriteTab.classList.remove('active');
        modelConfigPanel.classList.add('active');
        rewritePanel.classList.remove('active');
        // 标签页切换到大模型配置页面时填充默认值
        fillModelDefaults();
    });
    
    rewriteTab.addEventListener('click', function() {
        currentTab = 'rewrite';
        rewriteTab.classList.add('active');
        modelConfigTab.classList.remove('active');
        rewritePanel.classList.add('active');
        modelConfigPanel.classList.remove('active');
    });
}

// 初始化大模型配置标签页
function initModelConfigTab() {
    // 获取元素
    const modelType = document.getElementById('modelType');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    const selectAllConfigs = document.getElementById('selectAllConfigs');
    const deleteSelectedConfigsBtn = document.getElementById('deleteSelectedConfigsBtn');
    
    // 绑定事件
    modelType.addEventListener('change', fillModelDefaults); // 大模型下拉框选择变化时填充默认值
    saveConfigBtn.addEventListener('click', saveModelConfig);
    testConnectionBtn.addEventListener('click', testModelConnection);
    selectAllConfigs.addEventListener('change', toggleAllConfigs);
    deleteSelectedConfigsBtn.addEventListener('click', deleteSelectedConfigs);
    
    // 加载已保存的配置
    loadModelConfigs();
}

// 初始化改写功能标签页
function initRewriteTab() {
    // 获取元素
    const getSelectedTextBtn = document.getElementById('getSelectedTextBtn');
    const copyOriginalBtn = document.getElementById('copyOriginalBtn');
    const clearOriginalBtn = document.getElementById('clearOriginalBtn');
    const startRewriteBtn = document.getElementById('startRewriteBtn');
    const clearPromptBtn = document.getElementById('clearPromptBtn');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const saveResultBtn = document.getElementById('saveResultBtn');
    const selectAllRecords = document.getElementById('selectAllRecords');
    const deleteSelectedRecordsBtn = document.getElementById('deleteSelectedRecordsBtn');
    const rewritePrompt = document.getElementById('rewritePrompt');
    
    // 设置改写提示词文本框的默认值
    if (rewritePrompt && !rewritePrompt.value) {
        rewritePrompt.value = '将网页选中文字翻译成英文';
    }
    
    // 绑定事件
    getSelectedTextBtn.addEventListener('click', getSelectedText);
    copyOriginalBtn.addEventListener('click', copyOriginalText);
    clearOriginalBtn.addEventListener('click', clearOriginalText);
    startRewriteBtn.addEventListener('click', startRewrite);
    clearPromptBtn.addEventListener('click', clearRewritePrompt);
    copyResultBtn.addEventListener('click', copyRewriteResult);
    saveResultBtn.addEventListener('click', saveRewriteResult);
    selectAllRecords.addEventListener('change', toggleAllRecords);
    deleteSelectedRecordsBtn.addEventListener('click', deleteSelectedRecords);
    
    // 加载模型配置到下拉列表
    loadModelConfigsToSelect();
    
    // 加载改写历史记录
    loadRewriteHistory();
}

// 填充大模型默认值
function fillModelDefaults() {
    const modelType = document.getElementById('modelType').value;
    const configNameInput = document.getElementById('configName');
    const apiKeyInput = document.getElementById('apiKey');
    const baseUrlInput = document.getElementById('baseUrl');
    const modelEndpointInput = document.getElementById('modelEndpoint');
    
    // 获取当前选择的模型对应的默认值
    const defaults = MODEL_DEFAULTS[modelType];
    
    if (defaults) {
        // 清空所有相关输入框
        configNameInput.value = '';
        apiKeyInput.value = '';
        baseUrlInput.value = '';
        modelEndpointInput.value = '';
        
        // 填充默认值
        baseUrlInput.value = defaults.baseUrl;
        modelEndpointInput.value = defaults.modelEndpoint;
    }
}

// 退出编辑模式
function exitEditMode() {
    // 清空所有表单字段
    document.getElementById('configName').value = '';
    document.getElementById('apiKey').value = '';
    document.getElementById('baseUrl').value = '';
    document.getElementById('modelEndpoint').value = '';
    document.getElementById('configId').value = ''; // 清空配置ID，退出编辑模式
    
    // 重置模型类型选择并填充默认值
    document.getElementById('modelType').value = 'qwen'; // 重置为默认选项
    fillModelDefaults(); // 重新填充默认值
}

// 保存模型配置
async function saveModelConfig() {
    try {
        // 获取表单数据
        const configName = document.getElementById('configName').value;
        const modelType = document.getElementById('modelType').value;
        const apiKey = document.getElementById('apiKey').value;
        const baseUrl = document.getElementById('baseUrl').value;
        const modelEndpoint = document.getElementById('modelEndpoint').value;
        const configId = document.getElementById('configId').value; // 获取配置ID
        
        // 验证数据
        if (!configName) {
            showAlert('请输入配置名称', 'warning');
            return;
        }
        
        if (!apiKey) {
            showAlert('请输入API Key', 'warning');
            return;
        }
        
        let config;
        if (configId) {
            // 编辑模式：通过ID查找并更新配置
            const configs = await storageService.loadModelConfigs();
            const foundConfig = configs.find(c => c.id === configId);
            if (!foundConfig) {
                showAlert('未找到要编辑的配置', 'error');
                return;
            }
            // 更新配置信息
            foundConfig.name = configName;
            foundConfig.modelType = modelType;
            foundConfig.apiKey = apiKey;
            foundConfig.baseUrl = baseUrl;
            foundConfig.modelEndpoint = modelEndpoint;
            foundConfig.updatedAt = new Date().toISOString();
            config = foundConfig;
        } else {
            // 非编辑模式：检查是否存在同名配置
            const existingConfig = await storageService.getModelConfig(configName);
            if (existingConfig) {
                // 如果存在同名配置，询问用户是否覆盖
                if (!confirm(`已存在名为 "${configName}" 的配置，是否要覆盖？`)) {
                    return; // 用户选择不覆盖，放弃保存操作
                }
                // 用户选择覆盖，更新现有配置
                existingConfig.modelType = modelType;
                existingConfig.apiKey = apiKey;
                existingConfig.baseUrl = baseUrl;
                existingConfig.modelEndpoint = modelEndpoint;
                existingConfig.updatedAt = new Date().toISOString();
                config = existingConfig;
            } else {
                // 创建新配置对象
                config = {
                    id: generateUUID(),
                    name: configName,
                    modelType: modelType,
                    apiKey: apiKey, // 在实际应用中应该加密存储
                    baseUrl: baseUrl,
                    modelEndpoint: modelEndpoint,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
        }
        
        // 保存配置
        await storageService.saveModelConfig(config);
        
        showAlert('配置已保存', 'success');
        
        // 保存成功后，只清空configId字段退出编辑模式，保留表单内容
        document.getElementById('configId').value = '';
        
        // 重新加载配置列表
        loadModelConfigs();
        
        // 更新改写功能标签页的模型选择列表
        if (currentTab === 'rewrite') {
            loadModelConfigsToSelect();
        }
    } catch (error) {
        console.error('保存模型配置失败:', error);
        showAlert('保存配置失败: ' + error.message, 'error');
    }
}

// 测试模型连接
async function testModelConnection() {
    try {
        const modelType = document.getElementById('modelType').value;
        const apiKey = document.getElementById('apiKey').value;
        const baseUrl = document.getElementById('baseUrl').value;
        const modelEndpoint = document.getElementById('modelEndpoint').value;
        
        if (!apiKey) {
            showAlert('请填写API Key', 'warning');
            return;
        }
        
        // 创建配置对象
        const config = {
            modelType: modelType,
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        };
        
        // 显示测试中状态
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        const originalText = testConnectionBtn.textContent;
        testConnectionBtn.textContent = '测试中...';
        testConnectionBtn.disabled = true;
        
        // 测试连接
        const response = await modelService.testConnection(config);
        
        // 恢复按钮状态
        testConnectionBtn.textContent = originalText;
        testConnectionBtn.disabled = false;
        
        if (response.success) {
            showAlert('连接成功', 'success');
        } else {
            showAlert('连接失败: ' + response.error, 'error');
        }
    } catch (error) {
        // 恢复按钮状态
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        testConnectionBtn.textContent = '测试连接';
        testConnectionBtn.disabled = false;
        
        console.error('测试模型连接失败:', error);
        showAlert('测试连接失败: ' + error.message, 'error');
    }
}

// 加载模型配置
async function loadModelConfigs() {
    try {
        const configs = await storageService.loadModelConfigs();
        const configsList = document.getElementById('configsList');
        
        if (!configs || configs.length === 0) {
            configsList.innerHTML = '<div class="empty-message">暂无配置</div>';
            return;
        }
        
        // 渲染配置列表 - 只显示配置名称，复选框和名称在同一行
        configsList.innerHTML = configs.map(config => `
            <div class="config-item" data-id="${config.id}">
                <div class="config-info">
                    <label class="checkbox-label">
                        <input type="checkbox" class="config-checkbox" data-name="${config.name}">
                        <strong>${config.name}</strong>
                    </label>
                </div>
                <div class="config-actions">
                    <button class="edit-btn" data-name="${config.name}">编辑</button>
                    <button class="delete-btn" data-name="${config.name}">删除</button>
                </div>
            </div>
        `).join('');
        
        // 绑定编辑和删除按钮事件
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const configName = this.getAttribute('data-name');
                editModelConfig(configName);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const configName = this.getAttribute('data-name');
                deleteModelConfig(configName);
            });
        });
    } catch (error) {
        console.error('加载模型配置失败:', error);
        document.getElementById('configsList').innerHTML = '<div class="error-message">加载配置失败</div>';
    }
}

// 编辑模型配置
async function editModelConfig(configName) {
    try {
        const config = await storageService.getModelConfig(configName);
        if (!config) {
            showAlert('未找到配置', 'warning');
            return;
        }
        
        // 填充表单
        document.getElementById('configName').value = config.name;
        document.getElementById('modelType').value = config.modelType;
        document.getElementById('apiKey').value = config.apiKey;
        document.getElementById('baseUrl').value = config.baseUrl || '';
        document.getElementById('modelEndpoint').value = config.modelEndpoint || '';
        document.getElementById('configId').value = config.id; // 保存配置ID到隐藏字段
    } catch (error) {
        console.error('编辑模型配置失败:', error);
        showAlert('编辑配置失败: ' + error.message, 'error');
    }
}

// 删除模型配置
async function deleteModelConfig(configName) {
    if (!confirm(`确定要删除配置 "${configName}" 吗？`)) {
        return;
    }
    
    try {
        await storageService.deleteModelConfig(configName);
        showAlert('配置已删除', 'success');
        loadModelConfigs();
        
        // 如果当前在改写标签页，更新模型选择列表
        if (currentTab === 'rewrite') {
            loadModelConfigsToSelect();
        }
    } catch (error) {
        console.error('删除模型配置失败:', error);
        showAlert('删除配置失败: ' + error.message, 'error');
    }
}

// 切换所有配置选择状态
function toggleAllConfigs() {
    const checkboxes = document.querySelectorAll('#configsList .config-checkbox');
    const selectAll = document.getElementById('selectAllConfigs').checked;
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

// 删除选中的配置
async function deleteSelectedConfigs() {
    // 使用更新的方式获取选中配置
    const checkboxes = document.querySelectorAll('#configsList .config-checkbox');
    const selectedConfigs = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const configName = checkbox.getAttribute('data-name');
            selectedConfigs.push(configName);
        }
    });
    
    if (selectedConfigs.length === 0) {
        showAlert('请先选择要删除的配置', 'warning');
        return;
    }
    
    if (confirm(`确定要删除选中的${selectedConfigs.length}个配置吗？`)) {
        try {
            // 批量删除配置
            await storageService.deleteModelConfigs(selectedConfigs);
            showAlert('配置已删除', 'success');
            loadModelConfigs();
            
            // 如果当前在改写标签页，更新模型选择列表
            if (currentTab === 'rewrite') {
                loadModelConfigsToSelect();
            }
        } catch (error) {
            console.error('批量删除配置失败:', error);
            showAlert('删除配置失败: ' + error.message, 'error');
        }
    }
}

// 获取选中的文本
function getSelectedText() {
    // 发送消息到内容脚本获取选中的文本
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'getSelectedText'
        }, function(response) {
            if (response && response.success) {
                document.getElementById('originalText').value = response.data;
                showAlert('已获取选中文本', 'success');
            } else {
                showAlert('获取选中文本失败', 'error');
            }
        });
    });
}

// 复制原文
function copyOriginalText() {
    const originalText = document.getElementById('originalText').value;
    if (!originalText) {
        showAlert('没有可复制的文本', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(originalText).then(function() {
        showAlert('原文已复制到剪贴板', 'success');
    }, function() {
        showAlert('复制失败', 'error');
    });
}

// 清空原文
function clearOriginalText() {
    document.getElementById('originalText').value = '';
    showAlert('已清空原文', 'success');
}

// 清空改写提示词
function clearRewritePrompt() {
    document.getElementById('rewritePrompt').value = '';
    showAlert('已清空改写提示词', 'success');
}

// 开始改写
async function startRewrite() {
    try {
        const originalText = document.getElementById('originalText').value;
        const rewritePrompt = document.getElementById('rewritePrompt').value;
        const modelSelect = document.getElementById('modelSelect');
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        const configName = selectedOption.getAttribute('data-name');
        
        if (!originalText) {
            showAlert('请输入要改写的文本', 'warning');
            return;
        }
        
        if (!configName) {
            showAlert('请选择一个模型配置', 'warning');
            return;
        }
        
        // 获取模型配置
        const config = await storageService.getModelConfig(configName);
        if (!config) {
            showAlert('未找到选中的模型配置', 'warning');
            return;
        }
        
        // 显示处理中状态
        const startRewriteBtn = document.getElementById('startRewriteBtn');
        const originalTextContent = startRewriteBtn.textContent;
        startRewriteBtn.textContent = '处理中...';
        startRewriteBtn.disabled = true;
        
        // 调用模型服务进行文本改写
        const response = await modelService.rewriteText(config, originalText, rewritePrompt);
        
        // 恢复按钮状态
        startRewriteBtn.textContent = originalTextContent;
        startRewriteBtn.disabled = false;
        
        if (response.success) {
            document.getElementById('rewriteResult').value = response.data;
            showAlert('文本改写完成', 'success');
        } else {
            showAlert('改写失败: ' + response.error, 'error');
        }
    } catch (error) {
        // 恢复按钮状态
        const startRewriteBtn = document.getElementById('startRewriteBtn');
        startRewriteBtn.textContent = '🔄 开始改写';
        startRewriteBtn.disabled = false;
        
        console.error('文本改写失败:', error);
        showAlert('改写失败: ' + error.message, 'error');
    }
}

// 复制改写结果
function copyRewriteResult() {
    const rewriteResult = document.getElementById('rewriteResult').value;
    if (!rewriteResult) {
        showAlert('没有可复制的文本', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(rewriteResult).then(function() {
        showAlert('改写结果已复制到剪贴板', 'success');
    }, function() {
        showAlert('复制失败', 'error');
    });
}

// 保存改写结果
async function saveRewriteResult() {
    try {
        const rewriteName = document.getElementById('rewriteName').value;
        const originalText = document.getElementById('originalText').value;
        const rewriteResult = document.getElementById('rewriteResult').value;
        const rewritePrompt = document.getElementById('rewritePrompt').value;
        const modelSelect = document.getElementById('modelSelect');
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        const configName = selectedOption.getAttribute('data-name');
        
        if (!rewriteName) {
            showAlert('请输入改写工作名称', 'warning');
            return;
        }
        
        if (!originalText || !rewriteResult) {
            showAlert('没有可保存的内容', 'warning');
            return;
        }
        
        if (!configName) {
            showAlert('请选择一个模型配置', 'warning');
            return;
        }
        
        // 获取当前标签页的URL和标题
        const tabs = await new Promise(resolve => {
            chrome.tabs.query({active: true, currentWindow: true}, resolve);
        });
        
        const currentTab = tabs[0];
        
        // 创建改写记录对象
        const record = {
            id: generateUUID(),
            name: rewriteName,
            originalText: originalText,
            rewritePrompt: rewritePrompt,
            rewriteResult: rewriteResult,
            modelConfigName: configName,
            sourceUrl: currentTab.url || '',
            sourceTitle: currentTab.title || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // 保存改写记录
        await storageService.saveRewriteRecord(record);
        
        showAlert('改写结果已保存', 'success');
        
        // 清空名称输入框
        document.getElementById('rewriteName').value = '';
        
        // 重新加载历史记录
        loadRewriteHistory();
    } catch (error) {
        console.error('保存改写结果失败:', error);
        showAlert('保存改写结果失败: ' + error.message, 'error');
    }
}

// 加载模型配置到下拉列表
async function loadModelConfigsToSelect() {
    try {
        const configs = await storageService.loadModelConfigs();
        const modelSelect = document.getElementById('modelSelect');
        
        if (!configs || configs.length === 0) {
            modelSelect.innerHTML = '<option value="">请先添加模型配置</option>';
            return;
        }
        
        // 渲染配置选项
        modelSelect.innerHTML = configs.map(config => `
            <option value="${config.name}" data-name="${config.name}">${config.name} (${config.modelType})</option>
        `).join('');
    } catch (error) {
        console.error('加载模型配置到下拉列表失败:', error);
        document.getElementById('modelSelect').innerHTML = '<option value="">加载配置失败</option>';
    }
}

// 加载改写历史记录
async function loadRewriteHistory() {
    try {
        const records = await storageService.loadRewriteRecords();
        const recordsList = document.getElementById('recordsList');
        
        if (!records || records.length === 0) {
            recordsList.innerHTML = '<div class="empty-message">暂无记录</div>';
            return;
        }
        
        // 渲染记录列表 - 只显示改写工作名称，不显示详细内容
        recordsList.innerHTML = records.map(record => `
            <div class="record-item" data-id="${record.id}">
                <div class="record-info">
                    <label class="checkbox-label">
                        <input type="checkbox" class="record-checkbox" data-name="${record.name}">
                        <strong>${record.name}</strong>
                    </label>
                </div>
                <div class="record-actions">
                    <button class="edit-btn" data-name="${record.name}">编辑</button>
                    <button class="delete-btn" data-name="${record.name}">删除</button>
                </div>
            </div>
        `).join('');
        
        // 绑定编辑和删除按钮事件
        document.querySelectorAll('.record-actions .edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const recordName = this.getAttribute('data-name');
                editRewriteRecord(recordName);
            });
        });
        
        document.querySelectorAll('.record-actions .delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const recordName = this.getAttribute('data-name');
                deleteRewriteRecord(recordName);
            });
        });
    } catch (error) {
        console.error('加载改写历史记录失败:', error);
        document.getElementById('recordsList').innerHTML = '<div class="error-message">加载记录失败</div>';
    }
}

// 编辑改写记录
async function editRewriteRecord(recordName) {
    try {
        const record = await storageService.getRewriteRecord(recordName);
        if (!record) {
            showAlert('未找到记录', 'warning');
            return;
        }
        
        // 填充表单
        document.getElementById('rewriteName').value = record.name;
        document.getElementById('originalText').value = record.originalText;
        document.getElementById('rewritePrompt').value = record.rewritePrompt;
        document.getElementById('rewriteResult').value = record.rewriteResult;
        
        // 选择对应的模型配置
        const modelSelect = document.getElementById('modelSelect');
        for (let i = 0; i < modelSelect.options.length; i++) {
            if (modelSelect.options[i].getAttribute('data-name') === record.modelConfigName) {
                modelSelect.selectedIndex = i;
                break;
            }
        }
        
        showAlert('已加载记录到编辑器', 'success');
    } catch (error) {
        console.error('编辑改写记录失败:', error);
        showAlert('编辑记录失败: ' + error.message, 'error');
    }
}

// 删除改写记录
async function deleteRewriteRecord(recordName) {
    if (!confirm(`确定要删除记录 "${recordName}" 吗？`)) {
        return;
    }
    
    try {
        await storageService.deleteRewriteRecord(recordName);
        showAlert('记录已删除', 'success');
        loadRewriteHistory();
    } catch (error) {
        console.error('删除改写记录失败:', error);
        showAlert('删除记录失败: ' + error.message, 'error');
    }
}

// 切换所有记录选择状态
function toggleAllRecords() {
    const checkboxes = document.querySelectorAll('#recordsList input[type="checkbox"]');
    const selectAll = document.getElementById('selectAllRecords').checked;
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

// 删除选中的记录
async function deleteSelectedRecords() {
    const recordItems = document.querySelectorAll('.record-item');
    const selectedRecords = [];
    
    recordItems.forEach(item => {
        const checkbox = item.querySelector('.record-checkbox');
        if (checkbox && checkbox.checked) {
            const recordName = checkbox.getAttribute('data-name');
            selectedRecords.push(recordName);
        }
    });
    
    if (selectedRecords.length === 0) {
        showAlert('请先选择要删除的记录', 'warning');
        return;
    }
    
    if (confirm(`确定要删除选中的${selectedRecords.length}条记录吗？`)) {
        try {
            // 批量删除记录
            await storageService.deleteRewriteRecords(selectedRecords);
            showAlert('记录已删除', 'success');
            loadRewriteHistory();
        } catch (error) {
            console.error('批量删除记录失败:', error);
            showAlert('删除记录失败: ' + error.message, 'error');
        }
    }
}

// 显示提示信息
function showAlert(message, type) {
    // 创建提示元素
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    
    // 添加样式
    alertElement.style.position = 'fixed';
    alertElement.style.top = '20px';
    alertElement.style.left = '50%';
    alertElement.style.transform = 'translateX(-50%)';
    alertElement.style.padding = '12px 20px';
    alertElement.style.borderRadius = '4px';
    alertElement.style.color = 'white';
    alertElement.style.fontWeight = '500';
    alertElement.style.zIndex = '10000';
    alertElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    alertElement.style.opacity = '0';
    alertElement.style.transition = 'opacity 0.3s ease';
    
    // 根据类型设置背景色
    switch(type) {
        case 'success':
            alertElement.style.backgroundColor = '#28a745';
            break;
        case 'error':
            alertElement.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            alertElement.style.backgroundColor = '#ffc107';
            alertElement.style.color = '#212529';
            break;
        default:
            alertElement.style.backgroundColor = '#17a2b8';
    }
    
    // 添加到页面
    document.body.appendChild(alertElement);
    
    // 显示动画
    setTimeout(() => {
        alertElement.style.opacity = '1';
    }, 10);
    
    // 3秒后自动移除
    setTimeout(() => {
        alertElement.style.opacity = '0';
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.parentNode.removeChild(alertElement);
            }
        }, 300);
    }, 3000);
}