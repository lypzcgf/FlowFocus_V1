/**
 * FlowFocus V2.0 Chrome插件打包脚本
 * 用于生成可发布的Chrome插件包
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class ChromeExtensionPackager {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.distDir = path.join(this.projectRoot, 'dist');
        this.packageDir = path.join(this.projectRoot, 'packages');
        this.version = this.getVersion();
    }

    // 获取版本号
    getVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
            return packageJson.version || '2.0.0';
        } catch (error) {
            console.warn('无法读取版本号，使用默认版本 2.0.0');
            return '2.0.0';
        }
    }

    // 创建打包目录
    ensurePackageDir() {
        if (!fs.existsSync(this.packageDir)) {
            fs.mkdirSync(this.packageDir, { recursive: true });
            console.log('创建打包目录:', this.packageDir);
        }
    }

    // 验证构建文件
    validateBuildFiles() {
        const requiredFiles = [
            'manifest.json',
            'src/background/background.js',
            'src/content/content.js',
            'src/sidebar/sidebar.js',
            'src/sidebar/sidebar.html',
            'src/popup/popup.js',
            'icons/icon16.png',
            'icons/icon48.png',
            'icons/icon128.png'
        ];

        const missingFiles = [];
        
        for (const file of requiredFiles) {
            const filePath = path.join(this.distDir, file);
            if (!fs.existsSync(filePath)) {
                missingFiles.push(file);
            }
        }

        if (missingFiles.length > 0) {
            throw new Error(`缺少必要的构建文件: ${missingFiles.join(', ')}`);
        }

        console.log('✓ 所有必要文件验证通过');
    }

    // 创建zip包
    async createZipPackage() {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const zipFileName = `FlowFocus-V${this.version}-${timestamp}.zip`;
            const zipFilePath = path.join(this.packageDir, zipFileName);

            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // 最高压缩级别
            });

            output.on('close', () => {
                const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
                console.log(`✓ Chrome插件包创建成功: ${zipFileName}`);
                console.log(`  文件大小: ${sizeInMB} MB`);
                console.log(`  文件路径: ${zipFilePath}`);
                resolve(zipFilePath);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // 添加dist目录下的所有文件
            archive.directory(this.distDir, false);

            archive.finalize();
        });
    }

    // 生成发布信息
    generateReleaseInfo(zipFilePath) {
        const releaseInfo = {
            name: 'FlowFocus V2.0',
            version: this.version,
            buildDate: new Date().toISOString(),
            packageFile: path.basename(zipFilePath),
            packageSize: this.getFileSize(zipFilePath),
            features: [
                '支持5种大模型（通义千问、DeepSeek、豆包、Kimi、混元）',
                '多维表格集成（飞书、钉钉、企业微信）',
                '智能文本改写功能',
                '数据同步管理',
                '性能优化和内存管理',
                '用户友好的界面设计'
            ],
            requirements: {
                chrome: '88+',
                permissions: [
                    'storage',
                    'activeTab',
                    'scripting',
                    'https://*/*'
                ]
            },
            installation: [
                '1. 下载 FlowFocus V2.0 插件包',
                '2. 打开 Chrome 浏览器，进入扩展程序管理页面 (chrome://extensions/)',
                '3. 开启"开发者模式"',
                '4. 点击"加载已解压的扩展程序"',
                '5. 选择解压后的插件文件夹',
                '6. 插件安装完成，可在工具栏看到 FlowFocus 图标'
            ]
        };

        const releaseInfoPath = path.join(this.packageDir, `FlowFocus-V${this.version}-release-info.json`);
        fs.writeFileSync(releaseInfoPath, JSON.stringify(releaseInfo, null, 2), 'utf8');
        
        console.log(`✓ 发布信息已生成: ${releaseInfoPath}`);
        return releaseInfo;
    }

    // 获取文件大小
    getFileSize(filePath) {
        const stats = fs.statSync(filePath);
        const sizeInBytes = stats.size;
        const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
        return `${sizeInMB} MB`;
    }

    // 生成安装说明
    generateInstallationGuide() {
        const guide = `# FlowFocus V2.0 安装指南

## 系统要求
- Chrome 浏览器 88+ 版本
- 支持现代 JavaScript 特性

## 安装步骤

### 方法一：开发者模式安装（推荐）
1. 下载并解压 FlowFocus V2.0 插件包
2. 打开 Chrome 浏览器
3. 在地址栏输入 \`chrome://extensions/\` 并回车
4. 在右上角开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的插件文件夹
7. 插件安装完成

### 方法二：拖拽安装
1. 下载 FlowFocus V2.0 插件包（.zip文件）
2. 打开 Chrome 扩展程序管理页面 (chrome://extensions/)
3. 开启"开发者模式"
4. 将 .zip 文件直接拖拽到页面中
5. 确认安装

## 使用说明

### 首次配置
1. 安装完成后，点击浏览器工具栏中的 FlowFocus 图标
2. 在侧边栏中配置您的大模型 API
3. 配置多维表格连接（可选）
4. 开始使用文本改写功能

### 功能介绍

#### 大模型配置
- 支持通义千问、DeepSeek、豆包、Kimi、混元等5种大模型
- 可配置多个模型实例
- 支持自定义 API 端点和参数

#### 文本改写
- 选择网页中的文本
- 右键选择"FlowFocus 改写"
- 选择改写模式和目标模型
- 查看改写结果

#### 多维表格集成
- 支持飞书、钉钉、企业微信多维表格
- 自动同步改写记录
- 数据统计和分析

#### 同步管理
- 查看同步历史
- 管理同步配置
- 监控同步状态

## 故障排除

### 常见问题

**Q: 插件无法加载？**
A: 请确保已开启开发者模式，并检查文件权限。

**Q: API 调用失败？**
A: 请检查 API 密钥是否正确，网络连接是否正常。

**Q: 表格同步失败？**
A: 请检查表格配置信息，确保有足够的权限。

**Q: 性能问题？**
A: 可以在设置中清理缓存，或重启浏览器。

### 技术支持
如遇到其他问题，请查看控制台错误信息，或联系技术支持。

## 更新日志

### V2.0.0
- 全新的用户界面设计
- 支持5种主流大模型
- 多维表格集成功能
- 性能优化和内存管理
- 增强的错误处理机制
- 完善的用户体验

---

**注意**: 本插件仅供学习和研究使用，请遵守相关服务提供商的使用条款。
`;

        const guidePath = path.join(this.packageDir, 'INSTALLATION_GUIDE.md');
        fs.writeFileSync(guidePath, guide, 'utf8');
        
        console.log(`✓ 安装指南已生成: ${guidePath}`);
    }

    // 主打包流程
    async package() {
        try {
            console.log('🚀 开始打包 FlowFocus V2.0 Chrome插件...');
            console.log(`版本: ${this.version}`);
            
            // 1. 创建打包目录
            this.ensurePackageDir();
            
            // 2. 验证构建文件
            this.validateBuildFiles();
            
            // 3. 创建zip包
            const zipFilePath = await this.createZipPackage();
            
            // 4. 生成发布信息
            const releaseInfo = this.generateReleaseInfo(zipFilePath);
            
            // 5. 生成安装指南
            this.generateInstallationGuide();
            
            console.log('\n🎉 打包完成！');
            console.log('\n📦 生成的文件:');
            console.log(`  - Chrome插件包: ${path.basename(zipFilePath)}`);
            console.log(`  - 发布信息: FlowFocus-V${this.version}-release-info.json`);
            console.log(`  - 安装指南: INSTALLATION_GUIDE.md`);
            console.log(`\n📁 打包目录: ${this.packageDir}`);
            
            return {
                success: true,
                zipFilePath,
                releaseInfo,
                packageDir: this.packageDir
            };
            
        } catch (error) {
            console.error('❌ 打包失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const packager = new ChromeExtensionPackager();
    packager.package().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = ChromeExtensionPackager;