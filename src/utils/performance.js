/**
 * FlowFocus V2.0 性能监控工具
 * 用于监测和优化应用性能
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            memoryUsage: 0,
            apiCalls: [],
            errors: []
        };
        this.observers = [];
        this.init();
    }

    init() {
        // 监听页面加载性能
        if (typeof window !== 'undefined') {
            window.addEventListener('load', () => {
                this.measureLoadTime();
            });

            // 监听内存使用情况
            if (performance.memory) {
                setInterval(() => {
                    this.measureMemoryUsage();
                }, 30000); // 每30秒检查一次
            }

            // 监听长任务
            if ('PerformanceObserver' in window) {
                this.observeLongTasks();
            }
        }
    }

    // 测量页面加载时间
    measureLoadTime() {
        if (performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.metrics.loadTime = loadTime;
            console.log(`页面加载时间: ${loadTime}ms`);
        }
    }

    // 测量内存使用情况
    measureMemoryUsage() {
        if (performance.memory) {
            const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
            this.metrics.memoryUsage = memory;
            
            // 内存使用超过80%时发出警告
            if (memory.used / memory.limit > 0.8) {
                console.warn('内存使用率过高:', memory);
            }
        }
    }

    // 监听长任务
    observeLongTasks() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // 超过50ms的任务
                        console.warn('检测到长任务:', {
                            name: entry.name,
                            duration: entry.duration,
                            startTime: entry.startTime
                        });
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
            this.observers.push(observer);
        } catch (e) {
            console.log('长任务监听不支持');
        }
    }

    // 测量函数执行时间
    measureFunction(func, name = 'function') {
        return function(...args) {
            const start = performance.now();
            const result = func.apply(this, args);
            const end = performance.now();
            const duration = end - start;
            
            if (duration > 10) { // 超过10ms记录
                console.log(`${name} 执行时间: ${duration.toFixed(2)}ms`);
            }
            
            return result;
        };
    }

    // 测量异步函数执行时间
    async measureAsyncFunction(func, name = 'async function') {
        const start = performance.now();
        try {
            const result = await func();
            const end = performance.now();
            const duration = end - start;
            
            if (duration > 100) { // 异步函数超过100ms记录
                console.log(`${name} 执行时间: ${duration.toFixed(2)}ms`);
            }
            
            return result;
        } catch (error) {
            const end = performance.now();
            const duration = end - start;
            console.error(`${name} 执行失败 (${duration.toFixed(2)}ms):`, error);
            throw error;
        }
    }

    // 监控API调用性能
    trackApiCall(url, method = 'GET') {
        const start = performance.now();
        
        return {
            end: (success = true, error = null) => {
                const end = performance.now();
                const duration = end - start;
                
                const apiCall = {
                    url,
                    method,
                    duration,
                    success,
                    error,
                    timestamp: new Date().toISOString()
                };
                
                this.metrics.apiCalls.push(apiCall);
                
                // 只保留最近100次调用
                if (this.metrics.apiCalls.length > 100) {
                    this.metrics.apiCalls.shift();
                }
                
                // API调用超过2秒发出警告
                if (duration > 2000) {
                    console.warn('API调用耗时过长:', apiCall);
                }
                
                return apiCall;
            }
        };
    }

    // 记录错误
    recordError(error, context = '') {
        const errorRecord = {
            message: error.message || error,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.metrics.errors.push(errorRecord);
        
        // 只保留最近50个错误
        if (this.metrics.errors.length > 50) {
            this.metrics.errors.shift();
        }
        
        console.error('记录错误:', errorRecord);
    }

    // 获取性能报告
    getPerformanceReport() {
        const report = {
            ...this.metrics,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // 计算API调用统计
        if (this.metrics.apiCalls.length > 0) {
            const successfulCalls = this.metrics.apiCalls.filter(call => call.success);
            const avgDuration = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0) / this.metrics.apiCalls.length;
            
            report.apiStats = {
                total: this.metrics.apiCalls.length,
                successful: successfulCalls.length,
                failed: this.metrics.apiCalls.length - successfulCalls.length,
                avgDuration: Math.round(avgDuration),
                successRate: Math.round((successfulCalls.length / this.metrics.apiCalls.length) * 100)
            };
        }
        
        return report;
    }

    // 清理监听器
    cleanup() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers = [];
    }

    // 导出性能数据
    exportMetrics() {
        const report = this.getPerformanceReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowfocus-performance-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor();

// 导出工具函数
const performanceTools = {
    monitor: performanceMonitor,
    
    // 包装函数以进行性能监控
    wrap: (func, name) => performanceMonitor.measureFunction(func, name),
    
    // 包装异步函数
    wrapAsync: (func, name) => {
        return async (...args) => {
            return await performanceMonitor.measureAsyncFunction(() => func.apply(this, args), name);
        };
    },
    
    // 监控DOM操作
    measureDOMOperation: (operation, name = 'DOM operation') => {
        const start = performance.now();
        const result = operation();
        const end = performance.now();
        const duration = end - start;
        
        if (duration > 5) { // DOM操作超过5ms记录
            console.log(`${name} DOM操作耗时: ${duration.toFixed(2)}ms`);
        }
        
        return result;
    },
    
    // 优化图片加载
    optimizeImageLoading: () => {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
};

// 全局错误处理
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        performanceMonitor.recordError(event.error, 'Global error handler');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        performanceMonitor.recordError(event.reason, 'Unhandled promise rejection');
    });
}

export default performanceTools;