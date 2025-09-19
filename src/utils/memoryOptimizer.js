/**
 * FlowFocus V2.0 内存优化工具
 * 用于管理内存使用，防止内存泄漏
 */

class MemoryOptimizer {
    constructor() {
        this.cache = new Map();
        this.eventListeners = new WeakMap();
        this.timers = new Set();
        this.observers = new Set();
        this.maxCacheSize = 100;
        this.cleanupInterval = null;
        this.init();
    }

    init() {
        // 定期清理缓存
        this.cleanupInterval = setInterval(() => {
            this.cleanupCache();
            this.checkMemoryUsage();
        }, 60000); // 每分钟清理一次

        // 页面卸载时清理所有资源
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.cleanup();
            });
        }
    }

    // 智能缓存管理
    setCache(key, value, ttl = 300000) { // 默认5分钟TTL
        // 如果缓存已满，删除最旧的项
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        const item = {
            value,
            timestamp: Date.now(),
            ttl,
            accessCount: 0
        };

        this.cache.set(key, item);
    }

    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // 检查是否过期
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        // 增加访问计数
        item.accessCount++;
        return item.value;
    }

    // 清理过期缓存
    cleanupCache() {
        const now = Date.now();
        const toDelete = [];

        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                toDelete.push(key);
            }
        }

        toDelete.forEach(key => this.cache.delete(key));

        if (toDelete.length > 0) {
            console.log(`清理了 ${toDelete.length} 个过期缓存项`);
        }
    }

    // 事件监听器管理
    addEventListenerWithCleanup(element, event, handler, options) {
        element.addEventListener(event, handler, options);

        // 记录事件监听器以便后续清理
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({ event, handler, options });

        return () => {
            element.removeEventListener(event, handler, options);
            const listeners = this.eventListeners.get(element);
            if (listeners) {
                const index = listeners.findIndex(l => l.event === event && l.handler === handler);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    // 清理元素的所有事件监听器
    cleanupElementListeners(element) {
        const listeners = this.eventListeners.get(element);
        if (listeners) {
            listeners.forEach(({ event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
            this.eventListeners.delete(element);
        }
    }

    // 定时器管理
    setTimeout(callback, delay) {
        const timerId = setTimeout(() => {
            callback();
            this.timers.delete(timerId);
        }, delay);
        this.timers.add(timerId);
        return timerId;
    }

    setInterval(callback, interval) {
        const timerId = setInterval(callback, interval);
        this.timers.add(timerId);
        return timerId;
    }

    clearTimer(timerId) {
        clearTimeout(timerId);
        clearInterval(timerId);
        this.timers.delete(timerId);
    }

    // Observer管理
    addObserver(observer) {
        this.observers.add(observer);
        return () => {
            observer.disconnect();
            this.observers.delete(observer);
        };
    }

    // 内存使用检查
    checkMemoryUsage() {
        if (performance.memory) {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
            const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

            const usagePercent = (usedMB / limitMB) * 100;

            if (usagePercent > 80) {
                console.warn(`内存使用率过高: ${usagePercent.toFixed(1)}% (${usedMB}MB/${limitMB}MB)`);
                this.forceCleanup();
            }

            return {
                used: usedMB,
                total: totalMB,
                limit: limitMB,
                usagePercent: usagePercent.toFixed(1)
            };
        }
        return null;
    }

    // 强制清理
    forceCleanup() {
        // 清理缓存
        const cacheSize = this.cache.size;
        this.cache.clear();

        // 触发垃圾回收（如果可用）
        if (window.gc) {
            window.gc();
        }

        console.log(`强制清理完成，清理了 ${cacheSize} 个缓存项`);
    }

    // 对象池管理
    createObjectPool(createFn, resetFn, initialSize = 10) {
        const pool = [];
        
        // 初始化对象池
        for (let i = 0; i < initialSize; i++) {
            pool.push(createFn());
        }

        return {
            acquire() {
                return pool.length > 0 ? pool.pop() : createFn();
            },
            release(obj) {
                if (resetFn) resetFn(obj);
                if (pool.length < initialSize * 2) { // 限制池大小
                    pool.push(obj);
                }
            },
            size() {
                return pool.length;
            },
            clear() {
                pool.length = 0;
            }
        };
    }

    // 弱引用缓存
    createWeakCache() {
        const cache = new WeakMap();
        return {
            set(key, value) {
                cache.set(key, value);
            },
            get(key) {
                return cache.get(key);
            },
            has(key) {
                return cache.has(key);
            },
            delete(key) {
                return cache.delete(key);
            }
        };
    }

    // 批量DOM操作优化
    batchDOMOperations(operations) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const fragment = document.createDocumentFragment();
                const results = [];

                operations.forEach(operation => {
                    try {
                        const result = operation(fragment);
                        results.push(result);
                    } catch (error) {
                        console.error('DOM操作失败:', error);
                        results.push(null);
                    }
                });

                resolve(results);
            });
        });
    }

    // 图片懒加载优化
    optimizeImageLoading(container = document) {
        const images = container.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        images.forEach(img => imageObserver.observe(img));
        this.addObserver(imageObserver);

        return () => imageObserver.disconnect();
    }

    // 获取内存使用报告
    getMemoryReport() {
        const memory = this.checkMemoryUsage();
        return {
            memory,
            cache: {
                size: this.cache.size,
                maxSize: this.maxCacheSize
            },
            timers: this.timers.size,
            observers: this.observers.size,
            timestamp: new Date().toISOString()
        };
    }

    // 清理所有资源
    cleanup() {
        // 清理缓存
        this.cache.clear();

        // 清理定时器
        this.timers.forEach(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
        });
        this.timers.clear();

        // 清理观察者
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();

        // 清理清理间隔
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        console.log('内存优化器已清理所有资源');
    }
}

// 创建全局内存优化器实例
const memoryOptimizer = new MemoryOptimizer();

// 导出工具函数
const memoryTools = {
    optimizer: memoryOptimizer,
    
    // 缓存管理
    cache: {
        set: (key, value, ttl) => memoryOptimizer.setCache(key, value, ttl),
        get: (key) => memoryOptimizer.getCache(key),
        clear: () => memoryOptimizer.cache.clear()
    },
    
    // 事件监听器管理
    addEventListener: (element, event, handler, options) => 
        memoryOptimizer.addEventListenerWithCleanup(element, event, handler, options),
    
    // 定时器管理
    setTimeout: (callback, delay) => memoryOptimizer.setTimeout(callback, delay),
    setInterval: (callback, interval) => memoryOptimizer.setInterval(callback, interval),
    clearTimer: (timerId) => memoryOptimizer.clearTimer(timerId),
    
    // 内存监控
    checkMemory: () => memoryOptimizer.checkMemoryUsage(),
    getReport: () => memoryOptimizer.getMemoryReport(),
    
    // 对象池
    createPool: (createFn, resetFn, size) => memoryOptimizer.createObjectPool(createFn, resetFn, size),
    
    // 弱引用缓存
    createWeakCache: () => memoryOptimizer.createWeakCache(),
    
    // DOM优化
    batchDOM: (operations) => memoryOptimizer.batchDOMOperations(operations),
    optimizeImages: (container) => memoryOptimizer.optimizeImageLoading(container),
    
    // 清理
    cleanup: () => memoryOptimizer.cleanup(),
    forceCleanup: () => memoryOptimizer.forceCleanup()
};

export default memoryTools;