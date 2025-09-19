// Jest测试环境设置
// 在这里可以添加全局的测试配置和模拟对象

// 模拟Chrome扩展API
global.chrome = {
    storage: {
        local: {
            get: jest.fn().mockResolvedValue({}),
            set: jest.fn().mockResolvedValue(),
            remove: jest.fn().mockResolvedValue()
        }
    },
    runtime: {
        sendMessage: jest.fn().mockResolvedValue(),
        onMessage: {
            addListener: jest.fn()
        }
    },
    tabs: {
        query: jest.fn().mockResolvedValue([]),
        sendMessage: jest.fn().mockResolvedValue()
    }
};

// 模拟DOM API
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
    },
    writable: true
});

// 模拟fetch API
global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
});

// 模拟console方法以避免测试输出污染
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
};

// 设置测试超时时间
jest.setTimeout(10000);

// 在每个测试前重置所有mock
beforeEach(() => {
    jest.clearAllMocks();
});