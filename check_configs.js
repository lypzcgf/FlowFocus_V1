// 简单的脚本用于检查Chrome存储中的配置数据
// 在Chrome开发者工具的控制台中运行此代码

// 检查tableConfigs配置数据
chrome.storage.local.get('tableConfigs', function(result) {
    console.log('tableConfigs配置数据:', JSON.stringify(result.tableConfigs, null, 2));
    
    // 查找ID为11的配置
    if (result.tableConfigs && Array.isArray(result.tableConfigs)) {
        const config11 = result.tableConfigs.find(c => c.id === '11' || c.id === 11);
        console.log('ID为11的配置:', config11);
        
        if (config11) {
            console.log('配置详情:');
            console.log('平台:', config11.platform);
            console.log('API密钥:', config11.apiKey ? '已设置' : '未设置');
            console.log('表格ID:', config11.tableId);
            console.log('应用ID:', config11.appId);
        } else {
            console.log('未找到ID为11的配置');
        }
    }
});

// 检查所有存储的键
chrome.storage.local.get(null, function(result) {
    console.log('所有存储的键:', Object.keys(result));
});