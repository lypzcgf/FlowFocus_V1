// 飞书适配器直接测试
const FeishuAdapter = require('./dist/services/adapters/feishuAdapter.js').default;

// 使用用户提供的配置
const config = {
    appId: 'cli_a83161fe68be1013',
    appSecret: 'gzqMVM6UZJhOzRHwGyXmChjUQamffTmo',
    tableToken: 'DROzbmJw8aDik9sExJtcq98anjh'
};

async function testFeishuAdapter() {
    console.log('开始测试飞书适配器...');
    
    try {
        // 创建适配器实例
        const adapter = new FeishuAdapter(config);
        
        console.log('适配器创建成功，开始测试连接...');
        
        // 测试获取表格列表
        console.log('正在获取表格列表...');
        const tables = await adapter.getTables();
        console.log('获取表格列表成功:', JSON.stringify(tables, null, 2));
        
        // 测试获取表格信息
        if (tables && tables.length > 0) {
            const tableId = tables[0].table_id;
            console.log('正在获取表格信息，表格ID:', tableId);
            const tableInfo = await adapter.getTableInfo(tableId);
            console.log('获取表格信息成功:', JSON.stringify(tableInfo, null, 2));
        }
        
        console.log('所有测试通过！');
        
    } catch (error) {
        console.error('测试失败:', error.message);
        console.error('错误详情:', error.stack);
        
        // 如果是HTTP错误，显示更多信息
        if (error.response) {
            console.error('HTTP状态码:', error.response.status);
            console.error('响应头:', error.response.headers);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
testFeishuAdapter().catch(console.error);