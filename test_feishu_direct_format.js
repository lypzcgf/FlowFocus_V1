// 飞书API请求体格式测试文件
// 用于直接测试不同格式的请求体，排查飞书API错误码1254001问题

/**
 * 简化版飞书API测试函数
 * 测试不同格式的请求体
 */
async function testFeishuRequestBody() {
  try {
    console.log('开始测试飞书API请求体格式...');
    
    // 配置信息
    const config = {
      appId: 'YOUR_APP_ID', // 替换为实际的App ID
      appSecret: 'YOUR_APP_SECRET', // 替换为实际的App Secret
      tableToken: 'YOUR_TABLE_TOKEN', // 替换为实际的多维表格token
      tableId: 'YOUR_TABLE_ID' // 替换为实际的多维表格ID
    };
    
    console.log('使用的配置信息:', {
      appId: config.appId ? '已设置' : '未设置',
      appSecret: config.appSecret ? '已设置 (部分隐藏: ' + config.appSecret.substring(0, 5) + '...)' : '未设置',
      tableToken: config.tableToken || '未设置',
      tableId: config.tableId || '未设置'
    });
    
    // 获取访问令牌
    console.log('正在获取访问令牌...');
    const accessToken = await getAccessToken(config.appId, config.appSecret);
    if (!accessToken) {
      throw new Error('获取访问令牌失败');
    }
    console.log('访问令牌获取成功');
    
    // 测试格式1: 最简单的请求体格式
    await testFormat1(config, accessToken);
    
    // 测试格式2: 详细的请求体格式
    await testFormat2(config, accessToken);
    
    // 测试格式3: 用户要求的数据集合字段格式
    await testFormat3(config, accessToken);
    
    console.log('所有测试完成');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

/**
 * 获取飞书访问令牌
 */
async function getAccessToken(appId, appSecret) {
  try {
    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });
    
    const data = await response.json();
    console.log('获取访问令牌响应:', {
      code: data.code,
      msg: data.msg,
      hasToken: !!data.tenant_access_token
    });
    
    return data.tenant_access_token;
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    return null;
  }
}

/**
 * 测试格式1: 最简单的请求体格式
 */
async function testFormat1(config, accessToken) {
  try {
    console.log('\n=== 测试格式1: 最简单的请求体格式 ===');
    
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.tableToken}/tables/${config.tableId}/records`;
    
    // 最简单的请求体
    const requestData = {
      fields: {
        '测试字段': '测试值'
      }
    };
    
    console.log('请求URL:', url);
    console.log('请求体:', JSON.stringify(requestData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestData)
    });
    
    const data = await response.json();
    console.log('响应状态码:', response.status);
    console.log('响应内容:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('格式1测试失败:', error);
  }
}

/**
 * 测试格式2: 详细的请求体格式
 */
async function testFormat2(config, accessToken) {
  try {
    console.log('\n=== 测试格式2: 详细的请求体格式 ===');
    
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.tableToken}/tables/${config.tableId}/records`;
    
    // 详细的请求体
    const requestData = {
      fields: {
        '配置名称': '测试配置',
        'App ID': config.appId || '未设置',
        '创建时间': new Date().toISOString()
      }
    };
    
    console.log('请求URL:', url);
    console.log('请求体:', JSON.stringify(requestData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestData)
    });
    
    const data = await response.json();
    console.log('响应状态码:', response.status);
    console.log('响应内容:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('格式2测试失败:', error);
  }
}

/**
 * 测试格式3: 用户要求的数据集合字段格式
 */
async function testFormat3(config, accessToken) {
  try {
    console.log('\n=== 测试格式3: 用户要求的数据集合字段格式 ===');
    
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.tableToken}/tables/${config.tableId}/records`;
    
    // 构建配置数据
    const configData = {
      '配置名称': '测试配置',
      'App ID': config.appId || '未设置',
      'App Secret': config.appSecret ? '已设置 (加密)' : '未设置',
      '多维表格token': config.tableToken || '未设置',
      '多维表格ID': config.tableId || '未设置',
      '创建时间': new Date().toISOString()
    };
    
    // 构建请求体
    const requestData = {
      fields: {
        '数据集合': JSON.stringify(configData)
      }
    };
    
    console.log('请求URL:', url);
    console.log('请求体:', JSON.stringify(requestData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestData)
    });
    
    const data = await response.json();
    console.log('响应状态码:', response.status);
    console.log('响应内容:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('格式3测试失败:', error);
  }
}

// 执行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  console.log('在浏览器环境中运行测试');
  window.testFeishuRequestBody = testFeishuRequestBody;
  console.log('请在控制台中执行 testFeishuRequestBody() 开始测试');
} else {
  // Node.js环境
  console.log('在Node.js环境中运行测试');
  testFeishuRequestBody();
}