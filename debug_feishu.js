// 飞书适配器调试脚本
const axios = require('axios');

// 使用用户提供的配置
const config = {
    appId: 'cli_a83161fe68be1013',
    appSecret: 'gzqMVM6UZJhOzRHwGyXmChjUQamffTmo',
    tableToken: 'DROzbmJw8aDik9sExJtcq98anjh'
};

async function debugFeishu() {
    console.log('开始调试飞书API...');
    
    try {
        // 1. 测试获取访问令牌
        console.log('\n1. 测试获取访问令牌...');
        const tokenResponse = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: config.appId,
            app_secret: config.appSecret
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('访问令牌响应:', JSON.stringify(tokenResponse.data, null, 2));
        
        if (tokenResponse.data.code !== 0) {
            console.error('获取访问令牌失败:', tokenResponse.data.msg);
            return;
        }
        
        const accessToken = tokenResponse.data.tenant_access_token;
        console.log('访问令牌获取成功:', accessToken.substring(0, 20) + '...');
        
        // 2. 测试获取表格列表
        console.log('\n2. 测试获取表格列表...');
        const tablesResponse = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.tableToken}/tables`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('表格列表响应:', JSON.stringify(tablesResponse.data, null, 2));
        
        if (tablesResponse.data.code !== 0) {
            console.error('获取表格列表失败:', tablesResponse.data.msg);
            return;
        }
        
        console.log('表格列表获取成功!');
        const tables = tablesResponse.data.data.items || [];
        console.log(`找到 ${tables.length} 个表格:`);
        tables.forEach((table, index) => {
            console.log(`  ${index + 1}. ${table.name} (ID: ${table.table_id})`);
        });
        
    } catch (error) {
        console.error('调试过程中出现错误:');
        
        if (error.response) {
            // HTTP错误
            console.error('HTTP状态码:', error.response.status);
            console.error('响应头:', error.response.headers);
            console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
            
            if (error.response.data && error.response.data.code) {
                console.error('飞书错误码:', error.response.data.code);
                console.error('错误消息:', error.response.data.msg);
            }
        } else if (error.request) {
            // 网络错误
            console.error('网络错误:', error.message);
            console.error('请求配置:', error.config);
        } else {
            // 其他错误
            console.error('错误:', error.message);
        }
        
        console.error('完整错误堆栈:', error.stack);
    }
}

// 运行调试
debugFeishu().catch(console.error);