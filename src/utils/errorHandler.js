/**
 * FlowFocus V2.0 全局错误处理器
 * 提供用户友好的错误提示和异常恢复机制
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.init();
    }

    init() {
        // 全局错误监听
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.handleGlobalError(event.error, event.filename, event.lineno, event.colno);
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.handlePromiseRejection(event.reason);
            });
        }
    }

    // 错误类型定义
    static ErrorTypes = {
        NETWORK: 'network',
        API: 'api',
        STORAGE: 'storage',
        VALIDATION: 'validation',
        PERMISSION: 'permission',
        TIMEOUT: 'timeout',
        UNKNOWN: 'unknown'
    };

    // 错误严重级别
    static Severity = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    };

    // 处理全局错误
    handleGlobalError(error, filename, lineno, colno) {
        const errorInfo = {
            type: this.classifyError(error),
            message: error?.message || '未知错误',
            stack: error?.stack,
            filename,
            lineno,
            colno,
            timestamp: new Date().toISOString(),
            severity: this.getSeverity(error)
        };

        this.logError(errorInfo);
        this.showUserFriendlyError(errorInfo);
    }

    // 处理Promise拒绝
    handlePromiseRejection(reason) {
        const errorInfo = {
            type: this.classifyError(reason),
            message: reason?.message || reason || '异步操作失败',
            stack: reason?.stack,
            timestamp: new Date().toISOString(),
            severity: this.getSeverity(reason),
            isPromiseRejection: true
        };

        this.logError(errorInfo);
        this.showUserFriendlyError(errorInfo);
    }

    // 错误分类
    classifyError(error) {
        if (!error) return ErrorHandler.ErrorTypes.UNKNOWN;

        const message = error.message || error.toString();
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
            return ErrorHandler.ErrorTypes.NETWORK;
        }
        if (lowerMessage.includes('api') || lowerMessage.includes('unauthorized')) {
            return ErrorHandler.ErrorTypes.API;
        }
        if (lowerMessage.includes('storage') || lowerMessage.includes('quota')) {
            return ErrorHandler.ErrorTypes.STORAGE;
        }
        if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
            return ErrorHandler.ErrorTypes.PERMISSION;
        }
        if (lowerMessage.includes('timeout')) {
            return ErrorHandler.ErrorTypes.TIMEOUT;
        }
        if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
            return ErrorHandler.ErrorTypes.VALIDATION;
        }

        return ErrorHandler.ErrorTypes.UNKNOWN;
    }

    // 获取错误严重级别
    getSeverity(error) {
        if (!error) return ErrorHandler.Severity.LOW;

        const message = error.message || error.toString();
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('critical') || lowerMessage.includes('fatal')) {
            return ErrorHandler.Severity.CRITICAL;
        }
        if (lowerMessage.includes('storage') || lowerMessage.includes('permission')) {
            return ErrorHandler.Severity.HIGH;
        }
        if (lowerMessage.includes('network') || lowerMessage.includes('api')) {
            return ErrorHandler.Severity.MEDIUM;
        }

        return ErrorHandler.Severity.LOW;
    }

    // 记录错误
    logError(errorInfo) {
        this.errorLog.unshift(errorInfo);
        
        // 限制日志大小
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // 控制台输出
        console.error('FlowFocus Error:', errorInfo);

        // 存储到本地（如果可用）
        this.saveErrorToStorage(errorInfo);
    }

    // 显示用户友好的错误提示
    showUserFriendlyError(errorInfo) {
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        const actions = this.getRecoveryActions(errorInfo);

        this.displayErrorNotification({
            message: userMessage,
            type: errorInfo.type,
            severity: errorInfo.severity,
            actions,
            errorId: this.generateErrorId(errorInfo)
        });
    }

    // 获取用户友好的错误消息
    getUserFriendlyMessage(errorInfo) {
        const messages = {
            [ErrorHandler.ErrorTypes.NETWORK]: '网络连接出现问题，请检查您的网络设置',
            [ErrorHandler.ErrorTypes.API]: 'API服务暂时不可用，请稍后重试',
            [ErrorHandler.ErrorTypes.STORAGE]: '存储空间不足或访问受限，请清理浏览器数据',
            [ErrorHandler.ErrorTypes.VALIDATION]: '输入的数据格式不正确，请检查后重试',
            [ErrorHandler.ErrorTypes.PERMISSION]: '权限不足，请检查相关设置',
            [ErrorHandler.ErrorTypes.TIMEOUT]: '操作超时，请稍后重试',
            [ErrorHandler.ErrorTypes.UNKNOWN]: '发生了未知错误，我们正在努力解决'
        };

        return messages[errorInfo.type] || messages[ErrorHandler.ErrorTypes.UNKNOWN];
    }

    // 获取恢复操作
    getRecoveryActions(errorInfo) {
        const actions = [];

        switch (errorInfo.type) {
            case ErrorHandler.ErrorTypes.NETWORK:
                actions.push(
                    { text: '重试', action: 'retry' },
                    { text: '检查网络', action: 'check_network' }
                );
                break;
            case ErrorHandler.ErrorTypes.API:
                actions.push(
                    { text: '重试', action: 'retry' },
                    { text: '检查配置', action: 'check_config' }
                );
                break;
            case ErrorHandler.ErrorTypes.STORAGE:
                actions.push(
                    { text: '清理缓存', action: 'clear_cache' },
                    { text: '重新加载', action: 'reload' }
                );
                break;
            case ErrorHandler.ErrorTypes.PERMISSION:
                actions.push(
                    { text: '检查权限', action: 'check_permissions' },
                    { text: '重新授权', action: 'reauthorize' }
                );
                break;
            default:
                actions.push(
                    { text: '重试', action: 'retry' },
                    { text: '刷新页面', action: 'reload' }
                );
        }

        return actions;
    }

    // 显示错误通知
    displayErrorNotification({ message, type, severity, actions, errorId }) {
        // 创建错误通知元素
        const notification = document.createElement('div');
        notification.className = `error-notification ${type} ${severity}`;
        notification.innerHTML = `
            <div class="error-content">
                <div class="error-icon">${this.getErrorIcon(type)}</div>
                <div class="error-message">${message}</div>
                <div class="error-actions">
                    ${actions.map(action => 
                        `<button class="error-action-btn" data-action="${action.action}" data-error-id="${errorId}">
                            ${action.text}
                        </button>`
                    ).join('')}
                    <button class="error-close-btn" data-action="close">&times;</button>
                </div>
            </div>
        `;

        // 添加事件监听
        notification.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleRecoveryAction(action, errorId, notification);
            }
        });

        // 添加到页面
        document.body.appendChild(notification);

        // 自动移除（除非是严重错误）
        if (severity !== ErrorHandler.Severity.CRITICAL) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 10000);
        }
    }

    // 获取错误图标
    getErrorIcon(type) {
        const icons = {
            [ErrorHandler.ErrorTypes.NETWORK]: '🌐',
            [ErrorHandler.ErrorTypes.API]: '⚠️',
            [ErrorHandler.ErrorTypes.STORAGE]: '💾',
            [ErrorHandler.ErrorTypes.VALIDATION]: '❌',
            [ErrorHandler.ErrorTypes.PERMISSION]: '🔒',
            [ErrorHandler.ErrorTypes.TIMEOUT]: '⏱️',
            [ErrorHandler.ErrorTypes.UNKNOWN]: '❓'
        };
        return icons[type] || icons[ErrorHandler.ErrorTypes.UNKNOWN];
    }

    // 处理恢复操作
    async handleRecoveryAction(action, errorId, notification) {
        switch (action) {
            case 'retry':
                await this.retryLastOperation(errorId);
                break;
            case 'clear_cache':
                await this.clearCache();
                break;
            case 'reload':
                window.location.reload();
                break;
            case 'check_network':
                this.checkNetworkStatus();
                break;
            case 'check_config':
                this.openConfigPanel();
                break;
            case 'check_permissions':
                this.checkPermissions();
                break;
            case 'close':
                notification.remove();
                break;
        }
    }

    // 重试机制
    async retryLastOperation(errorId) {
        const retryCount = this.retryAttempts.get(errorId) || 0;
        
        if (retryCount >= this.maxRetries) {
            this.showUserFriendlyError({
                type: ErrorHandler.ErrorTypes.UNKNOWN,
                message: '重试次数已达上限',
                severity: ErrorHandler.Severity.MEDIUM
            });
            return;
        }

        this.retryAttempts.set(errorId, retryCount + 1);
        
        // 这里可以实现具体的重试逻辑
        console.log(`重试操作 ${errorId}，第 ${retryCount + 1} 次`);
    }

    // 清理缓存
    async clearCache() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.clear();
            }
            localStorage.clear();
            sessionStorage.clear();
            
            this.showSuccessMessage('缓存已清理');
        } catch (error) {
            console.error('清理缓存失败:', error);
        }
    }

    // 检查网络状态
    checkNetworkStatus() {
        if (navigator.onLine) {
            this.showSuccessMessage('网络连接正常');
        } else {
            this.showUserFriendlyError({
                type: ErrorHandler.ErrorTypes.NETWORK,
                message: '网络连接已断开',
                severity: ErrorHandler.Severity.HIGH
            });
        }
    }

    // 打开配置面板
    openConfigPanel() {
        // 触发配置面板打开事件
        const event = new CustomEvent('openConfigPanel');
        document.dispatchEvent(event);
    }

    // 检查权限
    async checkPermissions() {
        if (typeof chrome !== 'undefined' && chrome.permissions) {
            try {
                const permissions = await chrome.permissions.getAll();
                console.log('当前权限:', permissions);
                this.showSuccessMessage('权限检查完成');
            } catch (error) {
                console.error('权限检查失败:', error);
            }
        }
    }

    // 显示成功消息
    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <span class="success-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // 生成错误ID
    generateErrorId(errorInfo) {
        const timestamp = Date.now();
        const hash = this.simpleHash(errorInfo.message + errorInfo.type);
        return `error_${timestamp}_${hash}`;
    }

    // 简单哈希函数
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(36);
    }

    // 保存错误到存储
    async saveErrorToStorage(errorInfo) {
        try {
            const key = 'flowfocus_error_log';
            let errorLog = [];
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(key);
                errorLog = result[key] || [];
            } else {
                const stored = localStorage.getItem(key);
                errorLog = stored ? JSON.parse(stored) : [];
            }
            
            errorLog.unshift(errorInfo);
            
            // 只保留最近50个错误
            if (errorLog.length > 50) {
                errorLog = errorLog.slice(0, 50);
            }
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ [key]: errorLog });
            } else {
                localStorage.setItem(key, JSON.stringify(errorLog));
            }
        } catch (error) {
            console.error('保存错误日志失败:', error);
        }
    }

    // 获取错误统计
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            bySeverity: {},
            recent: this.errorLog.slice(0, 10)
        };

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });

        return stats;
    }

    // 导出错误日志
    exportErrorLog() {
        const data = {
            timestamp: new Date().toISOString(),
            errors: this.errorLog,
            stats: this.getErrorStats()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowfocus-error-log-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 清理资源
    cleanup() {
        this.errorLog = [];
        this.retryAttempts.clear();
    }
}

// 创建全局错误处理器实例
const errorHandler = new ErrorHandler();

// 导出工具函数
const errorTools = {
    handler: errorHandler,
    
    // 手动报告错误
    reportError: (error, context = '') => {
        errorHandler.handleGlobalError(error, context);
    },
    
    // 包装函数以捕获错误
    wrapFunction: (func, context = '') => {
        return function(...args) {
            try {
                return func.apply(this, args);
            } catch (error) {
                errorHandler.handleGlobalError(error, context);
                throw error;
            }
        };
    },
    
    // 包装异步函数
    wrapAsync: (func, context = '') => {
        return async function(...args) {
            try {
                return await func.apply(this, args);
            } catch (error) {
                errorHandler.handleGlobalError(error, context);
                throw error;
            }
        };
    },
    
    // 获取错误统计
    getStats: () => errorHandler.getErrorStats(),
    
    // 导出错误日志
    exportLog: () => errorHandler.exportErrorLog(),
    
    // 清理
    cleanup: () => errorHandler