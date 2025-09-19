// 飞书配置验证脚本
// 这个脚本帮助验证飞书配置是否正确

const config = {
    appId: 'cli_a83161fe68be1013',
    appSecret: 'gzqMVM6UZJhOzRHwGyXmChjUQamffTmo',
    tableToken: 'DROzbmJw8aDik9sExJtcq98anjh'
};

console.log('飞书配置验证:');
console.log('================================');

// 验证App ID格式
console.log('1. App ID 格式验证:');
if (config.appId && config.appId.startsWith('cli_') && config.appId.length > 10) {
    console.log('   ✅ App ID 格式正确');
} else {
    console.log('   ❌ App ID 格式错误');
}

// 验证App Secret格式
console.log('2. App Secret 格式验证:');
if (config.appSecret && config.appSecret.length >= 32) {
    console.log('   ✅ App Secret 格式正确');
} else {
    console.log('   ❌ App Secret 格式错误');
}

// 验证Table Token格式
console.log('3. Table Token 格式验证:');
if (config.tableToken && config.tableToken.length >= 20) {
    console.log('   ✅ Table Token 格式正确');
    
    // 检查是否为有效的多维表格token
    if (config.tableToken.startsWith('bascn') || config.tableToken.startsWith('tbl')) {
        console.log('   ✅ 可能是有效的多维表格token');
    } else {
        console.log('   ⚠️  token格式不常见，请确认是否正确');
    }
} else {
    console.log('   ❌ Table Token 格式错误');
}

console.log('');
console.log('常见问题排查:');
console.log('================================');
console.log('1. 确保飞书应用已开启以下权限:');
console.log('   - 获取 tenant_access_token');
console.log('   - 多维表格: 读取表格信息');
console.log('   - 多维表格: 读取记录');
console.log('');
console.log('2. 检查应用是否发布:');
console.log('   - 开发环境应用需要先发布才能正常使用');
console.log('   - 或者使用测试版功能');
console.log('');
console.log('3. 检查表格token是否正确:');
console.log('   - 打开飞书多维表格');
console.log('   - 在浏览器地址栏查看URL中的appToken参数');
console.log('   - 格式通常为: bascnxxxxxxxxxxxxxxxx');
console.log('');
console.log('4. HTTP 400错误通常表示:');
console.log('   - 无效的访问令牌');
console.log('   - 应用权限不足');
console.log('   - 请求参数错误');
console.log('   - 资源不存在');

console.log('');
console.log('下一步操作建议:');
console.log('================================');
console.log('1. 登录飞书开放平台: https://open.feishu.cn/');
console.log('2. 找到您的应用: ' + config.appId);
console.log('3. 检查"权限配置"是否包含多维表格相关权限');
console.log('4. 检查"安全设置"中的IP白名单（如果有）');
console.log('5. 尝试在浏览器中直接访问API测试');

// 生成测试URL
console.log('');
console.log('API测试URL (需要在浏览器中手动添加Authorization头):');
console.log('GET https://open.feishu.cn/open-apis/bitable/v1/apps/' + config.tableToken + '/tables');
console.log('Header: Authorization: Bearer {您的access_token}');