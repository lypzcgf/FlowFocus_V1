// 飞书配置修复脚本

// 用户提供的配置
const userConfig = {
    appId: 'cli_a83161fe68be1013',
    appSecret: 'gzqMVM6UZJhOzRHwGyXmChjUQamffTmo',
    tableToken: 'DROzbmJw8aDik9sExJtcq98anjh'
};

console.log('飞书配置问题诊断:');
console.log('================================');

// 分析tableToken问题
console.log('当前tableToken:', userConfig.tableToken);
console.log('长度:', userConfig.tableToken.length, '字符');

if (!userConfig.tableToken.startsWith('bascn')) {
    console.log('❌ 问题: tableToken不是标准的多维表格app_token格式');
    console.log('   飞书多维表格app_token通常以 "bascn" 开头');
    console.log('   您提供的token可能是表格ID或其他标识符');
} else {
    console.log('✅ tableToken格式正确');
}

console.log('');
console.log('如何获取正确的app_token:');
console.log('================================');
console.log('1. 打开飞书多维表格');
console.log('2. 在浏览器中查看地址栏URL');
console.log('3. 寻找类似这样的参数: appToken=bascnxxxxxxxxxxxxxxxx');
console.log('4. 复制 bascnxxxxxxxxxxxxxxxx 部分作为app_token');

console.log('');
console.log('示例URL格式:');
console.log('https://example.feishu.cn/base/bascnAbCdEfGhIjKlMnOpQrStUvWx?table=tblAbCdEfGhIjKlMn');
console.log('↑ 这里的 bascnAbCdEfGhIjKlMnOpQrStUvWx 就是app_token');

console.log('');
console.log('如果您确实有正确的app_token，请替换下面的配置:');
console.log('================================');

// 生成修复后的配置模板
const fixedConfig = {
    appId: userConfig.appId,
    appSecret: userConfig.appSecret,
    tableToken: 'bascnxxxxxxxxxxxxxxxx' // 请替换为正确的app_token
};

console.log('修复后的配置模板:');
console.log(JSON.stringify(fixedConfig, null, 2));

console.log('');
console.log('验证您的app_token:');
console.log('================================');
console.log('1. 正确的app_token应该:');
console.log('   - 以 "bascn" 开头');
console.log('   - 长度通常在20-32字符之间');
console.log('   - 只包含字母和数字');

console.log('');
console.log('2. 您提供的token分析:');
console.log('   - 开头: "' + userConfig.tableToken.substring(0, 5) + '"');
console.log('   - 看起来更像是表格ID或记录ID');

console.log('');
console.log('立即操作建议:');
console.log('================================');
console.log('1. 重新打开您的飞书多维表格');
console.log('2. 从浏览器地址栏复制正确的app_token');
console.log('3. 替换配置中的 tableToken 字段');
console.log('4. 重新测试连接');