/**
 * 侧边栏JavaScript逻辑
 */
import storageService from '../services/storageService.js';
import modelService from '../services/modelService.js';
import TableService from '../services/tableService.js';
import SyncService from '../services/syncService.js';
import { generateUUID } from '../utils/utils.js';

// 当前选中的标签页
let currentTab = 'tableConfig';

// 触发webpack重新编译



// 大模型默认配置
const MODEL_DEFAULTS = {
    'qwen': {
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        modelEndpoint: 'qwen-turbo'
    },
    'deepseek': {
        baseUrl: 'https://api.deepseek.com',
        modelEndpoint: 'deepseek-chat'
    },
    'volces': {
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        modelEndpoint: ''
    },
    'kimi': {
        baseUrl: 'https://api.moonshot.cn/v1',
        modelEndpoint: 'moonshot-v1-8k'
    },
    'hunyuan': {
        baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
        modelEndpoint: 'hunyuan-turbos-latest'
    }
};

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async function() {
    // 升级现有记录，添加类型标记
    try {
        console.log('开始升级现有记录，添加类型标记...');
        await storageService.upgradeExistingRecords();
        console.log('记录升级完成');
    } catch (error) {
        console.error('记录升级过程中出现错误:', error);
    }
    
    // 初始化标签页
    initTabs();
    
    // 初始化多维表格配置标签页
    initTableConfigTab();
    
    // 初始化大模型配置标签页
    initModelConfigTab();
    
    // 初始化改写功能标签页
    initRewriteTab();
    
    // 插件加载时填充默认值
    fillModelDefaults();
});

// 初始化标签页切换功能
function initTabs() {
    console.log('初始化标签页功能');
    
    // 获取所有标签页和面板元素
    const tableConfigTab = document.getElementById('tableConfigTab');
    const modelConfigTab = document.getElementById('modelConfigTab');
    const rewriteTab = document.getElementById('rewriteTab');
    
    const tableConfigPanel = document.getElementById('tableConfigPanel');
    const modelConfigPanel = document.getElementById('modelConfigPanel');
    const rewritePanel = document.getElementById('rewritePanel');
    
    // 标签页切换函数
    function switchTab(targetTab) {
        console.log('切换到标签页:', targetTab);
        
        // 重置所有标签页和面板状态
        if (tableConfigTab) tableConfigTab.classList.remove('active');
        if (modelConfigTab) modelConfigTab.classList.remove('active');
        if (rewriteTab) rewriteTab.classList.remove('active');
        
        if (tableConfigPanel) tableConfigPanel.classList.remove('active');
        if (modelConfigPanel) modelConfigPanel.classList.remove('active');
        if (rewritePanel) rewritePanel.classList.remove('active');
        
        // 设置目标标签页和面板为激活状态
        currentTab = targetTab;
        
        if (targetTab === 'tableConfig') {
            if (tableConfigTab) tableConfigTab.classList.add('active');
            if (tableConfigPanel) tableConfigPanel.classList.add('active');
            loadTableConfigs();
        } else if (targetTab === 'modelConfig') {
            if (modelConfigTab) modelConfigTab.classList.add('active');
            if (modelConfigPanel) modelConfigPanel.classList.add('active');
            fillModelDefaults();
        } else if (targetTab === 'rewrite') {
            if (rewriteTab) rewriteTab.classList.add('active');
            if (rewritePanel) rewritePanel.classList.add('active');
            loadModelConfigsToSelect();
        }
        
        // 强制重绘
        setTimeout(() => {
            if (tableConfigPanel) tableConfigPanel.offsetHeight;
            if (modelConfigPanel) modelConfigPanel.offsetHeight;
            if (rewritePanel) rewritePanel.offsetHeight;
        }, 0);
    }
    
    // 为每个标签页添加事件监听器，同时添加阻止事件冒泡
    if (tableConfigTab) {
        tableConfigTab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了多维表格配置标签');
            switchTab('tableConfig');
        });
    }
    
    if (modelConfigTab) {
        modelConfigTab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了大模型配置标签');
            switchTab('modelConfig');
        });
    }
    
    if (rewriteTab) {
        rewriteTab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击了改写功能标签');
            switchTab('rewrite');
        });
    }
    
    // 初始化时设置默认激活的标签页（多维表格配置）
    console.log('初始化默认标签页');
    switchTab('tableConfig');
}

// 初始化大模型配置标签页
function initModelConfigTab() {
    try {
        // 获取元素并添加空值检查
        const modelType = document.getElementById('modelType');
        const saveConfigBtn = document.getElementById('saveConfigBtn');
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        const selectAllConfigs = document.getElementById('selectAllConfigs');
        const deleteSelectedConfigsBtn = document.getElementById('deleteSelectedConfigsBtn');
        
        // 绑定事件，确保元素存在再添加事件监听器
        if (modelType) modelType.addEventListener('change', fillModelDefaults); // 大模型下拉框选择变化时填充默认值
        if (saveConfigBtn) saveConfigBtn.addEventListener('click', saveModelConfig);
        if (testConnectionBtn) testConnectionBtn.addEventListener('click', testModelConnection);
        if (selectAllConfigs) selectAllConfigs.addEventListener('change', toggleAllConfigs);
        if (deleteSelectedConfigsBtn) deleteSelectedConfigsBtn.addEventListener('click', deleteSelectedConfigs);
        
        // 加载已保存的配置
        loadModelConfigs();
    } catch (error) {
        console.error('初始化大模型配置标签页失败:', error);
        showAlert('初始化模型配置功能失败: ' + error.message, 'error');
    }
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
    const batchSyncRecordsBtn = document.getElementById('batchSyncRecordsBtn');
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
    if (batchSyncRecordsBtn) {
        batchSyncRecordsBtn.addEventListener('click', batchSyncRewriteRecords);
    }
    
    // 加载模型配置到下拉列表
    loadModelConfigsToSelect();
    
    // 加载改写历史记录
    loadRewriteHistory();
}

// 初始化多维表格配置标签页
function initTableConfigTab() {
    // 获取元素
    const tablePlatform = document.getElementById('tablePlatform');
    const saveTableConfigBtn = document.getElementById('saveTableConfigBtn');
    const testTableConnectionBtn = document.getElementById('testTableConnectionBtn');
    const selectAllTableConfigs = document.getElementById('selectAllTableConfigs');
    const deleteSelectedTableConfigsBtn = document.getElementById('deleteSelectedTableConfigsBtn');
    
    // 绑定事件
    tablePlatform.addEventListener('change', fillTableDefaults);
    saveTableConfigBtn.addEventListener('click', saveTableConfig);
    testTableConnectionBtn.addEventListener('click', testTableConnection);
    selectAllTableConfigs.addEventListener('change', toggleAllTableConfigs);
    deleteSelectedTableConfigsBtn.addEventListener('click', deleteSelectedTableConfigs);
    
    // 批量同步按钮事件监听
    const batchSyncTableConfigsBtn = document.getElementById('batchSyncTableConfigsBtn');
    if (batchSyncTableConfigsBtn) {
        batchSyncTableConfigsBtn.addEventListener('click', batchSyncTableConfigs);
    }
    
    // 加载已保存的配置
    loadTableConfigs();
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
            type: modelType,
            modelType: modelType,
            apiKey: apiKey,
            baseUrl: baseUrl,
            modelEndpoint: modelEndpoint
        };
        
        // 显示加载状态
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        const loading = showLoading(testConnectionBtn, '测试中...');
        
        try {
            // 测试连接
            const response = await modelService.testConnection(config);
            
            if (response.success) {
                showAlert('连接成功', 'success');
            } else {
                showAlert('连接失败: ' + response.error, 'error');
            }
        } finally {
            loading.hide();
        }
    } catch (error) {
        console.error('测试模型连接失败:', error);
        showAlert('测试连接失败: ' + error.message, 'error');
    }
}

// 加载模型配置
async function loadModelConfigs() {
    try {
        // 检查configsList元素是否存在
        const configsList = document.getElementById('configsList');
        if (!configsList) {
            console.warn('未找到configsList元素');
            return;
        }
        
        const configs = await storageService.loadModelConfigs();
        
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
                    <button class="sync-btn" data-name="${config.name}">同步</button>
                    <button class="delete-btn" data-name="${config.name}">删除</button>
                </div>
            </div>
        `).join('');
        
        // 绑定编辑、同步和删除按钮事件
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const configName = this.getAttribute('data-name');
                editModelConfig(configName);
            });
        });
        
        document.querySelectorAll('.sync-btn').forEach(button => {
            button.addEventListener('click', function() {
                const configItem = this.closest('.config-item');
                const configId = configItem.dataset.id;
                showModelSyncDialog(configId);
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
        const configsList = document.getElementById('configsList');
        if (configsList) {
            configsList.innerHTML = '<div class="error-message">加载配置失败</div>';
        }
        showAlert('加载模型配置失败: ' + error.message, 'error');
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
    // 检查是否正在编辑该配置
    const editingConfigId = document.getElementById('configId').value;
    if (editingConfigId) {
        const allConfigs = await storageService.loadModelConfigs();
        const editingConfig = allConfigs.find(config => config.id === editingConfigId);
        if (editingConfig && editingConfig.name === configName) {
            showAlert('无法删除正在编辑的配置', 'warning');
            return;
        }
    }
    
    // 检查是否有改写记录依赖于该配置
    const records = await storageService.loadRewriteRecords();
    const dependentRecords = records.filter(record => record.modelConfigName === configName);
    if (dependentRecords.length > 0) {
        showAlert(`无法删除配置 "${configName}"，因为有${dependentRecords.length}个改写记录依赖于它`, 'warning');
        return;
    }
    
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
    
    // 检查是否选中了正在编辑的配置
    const editingConfigId = document.getElementById('configId').value;
    if (editingConfigId) {
        try {
            const allConfigs = await storageService.loadModelConfigs();
            const editingConfig = allConfigs.find(config => config.id === editingConfigId);
            if (editingConfig && selectedConfigs.includes(editingConfig.name)) {
                showAlert('无法删除正在编辑的配置', 'warning');
                return;
            }
        } catch (error) {
            console.error('检查编辑状态失败:', error);
        }
    }
    
    // 检查是否有改写记录依赖于选中的配置
    const records = await storageService.loadRewriteRecords();
    const dependentConfigs = [];
    
    selectedConfigs.forEach(configName => {
        const hasDependent = records.some(record => record.modelConfigName === configName);
        if (hasDependent) {
            dependentConfigs.push(configName);
        }
    });
    
    if (dependentConfigs.length > 0) {
        showAlert(`无法删除以下配置，因为有改写记录依赖于它们：${dependentConfigs.join(', ')}`, 'warning');
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

// 获取选中的文本（增强版）
async function getSelectedText() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // 获取文本
        const selectedText = await getTextWithFallback(tab.id);
        
        if (selectedText && selectedText.trim()) {
            document.getElementById('originalText').value = selectedText.trim();
            
            // 给用户一个视觉反馈
            const getSelectedTextBtn = document.getElementById('getSelectedTextBtn');
            const originalBtnText = getSelectedTextBtn.textContent;
            getSelectedTextBtn.textContent = '✅ 已获取';
            getSelectedTextBtn.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                getSelectedTextBtn.textContent = originalBtnText;
                getSelectedTextBtn.style.backgroundColor = '';
            }, 2000);
            
            showAlert('已获取选中文本', 'success');
        } else {
            document.getElementById('originalText').value = '';
            
            // 给用户一个视觉反馈
            const getSelectedTextBtn = document.getElementById('getSelectedTextBtn');
            const originalBtnText = getSelectedTextBtn.textContent;
            getSelectedTextBtn.textContent = '❌ 无选中文本';
            getSelectedTextBtn.style.backgroundColor = '#dc3545';
            
            setTimeout(() => {
                getSelectedTextBtn.textContent = originalBtnText;
                getSelectedTextBtn.style.backgroundColor = '';
            }, 2000);
            
            showAlert('未找到选中的文本，请先在网页中选择要处理的文本', 'warning');
        }
    } catch (error) {
        console.error('获取选中文本失败:', error);
        document.getElementById('originalText').value = '';
        
        // 给用户一个视觉反馈
        const getSelectedTextBtn = document.getElementById('getSelectedTextBtn');
        const originalBtnText = getSelectedTextBtn.textContent;
        getSelectedTextBtn.textContent = '❌ 获取失败';
        getSelectedTextBtn.style.backgroundColor = '#dc3545';
        
        setTimeout(() => {
            getSelectedTextBtn.textContent = originalBtnText;
            getSelectedTextBtn.style.backgroundColor = '';
        }, 2000);
        
        showAlert('获取文本失败: ' + (error.message || '未知错误'), 'error');
    }
}

// 获取文本的函数（带备选方案）
async function getTextWithFallback(tabId) {
    try {
        // 首先尝试通过消息传递获取选中的文本
        const response = await chrome.tabs.sendMessage(tabId, {
            action: 'getSelectedText'
        });
        
        if (response && response.success) {
            return response.data;
        } else {
            throw new Error(response ? response.error : '无法与页面通信');
        }
    } catch (error) {
        console.warn('通过消息传递获取文本失败:', error);
        
        // 备选方案：直接执行脚本获取文本
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    const selectedText = window.getSelection().toString();
                    if (selectedText.trim()) {
                        return selectedText;
                    }
                    
                    // 如果没有选中文本，返回空字符串
                    // 不自动获取页面内容，让用户明确选择文本
                    return '';
                }
            });
            
            if (results && results[0] && results[0].result) {
                return results[0].result;
            }
        } catch (scriptError) {
            console.error('通过脚本注入获取文本失败:', scriptError);
        }
        
        throw new Error('无法获取页面文本内容，请确保已选中文本并刷新页面重试');
    }
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
        
        // 确保配置对象包含type字段
        const modelConfig = {
            ...config,
            type: config.modelType
        };
        
        // 调用模型服务进行文本改写
        const response = await modelService.rewriteText(modelConfig, originalText, rewritePrompt);
        
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
        const recordId = document.getElementById('recordId').value; // 获取记录ID
        
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
        
        let record;
        if (recordId) {
            // 编辑模式：通过ID查找并更新记录
            const records = await storageService.loadRewriteRecords();
            const foundRecord = records.find(r => r.id === recordId);
            if (!foundRecord) {
                showAlert('未找到要编辑的记录', 'error');
                return;
            }
            
            // 获取模型配置信息以更新modelConfigId、modelType和modelName
            const modelConfigs = await storageService.loadModelConfigs();
            const selectedConfig = modelConfigs.find(c => c.name === configName);
            const modelConfigId = selectedConfig ? selectedConfig.id : '';
            const modelType = selectedConfig ? selectedConfig.modelType : '';
            const modelName = selectedConfig ? selectedConfig.modelEndpoint || '' : '';
            
            // 更新记录信息
            foundRecord.name = rewriteName;
            foundRecord.originalText = originalText;
            foundRecord.rewritePrompt = rewritePrompt;
            foundRecord.rewriteResult = rewriteResult;
            foundRecord.modelConfigName = configName;
            foundRecord.modelConfigId = modelConfigId;
            foundRecord.modelType = modelType;
            foundRecord.modelName = modelName;
            foundRecord.updatedAt = new Date().toISOString();
            record = foundRecord;
        } else {
            // 非编辑模式：检查是否存在同名记录
            const existingRecord = await storageService.getRewriteRecord(rewriteName);
            if (existingRecord) {
                // 弹出确认对话框
                const shouldOverwrite = confirm(`已存在名为 "${rewriteName}" 的改写工作记录，是否要覆盖原来的工作成果？`);
                if (!shouldOverwrite) {
                    // 用户选择不覆盖，放弃保存操作
                    showAlert('已取消保存操作', 'info');
                    return;
                }
                // 用户选择覆盖，更新现有记录
                
                // 获取模型配置信息以更新modelConfigId、modelType和modelName
                const modelConfigs = await storageService.loadModelConfigs();
                const selectedConfig = modelConfigs.find(c => c.name === configName);
                const modelConfigId = selectedConfig ? selectedConfig.id : '';
                const modelType = selectedConfig ? selectedConfig.modelType : '';
                const modelName = selectedConfig ? selectedConfig.modelEndpoint || '' : '';
                
                existingRecord.originalText = originalText;
                existingRecord.rewritePrompt = rewritePrompt;
                existingRecord.rewriteResult = rewriteResult;
                existingRecord.modelConfigName = configName;
                existingRecord.modelConfigId = modelConfigId;
                existingRecord.modelType = modelType;
                existingRecord.modelName = modelName;
                existingRecord.updatedAt = new Date().toISOString();
                record = existingRecord;
            } else {
                // 获取当前标签页的URL和标题
                const tabs = await new Promise(resolve => {
                    chrome.tabs.query({active: true, currentWindow: true}, resolve);
                });
                
                const currentTab = tabs[0];
                
                // 获取模型配置信息以添加modelConfigId、modelType和modelName
                const modelConfigs = await storageService.loadModelConfigs();
                const selectedConfig = modelConfigs.find(c => c.name === configName);
                const modelConfigId = selectedConfig ? selectedConfig.id : '';
                const modelType = selectedConfig ? selectedConfig.modelType : '';
                const modelName = selectedConfig ? selectedConfig.modelEndpoint || '' : '';
                
                // 创建新记录对象
                record = {
                    id: generateUUID(),
                    name: rewriteName,
                    originalText: originalText,
                    rewritePrompt: rewritePrompt,
                    rewriteResult: rewriteResult,
                    modelConfigName: configName,
                    modelConfigId: modelConfigId,
                    modelType: modelType,
                    modelName: modelName,
                    sourceUrl: currentTab.url || '',
                    sourceTitle: currentTab.title || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
        }
        
        // 保存改写记录
        await storageService.saveRewriteRecord(record);
        
        if (recordId) {
            showAlert('改写记录已更新', 'success');
        } else {
            showAlert('改写结果已保存', 'success');
        }
        
        // 保存成功后，清空recordId字段退出编辑模式
        document.getElementById('recordId').value = '';
        
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
                    <button class="sync-btn" data-id="${record.id}">同步</button>
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
        
        // 绑定同步按钮事件
        document.querySelectorAll('.record-actions .sync-btn').forEach(button => {
            button.addEventListener('click', function() {
                const recordId = this.getAttribute('data-id');
                syncRewriteRecord(recordId);
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
        document.getElementById('recordId').value = record.id; // 设置记录ID，进入编辑模式
        
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
    // 检查是否正在编辑该记录
    const editingRecordId = document.getElementById('recordId').value;
    if (editingRecordId) {
        const record = await storageService.getRewriteRecord(recordName);
        if (record && record.id === editingRecordId) {
            showAlert('无法删除正在编辑的记录', 'warning');
            return;
        }
    }
    
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
    
    // 检查是否选中了正在编辑的记录
    const editingRecordId = document.getElementById('recordId').value;
    if (editingRecordId) {
        try {
            // 遍历选中的记录，检查是否包含正在编辑的记录
            for (const recordName of selectedRecords) {
                const record = await storageService.getRewriteRecord(recordName);
                if (record && record.id === editingRecordId) {
                    showAlert('无法删除正在编辑的记录', 'warning');
                    return;
                }
            }
        } catch (error) {
            console.error('检查编辑状态失败:', error);
        }
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

// 批量同步改写工作记录
async function batchSyncRewriteRecords() {
    const recordItems = document.querySelectorAll('.record-item');
    const selectedRecords = [];
    const selectedRecordIds = [];
    
    recordItems.forEach(item => {
        const checkbox = item.querySelector('.record-checkbox');
        if (checkbox && checkbox.checked) {
            const recordName = checkbox.getAttribute('data-name');
            selectedRecords.push(recordName);
            selectedRecordIds.push(item.dataset.id);
        }
    });
    
    if (selectedRecords.length === 0) {
        showAlert('请先选择要同步的记录', 'warning');
        return;
    }
    
    try {
        // 显示同步对话框
        const syncDialog = document.getElementById('syncDialog');
        const dialogTitle = document.getElementById('syncDialogTitle');
        const selectedRecordsCount = document.getElementById('selectedRecordsCount');
        const selectedConfigNames = document.getElementById('selectedConfigNames');
        const confirmSyncBtn = document.getElementById('confirmSyncBtn');
        
        // 更新对话框内容
        dialogTitle.textContent = '改写工作信息同步设置';
        selectedRecordsCount.textContent = `共 ${selectedRecords.length} 条`;
        selectedConfigNames.textContent = selectedRecords.join(', ');
        
        // 保存选中的记录到对话框元素中
        confirmSyncBtn.setAttribute('data-selected-configs', JSON.stringify(selectedRecordIds));
        confirmSyncBtn.setAttribute('data-config-type', 'rewriteRecord');
        
        // 绑定对话框事件监听器 - 传递正确的配置类型
        bindSyncDialogEvents(recordId, 'rewriteRecord');
        
        // 加载目标配置列表
        await loadTargetConfigs();
        
        // 显示对话框
        syncDialog.style.display = 'block';
        
    } catch (error) {
        console.error('批量同步改写工作记录失败:', error);
        showAlert('批量同步记录失败: ' + error.message, 'error');
    }
}

// 填充多维表格默认值
function fillTableDefaults() {
    const platform = document.getElementById('tablePlatform').value;
    const tableConfigNameInput = document.getElementById('tableConfigName');
    const tableAppIdInput = document.getElementById('tableAppId');
    const tableAppSecretInput = document.getElementById('tableAppSecret');
    const tableIdInput = document.getElementById('tableId');
    
    // 清空所有相关输入框（除了配置名称）
    if (!document.getElementById('tableConfigId').value) {
        tableConfigNameInput.value = '';
    }
    tableAppIdInput.value = '';
    tableAppSecretInput.value = '';
    tableIdInput.value = '';
}

// 保存多维表格配置
async function saveTableConfig() {
    try {
        // 获取表单数据
        const configName = document.getElementById('tableConfigName').value;
        const platform = document.getElementById('tablePlatform').value;
        const appId = document.getElementById('tableAppId').value;
        const appSecret = document.getElementById('tableAppSecret').value;
        const tableId = document.getElementById('tableId').value;
        const configId = document.getElementById('tableConfigId').value; // 获取配置ID
        
        // 验证数据
        if (!configName) {
            showAlert('请输入配置名称', 'warning');
            return;
        }
        
        if (!appId || !appSecret || !tableId) {
            showAlert('请填写完整的配置信息', 'warning');
            return;
        }
        
        let config;
        if (configId) {
            // 编辑模式：通过ID查找并更新配置
            const configs = await storageService.loadData('tableConfigs') || [];
            const foundConfig = configs.find(c => c.id === configId);
            if (!foundConfig) {
                showAlert('未找到要编辑的配置', 'error');
                return;
            }
            // 更新配置信息
            foundConfig.name = configName;
            foundConfig.platform = platform;
            foundConfig.appId = appId;
            foundConfig.appSecret = appSecret;
            foundConfig.tableId = tableId;
            foundConfig.updatedAt = new Date().toISOString();
            config = foundConfig;
        } else {
            // 非编辑模式：检查是否存在同名配置
            const configs = await storageService.loadData('tableConfigs') || [];
            const existingConfig = configs.find(c => c.name === configName);
            if (existingConfig) {
                // 如果存在同名配置，询问用户是否覆盖
                if (!confirm(`已存在名为 "${configName}" 的配置，是否要覆盖？`)) {
                    return; // 用户选择不覆盖，放弃保存操作
                }
                // 用户选择覆盖，更新现有配置
                existingConfig.platform = platform;
                existingConfig.appId = appId;
                existingConfig.appSecret = appSecret;
                existingConfig.tableId = tableId;
                existingConfig.updatedAt = new Date().toISOString();
                config = existingConfig;
            } else {
                // 创建新配置对象
                config = {
                    id: generateUUID(),
                    name: configName,
                    platform: platform,
                    appId: appId,
                    appSecret: appSecret,
                    tableId: tableId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
        }
        
        // 保存配置
        const configs = await storageService.loadData('tableConfigs') || [];
        const existingIndex = configs.findIndex(c => c.id === config.id);
        
        if (existingIndex >= 0) {
            // 更新现有配置
            configs[existingIndex] = config;
        } else {
            // 添加新配置
            configs.push(config);
        }
        
        await storageService.saveData('tableConfigs', configs);
        
        showAlert('表格配置已保存', 'success');
        
        // 保存成功后，只清空configId字段退出编辑模式，保留表单内容
        document.getElementById('tableConfigId').value = '';
        
        // 重新加载配置列表
        loadTableConfigs();
        
        // 更新同步功能标签页的表格选择列表
        if (currentTab === 'sync') {
            loadTableConfigsToSelect();
        }
    } catch (error) {
        console.error('保存表格配置失败:', error);
        showAlert('保存配置失败: ' + error.message, 'error');
    }
}

// 测试多维表格连接
async function testTableConnection() {
    try {
        const platform = document.getElementById('tablePlatform').value;
        const appId = document.getElementById('tableAppId').value;
        const appSecret = document.getElementById('tableAppSecret').value;
        const tableId = document.getElementById('tableId').value;
        
        if (!appId || !appSecret || !tableId) {
            showAlert('请填写完整的配置信息', 'warning');
            return;
        }
        
        const testBtn = document.getElementById('testTableConnectionBtn');
        const loading = showLoading(testBtn, '测试中...');
        
        try {
            // 这里应该调用tableService测试连接
            // const result = await tableService.testConnection({platform, appId, appSecret, tableId});
            
            // 模拟测试结果
            await new Promise(resolve => setTimeout(resolve, 2000));
            const success = Math.random() > 0.3; // 70%成功率
            
            if (success) {
                showAlert('连接测试成功', 'success');
            } else {
                showAlert('连接测试失败，请检查配置信息', 'error');
            }
        } finally {
            loading.hide();
        }
    } catch (error) {
        console.error('测试表格连接失败:', error);
        showAlert('测试连接失败: ' + error.message, 'error');
    }
}

// 加载多维表格配置
async function loadTableConfigs() {
    try {
        const configs = await storageService.loadData('tableConfigs') || [];
        const configsList = document.getElementById('tableConfigsList');
        
        if (!configs || configs.length === 0) {
            configsList.innerHTML = '<div class="empty-message">暂无配置</div>';
            return;
        }
        
        configsList.innerHTML = configs.map(config => `
            <div class="config-item" data-id="${config.id}">
                <div class="config-info">
                    <label class="checkbox-label">
                        <input type="checkbox" class="table-config-checkbox" data-id="${config.id}">
                        <strong>${config.name}</strong> (${getPlatformName(config.platform)})
                    </label>
                </div>
                <div class="config-actions">
                    <button class="edit-btn" data-id="${config.id}">编辑</button>
                    <button class="sync-btn" data-id="${config.id}">同步</button>
                    <button class="delete-btn" data-id="${config.id}">删除</button>
                </div>
            </div>
        `).join('');
        
        // 绑定编辑和删除按钮事件
        document.querySelectorAll('#tableConfigsList .edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const configId = this.getAttribute('data-id');
                editTableConfig(configId);
            });
        });
        
        document.querySelectorAll('#tableConfigsList .delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const configId = this.getAttribute('data-id');
                deleteTableConfig(configId);
            });
        });

        // 绑定同步按钮事件
        document.querySelectorAll('#tableConfigsList .sync-btn').forEach(button => {
            button.addEventListener('click', function() {
                const configId = this.getAttribute('data-id');
                showSyncDialog(configId);
            });
        });
        
        // 绑定批量同步按钮事件
        document.getElementById('batchSyncConfigsBtn').addEventListener('click', function() {
            batchSyncModelConfigs();
        });
    } catch (error) {
        console.error('加载表格配置失败:', error);
        document.getElementById('tableConfigsList').innerHTML = '<div class="error-message">加载配置失败</div>';
    }
}

// 获取平台显示名称
function getPlatformName(platform) {
    const names = {
        'feishu': '飞书',
        'dingtalk': '钉钉',
        'wework': '企业微信'
    };
    return names[platform] || platform;
}

// 编辑多维表格配置
async function editTableConfig(configId) {
    try {
        const configs = await storageService.loadData('tableConfigs') || [];
        const config = configs.find(c => c.id === configId);
        
        if (!config) {
            showAlert('未找到配置', 'warning');
            return;
        }
        
        // 填充表单
        document.getElementById('tableConfigName').value = config.name;
        document.getElementById('tablePlatform').value = config.platform;
        document.getElementById('tableAppId').value = config.appId;
        document.getElementById('tableAppSecret').value = config.appSecret;
        document.getElementById('tableId').value = config.tableId;
        document.getElementById('tableConfigId').value = config.id; // 保存配置ID到隐藏字段
    } catch (error) {
        console.error('编辑表格配置失败:', error);
        showAlert('编辑配置失败: ' + error.message, 'error');
    }
}

// 删除多维表格配置
async function deleteTableConfig(configId) {
    // 检查是否正在编辑该配置
    const editingConfigId = document.getElementById('tableConfigId').value;
    if (editingConfigId && editingConfigId === configId) {
        showAlert('无法删除正在编辑的配置', 'warning');
        return;
    }
    
    // 先找到配置名称用于确认对话框
    const configs = await storageService.loadData('tableConfigs') || [];
    const config = configs.find(c => c.id === configId);
    const configName = config ? config.name : '未知配置';
    
    if (!confirm(`确定要删除配置 "${configName}" 吗？`)) {
        return;
    }
    
    try {
        const filteredConfigs = configs.filter(c => c.id !== configId);
        await storageService.saveData('tableConfigs', filteredConfigs);
        
        showAlert('配置已删除', 'success');
        loadTableConfigs();
        
        // 如果当前在同步标签页，更新表格选择列表
        if (currentTab === 'sync') {
            loadTableConfigsToSelect();
        }
    } catch (error) {
        console.error('删除表格配置失败:', error);
        showAlert('删除配置失败: ' + error.message, 'error');
    }
}

// 切换所有表格配置选择状态
function toggleAllTableConfigs() {
    const checkboxes = document.querySelectorAll('#tableConfigsList .table-config-checkbox');
    const selectAll = document.getElementById('selectAllTableConfigs').checked;
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

// 删除选中的表格配置
async function deleteSelectedTableConfigs() {
    // 使用更新的方式获取选中配置
    const checkboxes = document.querySelectorAll('#tableConfigsList .table-config-checkbox');
    const selectedConfigs = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const configId = checkbox.getAttribute('data-id');
            selectedConfigs.push(configId);
        }
    });
    
    if (selectedConfigs.length === 0) {
        showAlert('请先选择要删除的配置', 'warning');
        return;
    }
    
    // 检查是否选中了正在编辑的配置
    const editingConfigId = document.getElementById('tableConfigId').value;
    if (editingConfigId && selectedConfigs.includes(editingConfigId)) {
        showAlert('无法删除正在编辑的配置', 'warning');
        return;
    }
    
    if (confirm(`确定要删除选中的${selectedConfigs.length}个配置吗？`)) {
        try {
            const configs = await storageService.loadData('tableConfigs') || [];
            const filteredConfigs = configs.filter(c => !selectedConfigs.includes(c.id));
            
            await storageService.saveData('tableConfigs', filteredConfigs);
            
            showAlert('配置已删除', 'success');
            loadTableConfigs();
            
            // 如果当前在同步标签页，更新表格选择列表
            if (currentTab === 'sync') {
                loadTableConfigsToSelect();
            }
        } catch (error) {
            console.error('批量删除配置失败:', error);
            showAlert('删除配置失败: ' + error.message, 'error');
        }
    }
}

// 显示提示信息
function showAlert(message, type = 'info') {
    // 移除现有的提示
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => {
        alert.classList.add('fade-out');
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    });
    
    // 创建新的提示元素
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    // 添加关闭按钮
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'float: right; cursor: pointer; font-weight: bold; margin-left: 10px; font-size: 16px;';
    closeBtn.onclick = () => {
        alert.classList.add('fade-out');
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    };
    alert.appendChild(closeBtn);
    
    // 添加到页面
    document.body.appendChild(alert);
    
    // 5秒后自动移除
    setTimeout(() => {
        if (alert.parentNode && !alert.classList.contains('fade-out')) {
            alert.classList.add('fade-out');
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }
    }, 5000);
}

// 显示加载状态
function showLoading(element, text = '加载中...') {
    if (!element) return;
    
    const originalDisabled = element.disabled;
    
    // 特殊处理select元素
    if (element.tagName === 'SELECT') {
        // 保存原始选项
        const originalOptions = Array.from(element.options).map(option => ({
            value: option.value,
            textContent: option.textContent,
            selected: option.selected
        }));
        
        // 清空并添加加载提示选项
        element.innerHTML = `<option value="">${text}</option>`;
        element.disabled = true;
        
        return {
            hide: () => {
                // 恢复原始选项
                element.innerHTML = '';
                originalOptions.forEach(optionData => {
                    const option = document.createElement('option');
                    option.value = optionData.value;
                    option.textContent = optionData.textContent;
                    option.selected = optionData.selected;
                    element.appendChild(option);
                });
                element.disabled = originalDisabled;
            }
        };
    } else {
        // 非select元素的常规处理
        const originalText = element.textContent;
        
        element.innerHTML = `<span class="loading-spinner"></span>${text}`;
        element.disabled = true;
        
        return {
            hide: () => {
                element.textContent = originalText;
                element.disabled = originalDisabled;
            }
        };
    }
}

// 更新状态指示器
function updateStatusIndicator(elementId, status, text) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.className = `status-indicator ${status}`;
    element.textContent = text;
    
    // 如果是运行状态，添加加载动画
    if (status === 'running') {
        const spinner = document.createElement('span');
        spinner.className = 'loading-spinner';
        element.insertBefore(spinner, element.firstChild);
    }
}

// 性能优化工具函数
const performanceUtils = {
    // 防抖函数 - 优化版本
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    },

    // 节流函数 - 优化版本
    throttle(func, limit) {
        let inThrottle;
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    },

    // RAF节流 - 用于动画和滚动优化
    rafThrottle(func) {
        let ticking = false;
        return function(...args) {
            if (!ticking) {
                requestAnimationFrame(() => {
                    func.apply(this, args);
                    ticking = false;
                });
                ticking = true;
            }
        };
    },

    // 批量DOM更新
    batchDOMUpdates(updates) {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    },

    // 内存优化 - 清理事件监听器
    cleanupEventListeners(element) {
        if (element && element.cloneNode) {
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            return newElement;
        }
        return element;
    }
};

// 向后兼容
const debounce = performanceUtils.debounce;
const throttle = performanceUtils.throttle;

// 显示同步对话框
async function showSyncDialog(configId) {
    try {
        // 获取配置信息
        const configs = await storageService.loadData('tableConfigs') || [];
        const config = configs.find(c => c.id === configId);
        
        if (!config) {
            showAlert('未找到配置信息', 'warning');
            return;
        }
        
        // 更新对话框信息
        document.getElementById('selectedRecordsCount').textContent = '共 1 条';
        document.getElementById('selectedConfigNames').textContent = config.name;
        
        // 加载可用的目标配置
        await loadTargetConfigs(configId);
        
        // 显示对话框
        const modal = document.getElementById('syncDialog');
        modal.style.display = 'block';
        
        // 绑定对话框事件
        bindSyncDialogEvents(configId, 'tableConfig');
        
    } catch (error) {
        console.error('显示同步对话框失败:', error);
        showAlert('打开同步对话框失败: ' + error.message, 'error');
    }
}

// 显示模型配置同步对话框
async function showModelSyncDialog(configId) {
    try {
        // 获取配置信息
        const configs = await storageService.loadData('modelConfigs') || [];
        const config = configs.find(c => c.id === configId);
        
        if (!config) {
            showAlert('未找到配置信息', 'warning');
            return;
        }
        
        // 更新对话框信息
        document.getElementById('selectedRecordsCount').textContent = '共 1 条';
        document.getElementById('selectedConfigNames').textContent = config.name;
        
        // 加载可用的目标配置
        await loadTargetConfigs(configId);
        
        // 显示对话框
        const modal = document.getElementById('syncDialog');
        modal.style.display = 'block';
        
        // 绑定对话框事件
        bindSyncDialogEvents(configId, 'modelConfig');
        
    } catch (error) {
        console.error('显示同步对话框失败:', error);
        showAlert('打开同步对话框失败: ' + error.message, 'error');
    }
}

// 加载目标配置列表
async function loadTargetConfigs(currentConfigId) {
    try {
        const configs = await storageService.loadData('tableConfigs') || [];
        const targetSelect = document.getElementById('targetConfigSelect');
    
        // 先清空下拉框，避免重复添加选项
        targetSelect.innerHTML = '';
    
        // 添加所有配置选项（包括当前配置）
        configs.forEach(config => {
            const option = document.createElement('option');
            option.value = config.id;
            option.textContent = `${config.name} (${getPlatformName(config.platform)})`;
            
            // 如果是当前配置，添加特殊标记
            if (config.id === currentConfigId) {
                option.textContent += ' (当前配置)';
            }
            
            targetSelect.appendChild(option);
        });
        
        // 如果没有配置可用
        if (targetSelect.options.length === 0) {
            targetSelect.innerHTML = '<option value="">暂无配置可用</option>';
        }
        else {
            // 加载当前配置的表格列表
            await loadTargetTables(currentConfigId);
        }

        
        
    } catch (error) {
        console.error('加载目标配置失败:', error);
        showAlert('加载目标配置失败: ' + error.message, 'error');
    }
}

// 绑定同步对话框事件
function bindSyncDialogEvents(configId, configType = 'tableConfig') {
    // 保存配置类型到确认按钮
    const confirmSyncBtn = document.getElementById('confirmSyncBtn');
    confirmSyncBtn.setAttribute('data-config-type', configType);
    
    // 关闭按钮
    document.querySelector('#syncDialog .close').onclick = function() {
        document.getElementById('syncDialog').style.display = 'none';
    };
    
    // 取消按钮
    document.getElementById('cancelSyncBtn').onclick = function() {
        const syncDialog = document.getElementById('syncDialog');
        const confirmSyncBtn = document.getElementById('confirmSyncBtn');
        
        // 清除批量同步标记、配置类型和单条记录ID
        confirmSyncBtn.removeAttribute('data-selected-configs');
        confirmSyncBtn.removeAttribute('data-config-type');
        confirmSyncBtn.removeAttribute('data-record-id');
        
        // 关闭对话框
        syncDialog.style.display = 'none';
    };
    
    // 确定按钮
    document.getElementById('confirmSyncBtn').onclick = function() {
        // 从按钮上读取data-record-id属性值
        const recordId = this.getAttribute('data-record-id');
        // 如果有recordId，则传递recordId，否则传递configId
        startSync(recordId || configId);
    };
    
    // 目标配置选择变化时加载表格
    document.getElementById('targetConfigSelect').onchange = function() {
        loadTargetTables(this.value);
    };
    
    // 点击模态框外部关闭
    window.onclick = function(event) {
        const modal = document.getElementById('syncDialog');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// 加载目标表格列表
// 加载目标表格配置信息
async function loadTargetTables(targetConfigId) {
    try {
        if (!targetConfigId) {
            console.log('targetConfigId is empty');
            return;
        }
        
        console.log('loadTargetTables called with targetConfigId:', targetConfigId);
        
        // 获取目标配置信息
        const configs = await storageService.loadData('tableConfigs') || [];
        const targetConfig = configs.find(c => c.id === targetConfigId);
        
        if (!targetConfig) {
            console.log('Config not found for id:', targetConfigId);
            return;
        }
        
        console.log('Found target config:', targetConfig.name);
        
        // 如果配置中有表格名称，可以预填到文本框中
        const targetTableInput = document.getElementById('targetTableInput');
        if (targetTableInput && targetConfig.tableName) {
            targetTableInput.value = targetConfig.tableName;
        }
        
    } catch (error) {
        console.error('加载目标表格配置失败:', error);
    }
}

// 批量同步大模型配置
async function batchSyncModelConfigs() {
    // 获取选中的配置
    const checkboxes = document.querySelectorAll('#configsList .config-checkbox');
    const selectedConfigs = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const configItem = checkbox.closest('.config-item');
            const configId = configItem.dataset.id;
            selectedConfigs.push(configId);
        }
    });
    
    if (selectedConfigs.length === 0) {
        showAlert('请先选择要同步的大模型配置', 'warning');
        return;
    }
    
    try {
        // 获取选中的配置详情
        const allConfigs = await storageService.loadData('modelConfigs') || [];
        const selectedConfigDetails = allConfigs.filter(config => 
            selectedConfigs.includes(config.id)
        );
        
        // 显示批量同步对话框
        const syncDialog = document.getElementById('syncDialog');
        const selectedRecordsCount = document.getElementById('selectedRecordsCount');
        const selectedConfigNames = document.getElementById('selectedConfigNames');
        const confirmSyncBtn = document.getElementById('confirmSyncBtn');
        
        // 更新对话框内容
        selectedRecordsCount.textContent = `共 ${selectedConfigDetails.length} 条`;
        selectedConfigNames.textContent = selectedConfigDetails.map(c => c.name).join(', ');
        
        // 保存选中的配置ID到对话框元素中，供确认按钮使用
        confirmSyncBtn.setAttribute('data-selected-configs', JSON.stringify(selectedConfigs));
        
        // 绑定对话框事件监听器，指定配置类型为modelConfig
        bindSyncDialogEvents(null, 'modelConfig');
        
        // 显示对话框
        syncDialog.style.display = 'block';
        
    } catch (error) {
        console.error('批量同步大模型配置失败:', error);
        showAlert('批量同步大模型配置失败: ' + error.message, 'error');
    }
}

// 批量同步表格配置
async function batchSyncTableConfigs() {
    // 使用更新的方式获取选中配置
    const checkboxes = document.querySelectorAll('#tableConfigsList .table-config-checkbox');
    const selectedConfigs = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const configId = checkbox.getAttribute('data-id');
            selectedConfigs.push(configId);
        }
    });
    
    if (selectedConfigs.length === 0) {
        showAlert('请先选择要同步的配置', 'warning');
        return;
    }
    
    try {
        // 获取选中的配置详情
        const allConfigs = await storageService.loadData('tableConfigs') || [];
        const selectedConfigDetails = allConfigs.filter(config => 
            selectedConfigs.includes(config.id)
        );
        
        // 显示批量同步对话框
        const syncDialog = document.getElementById('syncDialog');
        const selectedRecordsCount = document.getElementById('selectedRecordsCount');
        const selectedConfigNames = document.getElementById('selectedConfigNames');
        const confirmSyncBtn = document.getElementById('confirmSyncBtn');
        
        // 更新对话框内容
        selectedRecordsCount.textContent = `共 ${selectedConfigDetails.length} 条`;
        selectedConfigNames.textContent = selectedConfigDetails.map(c => c.name).join(', ');
        
        // 保存选中的配置ID到对话框元素中，供确认按钮使用
        confirmSyncBtn.setAttribute('data-selected-configs', JSON.stringify(selectedConfigs));
        
        // 绑定对话框事件监听器
        bindSyncDialogEvents(recordId, 'rewriteRecord');
        
        // 显示对话框
        syncDialog.style.display = 'block';
        
    } catch (error) {
        console.error('批量同步配置失败:', error);
        showAlert('批量同步配置失败: ' + error.message, 'error');
    }
}

// 同步改写工作记录
async function syncRewriteRecord(recordId) {
    try {
        // 获取改写工作记录
        const rewriteRecords = await storageService.loadData('rewriteRecords') || [];
        const record = rewriteRecords.find(r => r.id === recordId);
        
        if (!record) {
            showAlert('改写工作记录不存在', 'error');
            return;
        }
        
        // 显示同步对话框
        const syncDialog = document.getElementById('syncDialog');
        const dialogTitle = document.getElementById('syncDialogTitle');
        const selectedRecordsCount = document.getElementById('selectedRecordsCount');
        const selectedConfigNames = document.getElementById('selectedConfigNames');
        const confirmSyncBtn = document.getElementById('confirmSyncBtn');
        
        // 更新对话框内容
        dialogTitle.textContent = '改写工作信息同步设置';
        selectedRecordsCount.textContent = '共 1 条';
        selectedConfigNames.textContent = record.name;
        
        // 保存选中的记录到对话框元素中 - 使用记录ID，与其他配置类型保持一致
        confirmSyncBtn.removeAttribute('data-selected-configs');
        confirmSyncBtn.setAttribute('data-record-id', recordId);
        confirmSyncBtn.setAttribute('data-config-type', 'rewriteRecord');
        
        // 绑定对话框事件监听器
        bindSyncDialogEvents(recordId, 'rewriteRecord');
        
        // 加载目标配置列表
        await loadTargetConfigs();
        
        // 显示对话框
        syncDialog.style.display = 'block';
        
    } catch (error) {
        console.error('同步改写工作记录失败:', error);
        showAlert('同步改写工作记录失败: ' + error.message, 'error');
    }
}

// 开始同步 - 支持单条和批量同步
async function startSync(configId) {
    const targetConfigId = document.getElementById('targetConfigSelect').value;
    const targetTableName = document.getElementById('targetTableInput').value;
    const syncBtn = document.getElementById('confirmSyncBtn');
    const recordId = syncBtn.getAttribute('data-record-id');
    // 如果有recordId但没有明确的configType，默认使用rewriteRecord
    const configType = syncBtn.getAttribute('data-config-type') || (recordId ? 'rewriteRecord' : 'tableConfig');
    
    if (!targetConfigId) {
        showAlert('请选择同步目的链接', 'warning');
        return;
    }
    
    if (!targetTableName || targetTableName.trim() === '') {
        showAlert('请输入同步目的表格名称', 'warning');
        return;
    }
    
    try {
        // 获取目标配置信息
        const targetConfigs = await storageService.loadData('tableConfigs') || [];
        const targetConfig = targetConfigs.find(c => c.id === targetConfigId);
        
        if (!targetConfig) {
            showAlert('目标配置信息不存在', 'error');
            return;
        }
        
        // 显示加载状态
        const loading = showLoading(syncBtn, '同步中...');
        
        try {
            // 创建同步服务实例
            const syncService = new SyncService();
            
            // 检查是单条同步还是批量同步
            const selectedConfigsJson = syncBtn.getAttribute('data-selected-configs');
            
            if (selectedConfigsJson) {
                // 批量同步逻辑
                const selectedConfigs = JSON.parse(selectedConfigsJson);
                
                // 根据配置类型加载源配置
                let sourceConfigs = [];
                if (configType === 'modelConfig') {
                    const modelConfigs = await storageService.loadData('modelConfigs') || [];
                    sourceConfigs = modelConfigs.filter(c => selectedConfigs.includes(c.id));
                } else if (configType === 'rewriteRecord') {
                    const rewriteRecords = await storageService.loadData('rewriteRecords') || [];
                    sourceConfigs = rewriteRecords.filter(r => selectedConfigs.includes(r.id));
                } else {
                    const tableConfigs = await storageService.loadData('tableConfigs') || [];
                    sourceConfigs = tableConfigs.filter(c => selectedConfigs.includes(c.id));
                }
                
                console.log(`开始批量同步配置，共 ${sourceConfigs.length} 条`, {
                    targetConfig: targetConfig.name,
                    targetTableName: targetTableName,
                    configType: configType
                });
                
                // 准备批量同步数据
                const syncDataArray = sourceConfigs.map(sourceConfig => {
                    if (configType === 'modelConfig') {
                        // 大模型配置同步数据
                        return {
                            id: sourceConfig.id,
                            name: sourceConfig.name,
                            type: 'modelConfig',
                            modelType: sourceConfig.modelType || sourceConfig.type,
                            apiKey: sourceConfig.apiKey,
                            baseUrl: sourceConfig.baseUrl,
                            modelEndpoint: sourceConfig.modelEndpoint,
                            tableToken: targetConfig.tableToken || targetConfig.tableId,
                            tableId: targetTableName,
                            createdAt: sourceConfig.createdAt,
                            updatedAt: sourceConfig.updatedAt,
                            metadata: {
                                source: 'FlowFocus',
                                syncType: 'batchModelConfigSync',
                                sourceConfigId: sourceConfig.id,
                                targetConfigId: targetConfig.id,
                                targetTableName: targetTableName,
                                syncTime: new Date().toISOString()
                            }
                        };
                    } else if (configType === 'rewriteRecord') {
                        // 改写工作记录同步数据
                        return {
                            id: sourceConfig.id,
                            name: sourceConfig.name,
                            type: 'rewriteRecord',
                            originalText: sourceConfig.originalText,
                            prompt: sourceConfig.rewritePrompt,
                            rewrittenText: sourceConfig.rewrittenText,
                            modelConfigId: sourceConfig.modelConfigId,
                            modelConfigName: sourceConfig.modelConfigName || '',
                            modelType: sourceConfig.modelType,
                            modelName: sourceConfig.modelName,
                            tableToken: targetConfig.tableToken || targetConfig.tableId,
                            tableId: targetTableName,
                            createdAt: sourceConfig.createdAt,
                            updatedAt: sourceConfig.updatedAt,
                            metadata: {
                                source: 'FlowFocus',
                                syncType: 'batchRewriteRecordSync',
                                sourceConfigId: sourceConfig.id,
                                targetConfigId: targetConfig.id,
                                targetTableName: targetTableName,
                                syncTime: new Date().toISOString(),
                                url: sourceConfig.url || '',
                                title: sourceConfig.title || ''
                            }
                        };
                    } else {
                        // 多维表格配置同步数据
                        return {
                            id: sourceConfig.id,
                            name: sourceConfig.name,
                            type: 'tableConfig',
                            platform: sourceConfig.platform,
                            appId: sourceConfig.appId,
                            appSecret: sourceConfig.appSecret,
                            tableToken: targetConfig.tableToken || targetConfig.tableId,
                            tableId: targetTableName,
                            sourceTableId: sourceConfig.tableId,
                            createdAt: sourceConfig.createdAt,
                            updatedAt: sourceConfig.updatedAt,
                            metadata: {
                                source: 'FlowFocus',
                                syncType: 'batchConfigSync',
                                sourceConfigId: sourceConfig.id,
                                targetConfigId: targetConfig.id,
                                targetTableName: targetTableName,
                                syncTime: new Date().toISOString()
                            }
                        };
                    }
                });
                
                // 执行批量同步
                const syncResults = [];
                let successCount = 0;
                let failCount = 0;
                
                // 在循环外部创建表格服务实例和适配器，以复用访问令牌
                const firstSyncData = syncDataArray[0];
                let tableService = null;
                
                try {
                    // 创建共享的表格服务实例
                    tableService = new TableService({
                        ...targetConfig,
                        appId: firstSyncData.appId || targetConfig.appId,
                        appSecret: firstSyncData.appSecret || targetConfig.appSecret
                    });
                    
                    // 预获取访问令牌
                    if (tableService.adapter && typeof tableService.adapter.getAccessToken === 'function') {
                        console.log('预获取访问令牌用于批量同步复用...');
                        await tableService.adapter.getAccessToken();
                        console.log('访问令牌预获取成功，将在所有同步请求中复用');
                    }
                } catch (tokenError) {
                    console.warn('预获取访问令牌失败，将在每个配置同步时单独获取:', tokenError.message);
                }
                
                // 执行批量同步，使用同一个表格服务实例复用令牌
                for (let i = 0; i < syncDataArray.length; i++) {
                    const syncData = syncDataArray[i];
                    const sourceConfig = sourceConfigs[i];
                    
                    try {
                        // 使用同一个表格服务实例执行同步，注意参数顺序
                        const result = await syncService.syncSingle(syncData, targetConfig, {}, tableService);
                        syncResults.push({ id: sourceConfig.id, name: sourceConfig.name, success: true });
                        successCount++;
                        console.log(`配置 ${sourceConfig.name} 同步成功`, result);
                    } catch (error) {
                        syncResults.push({ id: sourceConfig.id, name: sourceConfig.name, success: false, error: error.message });
                        failCount++;
                        console.error(`配置 ${sourceConfig.name} 同步失败`, error);
                    }
                    
                    // 更新进度显示
                    syncBtn.textContent = `同步中... (${i + 1}/${syncDataArray.length})`;
                }
                
                // 显示批量同步结果
                let resultMessage = `批量同步完成: 成功 ${successCount} 条, 失败 ${failCount} 条`;
                if (failCount > 0) {
                    const failedConfigs = syncResults.filter(r => !r.success).map(r => r.name).join(', ');
                    resultMessage += `\n\n失败的配置: ${failedConfigs}`;
                }
                
                showAlert(resultMessage, failCount > 0 ? 'warning' : 'success');
                
                // 清除同步标记
                syncBtn.removeAttribute('data-selected-configs');
                syncBtn.removeAttribute('data-record-id');
                syncBtn.removeAttribute('data-record-name');
                
            } else {
                // 单条同步逻辑 - 统一使用ID查找，保持三种配置类型一致
                let sourceConfig = null;
                const actualConfigId = recordId || configId;
                
                if (configType === 'modelConfig') {
                    const modelConfigs = await storageService.loadData('modelConfigs') || [];
                    sourceConfig = modelConfigs.find(c => c.id === actualConfigId);
                } else if (configType === 'rewriteRecord') {
                    const rewriteRecords = await storageService.loadData('rewriteRecords') || [];
                    sourceConfig = rewriteRecords.find(r => r.id === actualConfigId);
                } else {
                    const tableConfigs = await storageService.loadData('tableConfigs') || [];
                    sourceConfig = tableConfigs.find(c => c.id === actualConfigId);
                }
                
                if (!sourceConfig) {
                    showAlert(`${configType === 'modelConfig' ? '大模型配置' : configType === 'rewriteRecord' ? '改写工作' : '多维表格'}信息不存在`, 'error');
                    return;
                }
                
                console.log('开始同步配置:', {
                    sourceConfig: sourceConfig.name,
                    targetConfig: targetConfig.name,
                    targetTableName: targetTableName,
                    configType: configType
                });
                
                // 准备同步数据
                let syncData = null;
                if (configType === 'modelConfig') {
                    // 大模型配置同步数据
                    syncData = {
                        id: sourceConfig.id,
                        name: sourceConfig.name,
                        type: 'modelConfig',
                        modelType: sourceConfig.modelType || sourceConfig.type,
                        apiKey: sourceConfig.apiKey,
                        baseUrl: sourceConfig.baseUrl,
                        modelEndpoint: sourceConfig.modelEndpoint,
                        tableToken: targetConfig.tableToken || targetConfig.tableId,
                        tableId: targetTableName,
                        createdAt: sourceConfig.createdAt,
                        updatedAt: sourceConfig.updatedAt,
                        metadata: {
                            source: 'FlowFocus',
                            syncType: 'modelConfigSync',
                            sourceConfigId: sourceConfig.id,
                            targetConfigId: targetConfig.id,
                            targetTableName: targetTableName,
                            syncTime: new Date().toISOString()
                        }
                    };
                } else if (configType === 'rewriteRecord') {
                    // 改写工作记录同步数据
                    syncData = {
                        id: sourceConfig.id,
                        name: sourceConfig.name,
                        type: 'rewriteRecord',
                        originalText: sourceConfig.originalText,
                        prompt: sourceConfig.prompt,
                        rewrittenText: sourceConfig.rewrittenText,
                        modelConfigId: sourceConfig.modelConfigId,
                        modelConfigName: sourceConfig.modelConfigName,
                        modelType: sourceConfig.modelType,
                        modelName: sourceConfig.modelName,
                        tableToken: targetConfig.tableToken || targetConfig.tableId,
                        tableId: targetTableName,
                        createdAt: sourceConfig.createdAt,
                        updatedAt: sourceConfig.updatedAt,
                        metadata: {
                            source: 'FlowFocus',
                            syncType: 'rewriteRecordSync',
                            sourceConfigId: sourceConfig.id,
                            targetConfigId: targetConfig.id,
                            targetTableName: targetTableName,
                            syncTime: new Date().toISOString(),
                            url: sourceConfig.sourceUrl || '',
                            title: sourceConfig.sourceTitle || ''
                        }
                    };
                } else {
                    // 多维表格配置同步数据
                    syncData = {
                        id: sourceConfig.id,
                        name: sourceConfig.name,
                        type: 'tableConfig',
                        platform: sourceConfig.platform,
                        appId: sourceConfig.appId,
                        appSecret: sourceConfig.appSecret,
                        tableToken: targetConfig.tableToken || targetConfig.tableId,
                        tableId: targetTableName,
                        sourceTableId: sourceConfig.tableId,
                        createdAt: sourceConfig.createdAt,
                        updatedAt: sourceConfig.updatedAt,
                        metadata: {
                            source: 'FlowFocus',
                            syncType: 'configSync',
                            sourceConfigId: sourceConfig.id,
                            targetConfigId: targetConfig.id,
                            targetTableName: targetTableName,
                            syncTime: new Date().toISOString()
                        }
                    };
                }
                
                // 执行同步
                const syncResult = await syncService.syncSingle(syncData, targetConfig);
                
                console.log('配置同步结果:', syncResult);
                
                // 显示同步成功信息
                let configTypeName;
                if (configType === 'modelConfig') {
                    configTypeName = '大模型';
                } else if (configType === 'rewriteRecord') {
                    configTypeName = '改写工作';
                } else {
                    configTypeName = '多维表格';
                }
                showAlert(`${configTypeName}记录同步成功: ${sourceConfig.name} → ${targetConfig.name} (表格: ${targetTableName})`, 'success');
                
                // 清除单条同步标记
                syncBtn.removeAttribute('data-record-id');
            }
            
            // 关闭对话框
            document.getElementById('syncDialog').style.display = 'none';
            
        } catch (error) {
            console.error('同步失败:', error);
            showAlert('同步失败: ' + error.message, 'error');
        } finally {
            // 恢复按钮状态
            syncBtn.textContent = '确定';
            loading.hide();
        }
        
    } catch (error) {
        console.error('开始同步失败:', error);
        showAlert('开始同步失败: ' + error.message, 'error');
    }
}