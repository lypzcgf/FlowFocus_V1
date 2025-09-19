// 诊断配置问题的详细脚本
// 在Chrome开发者工具的控制台中运行此代码

console.log('=== FlowFocus配置诊断工具 ===');

// 检查所有配置数据
chrome.storage.local.get(['tableConfigs', 'modelConfigs'], function(result) {
    console.log('\n1. 存储的配置键:', Object.keys(result));
    
    // 检查tableConfigs
    if (result.tableConfigs && Array.isArray(result.tableConfigs)) {
        console.log('\n2. 多维表格配置数量:', result.tableConfigs.length);
        
        // 查找ID为11的配置
        const config11 = result.tableConfigs.find(c => 
            c.id === '11' || c.id === 11 || c.name && c.name.includes('11')
        );
        
        if (config11) {
            console.log('\n3. 找到ID为11的配置:');
            console.log('   配置对象:', JSON.stringify(config11, null, 2));
            console.log('   平台类型:', config11.platform || '未设置');
            console.log('   API密钥:', config11.apiKey ? '已设置(' + config11.apiKey.substring(0, 10) + '...)' : '未设置');
            console.log('   表格ID:', config11.tableId || '未设置');
            console.log('   应用ID:', config11.appId || '未设置');
            console.log('   基础URL:', config11.baseUrl || '使用默认');
            
            // 检查配置完整性
            const requiredFields = ['platform', 'apiKey', 'tableId'];
            const missingFields = requiredFields.filter(field => !config11[field]);
            
            if (missingFields.length > 0) {
                console.log('   ❌ 配置不完整，缺少字段:', missingFields);
            } else {
                console.log('   ✅ 配置完整');
            }
            
        } else {
            console.log('\n3. ❌ 未找到ID为11的配置');
            console.log('   所有配置ID:', result.tableConfigs.map(c => c.id));
        }
        
        // 显示所有配置的概要
        console.log('\n4. 所有多维表格配置概要:');
        result.tableConfigs.forEach((config, index) => {
            console.log(`   ${index + 1}. ${config.name || '未命名'} (ID: ${config.id}, 平台: ${config.platform || '未设置'})`);
        });
        
    } else {
        console.log('\n2. ❌ 未找到tableConfigs配置数据');
    }
    
    // 检查modelConfigs
    if (result.modelConfigs && Array.isArray(result.modelConfigs)) {
        console.log('\n5. 大模型配置数量:', result.modelConfigs.length);
    }
    
    console.log('\n=== 诊断完成 ===');
    console.log('建议: 如果配置不完整，请编辑相应的配置或创建新的配置');
});