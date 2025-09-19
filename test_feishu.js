// 测试飞书适配器
import FeishuAdapter from './src/services/adapters/feishuAdapter.js';

// 配置信息 - 请替换为实际的飞书配置
const config = {
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  tableToken: 'your_table_token',
  tableId: 'your_table_id', // 可选
  platform: 'feishu',
  retryCount: 3,
  retryDelay: 1000,
  timeout: 10000
};

async function testFeishuAdapter() {
  try {
    console.log('创建飞书适配器实例...');
    const adapter = new FeishuAdapter(config);
    
    console.log('测试连接...');
    const isConnected = await adapter.testConnection();
    console.log('连接测试结果:', isConnected);
    
    if (isConnected) {
      console.log('获取表格信息...');
      const tableInfo = await adapter.getTableInfo();
      console.log('表格信息:', tableInfo);
      
      console.log('获取表格列表...');
      const tables = await adapter.getTables();
      console.log('表格列表:', tables);
      
      console.log('测试成功！');
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testFeishuAdapter();