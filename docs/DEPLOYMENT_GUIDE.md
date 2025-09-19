# FlowFocus V2.0 部署指南

## 目录

1. [概述](#概述)
2. [环境准备](#环境准备)
3. [开发环境部署](#开发环境部署)
4. [生产环境构建](#生产环境构建)
5. [Chrome插件发布](#chrome插件发布)
6. [持续集成](#持续集成)
7. [监控与维护](#监控与维护)
8. [故障排除](#故障排除)

## 概述

FlowFocus V2.0 是一个Chrome浏览器扩展程序，本指南详细介绍了从开发环境搭建到生产环境发布的完整部署流程。

### 部署架构

```
开发环境 → 构建打包 → 测试验证 → 发布部署
    ↓         ↓         ↓         ↓
  本地开发   生产构建   质量保证   用户使用
```

### 技术要求

- **Node.js**: 16.x 或更高版本
- **npm**: 8.x 或更高版本（推荐使用 pnpm）
- **Chrome**: 88+ 版本
- **操作系统**: Windows 10+, macOS 10.15+, Linux Ubuntu 18.04+

## 环境准备

### 1. 安装 Node.js

#### Windows

```bash
# 使用 Chocolatey
choco install nodejs

# 或下载安装包
# 访问 https://nodejs.org/ 下载 LTS 版本
```

#### macOS

```bash
# 使用 Homebrew
brew install node

# 使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts
```

#### Linux

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs
```

### 2. 验证安装

```bash
node --version  # 应显示 v16.x.x 或更高
npm --version   # 应显示 8.x.x 或更高
```

### 3. 安装 pnpm（推荐）

```bash
npm install -g pnpm
pnpm --version
```

### 4. 安装开发工具

```bash
# Git
# Windows: https://git-scm.com/download/win
# macOS: brew install git
# Linux: sudo apt-get install git

# VS Code（推荐）
# 下载地址: https://code.visualstudio.com/

# Chrome 开发者版本（可选）
# 下载地址: https://www.google.com/chrome/dev/
```

## 开发环境部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd FlowFocus_V1
```

### 2. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 3. 环境配置

创建环境配置文件：

```bash
# 复制环境配置模板
cp .env.example .env.local

# 编辑配置文件
vim .env.local
```

`.env.local` 示例：

```env
# 开发环境配置
NODE_ENV=development
DEBUG=true

# API 配置（可选，用于测试）
QWEN_API_KEY=your-qwen-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
VOLCES_API_KEY=your-volces-api-key
KIMI_API_KEY=your-kimi-api-key
HUNYUAN_API_KEY=your-hunyuan-api-key

# 表格平台配置（可选）
FEISHU_APP_ID=your-feishu-app-id
FEISHU_APP_SECRET=your-feishu-app-secret
```

### 4. 启动开发服务器

```bash
# 启动开发模式
pnpm run dev

# 或
npm run dev
```

### 5. 加载开发版插件

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录
6. 确认加载

### 6. 开发工作流

```bash
# 代码检查
pnpm run lint

# 代码格式化
pnpm run format

# 运行测试
pnpm run test

# 监听文件变化（开发模式）
pnpm run dev
```

## 生产环境构建

### 1. 预构建检查

```bash
# 运行所有测试
pnpm run test

# 代码质量检查
pnpm run lint

# 类型检查（如果使用 TypeScript）
pnpm run type-check
```

### 2. 生产构建

```bash
# 清理之前的构建
pnpm run clean

# 生产环境构建
pnpm run build
```

构建输出结构：

```
dist/
├── manifest.json          # 插件清单文件
├── icons/                 # 图标文件
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── background/        # 后台脚本
    │   ├── background.js
    │   └── background.js.map
    ├── content/           # 内容脚本
    │   ├── content.js
    │   └── content.js.map
    ├── sidebar/           # 侧边栏
    │   ├── sidebar.html
    │   ├── sidebar.js
    │   └── sidebar.js.map
    └── popup/             # 弹窗
        ├── popup.html
        ├── popup.js
        └── popup.js.map
```

### 3. 构建验证

```bash
# 验证构建文件
ls -la dist/

# 检查文件大小
du -sh dist/*

# 验证 manifest.json
cat dist/manifest.json | jq .
```

### 4. 本地测试

1. 在 Chrome 中加载 `dist` 目录
2. 测试所有功能
3. 检查控制台错误
4. 验证性能表现

## Chrome插件发布

### 1. 创建发布包

```bash
# 自动打包
pnpm run package

# 手动打包
cd dist
zip -r ../FlowFocus-V2.0.0.zip .
cd ..
```

打包后会生成：

```
packages/
├── FlowFocus-V2.0.0-2024-12-XX.zip    # 插件包
├── FlowFocus-V2.0.0-release-info.json # 发布信息
└── INSTALLATION_GUIDE.md               # 安装指南
```

### 2. Chrome Web Store 发布

#### 准备工作

1. **注册开发者账号**
   - 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - 支付一次性注册费用（$5）

2. **准备发布资料**
   - 插件包（.zip 文件）
   - 应用图标（128x128px）
   - 截图（1280x800px 或 640x400px）
   - 详细描述
   - 隐私政策（如需要）

#### 发布步骤

1. **上传插件包**
   ```
   Developer Dashboard → Add new item → Upload .zip file
   ```

2. **填写商店信息**
   ```
   - 名称: FlowFocus V2.0
   - 简短描述: 智能文本改写和多维表格集成工具
   - 详细描述: [详细功能介绍]
   - 类别: 生产力工具
   - 语言: 中文（简体）
   ```

3. **上传图片资源**
   ```
   - 图标: 128x128px PNG
   - 截图: 至少1张，最多5张
   - 宣传图片: 440x280px（可选）
   ```

4. **设置权限说明**
   ```
   - storage: 存储用户配置和改写记录
   - activeTab: 获取当前页面文本内容
   - scripting: 注入内容脚本
   - https://*/*: 访问大模型API服务
   ```

5. **提交审核**
   - 检查所有信息
   - 提交审核
   - 等待审核结果（通常1-3个工作日）

### 3. 企业内部分发

#### 方法一：直接分发

1. 将 `.zip` 文件分发给用户
2. 用户手动安装（开发者模式）
3. 提供安装指南

#### 方法二：企业政策部署

1. **创建企业政策文件**

```json
{
  "ExtensionInstallForcelist": [
    "extension-id;https://your-domain.com/updates.xml"
  ]
}
```

2. **配置自动更新服务器**

```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='your-extension-id'>
    <updatecheck codebase='https://your-domain.com/FlowFocus-V2.0.0.crx' version='2.0.0' />
  </app>
</gupdate>
```

### 4. 版本更新流程

1. **更新版本号**

```json
// package.json
{
  "version": "2.0.1"
}

// manifest.json
{
  "version": "2.0.1"
}
```

2. **构建新版本**

```bash
pnpm run build
pnpm run package
```

3. **发布更新**
   - Chrome Web Store: 上传新版本包
   - 企业分发: 更新下载链接
   - 用户通知: 发布更新说明

## 持续集成

### GitHub Actions 配置

创建 `.github/workflows/ci.yml`：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm run test
    
    - name: Build project
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: dist/

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build and package
      run: |
        npm run build
        npm run package
    
    - name: Create Release
      if: startsWith(github.ref, 'refs/tags/')
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: FlowFocus V${{ github.ref }}
        draft: false
        prerelease: false
    
    - name: Upload Release Asset
      if: startsWith(github.ref, 'refs/tags/')
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ steps.create_release.outputs.upload_url }}
        asset_path: ./packages/FlowFocus-V2.0.0.zip
        asset_name: FlowFocus-V2.0.0.zip
        asset_content_type: application/zip
```

### 自动化测试

```yaml
# .github/workflows/test.yml
name: Automated Testing

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点运行
  workflow_dispatch:

jobs:
  e2e-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Chrome
      uses: browser-actions/setup-chrome@latest
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build extension
      run: npm run build
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: test-results/
```

## 监控与维护

### 1. 性能监控

```javascript
// 性能监控配置
const performanceConfig = {
    // 内存使用监控
    memoryThreshold: 100, // MB
    
    // API响应时间监控
    apiTimeoutThreshold: 5000, // ms
    
    // 错误率监控
    errorRateThreshold: 0.05, // 5%
    
    // 监控间隔
    monitoringInterval: 60000 // 1分钟
};
```

### 2. 错误收集

```javascript
// 错误上报服务
class ErrorReporter {
    static report(error, context) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            version: chrome.runtime.getManifest().version,
            userAgent: navigator.userAgent
        };
        
        // 发送到错误收集服务
        this.sendToService(errorData);
    }
    
    static sendToService(data) {
        // 实现错误上报逻辑
        console.error('Error reported:', data);
    }
}
```

### 3. 用户反馈收集

```javascript
// 用户反馈系统
class FeedbackCollector {
    static collectFeedback(type, content, metadata = {}) {
        const feedback = {
            type, // 'bug', 'feature', 'improvement'
            content,
            metadata,
            timestamp: new Date().toISOString(),
            version: chrome.runtime.getManifest().version
        };
        
        this.sendFeedback(feedback);
    }
    
    static sendFeedback(feedback) {
        // 发送反馈到收集服务
        console.log('Feedback collected:', feedback);
    }
}
```

### 4. 自动更新检查

```javascript
// 更新检查服务
class UpdateChecker {
    static async checkForUpdates() {
        try {
            const currentVersion = chrome.runtime.getManifest().version;
            const response = await fetch('https://api.example.com/version');
            const { latestVersion, updateInfo } = await response.json();
            
            if (this.isNewerVersion(latestVersion, currentVersion)) {
                this.notifyUpdate(updateInfo);
            }
        } catch (error) {
            console.error('Update check failed:', error);
        }
    }
    
    static isNewerVersion(latest, current) {
        return latest.localeCompare(current, undefined, { numeric: true }) > 0;
    }
    
    static notifyUpdate(updateInfo) {
        // 通知用户有新版本可用
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'FlowFocus 更新可用',
            message: `新版本 ${updateInfo.version} 已发布`
        });
    }
}
```

## 故障排除

### 常见构建问题

#### 1. 依赖安装失败

```bash
# 清理缓存
npm cache clean --force
pnpm store prune

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 2. 构建内存不足

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### 3. Webpack 构建错误

```bash
# 查看详细错误信息
npm run build -- --verbose

# 分析构建包大小
npm run build -- --analyze
```

### 运行时问题

#### 1. 插件无法加载

- 检查 manifest.json 语法
- 验证文件路径正确性
- 查看 Chrome 扩展页面错误信息

#### 2. API 调用失败

- 检查网络连接
- 验证 API 密钥有效性
- 查看控制台错误日志

#### 3. 性能问题

- 使用 Chrome DevTools 分析性能
- 检查内存使用情况
- 优化代码和资源加载

### 调试工具

#### 1. Chrome DevTools

```javascript
// 在代码中添加调试断点
debugger;

// 使用 console 输出调试信息
console.log('Debug info:', data);
console.error('Error occurred:', error);
console.time('Performance test');
// ... 代码执行
console.timeEnd('Performance test');
```

#### 2. 扩展调试

```bash
# 在 Chrome 中打开扩展调试页面
chrome://extensions/

# 点击"检查视图"查看后台页面
# 点击"错误"查看错误日志
```

#### 3. 网络调试

```javascript
// 网络请求拦截和调试
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetch request:', args);
    return originalFetch.apply(this, args)
        .then(response => {
            console.log('Fetch response:', response);
            return response;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            throw error;
        });
};
```

---

## 安全注意事项

### 1. API 密钥管理

- 不要在代码中硬编码 API 密钥
- 使用环境变量或安全存储
- 定期轮换 API 密钥
- 限制 API 密钥权限

### 2. 数据安全

- 加密敏感数据存储
- 使用 HTTPS 进行网络通信
- 验证用户输入数据
- 实施访问控制

### 3. 权限最小化

- 只请求必要的浏览器权限
- 限制网络访问范围
- 定期审查权限使用

---

## 版本发布检查清单

### 发布前检查

- [ ] 所有测试通过
- [ ] 代码质量检查通过
- [ ] 性能测试满足要求
- [ ] 安全审查完成
- [ ] 文档更新完整
- [ ] 版本号正确更新
- [ ] 更新日志编写完成

### 发布后验证

- [ ] 插件正常加载
- [ ] 核心功能正常工作
- [ ] 性能指标正常
- [ ] 错误率在可接受范围
- [ ] 用户反馈收集正常

---

**最后更新**: 2024-12-XX  
**文档版本**: 1.0.0  
**适用版本**: FlowFocus V2.0.0+