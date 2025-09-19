@echo off
echo FlowFocus 构建脚本
echo ==================

echo 清理旧的构建目录...
if exist dist rmdir /s /q dist

echo 创建目录结构...
mkdir dist
mkdir dist\sidebar
mkdir dist\background
mkdir dist\content
mkdir dist\services
mkdir dist\utils
mkdir dist\icons
mkdir dist\models
mkdir dist\styles

echo 复制文件...
copy manifest.json dist\
copy src\sidebar\* dist\sidebar\
copy src\background\* dist\background\
copy src\content\* dist\content\
xcopy src\services\* dist\services\ /s /e
copy src\utils\* dist\utils\
copy src\models\* dist\models\
copy src\styles\* dist\styles\
copy icons\* dist\icons\

echo 构建完成！
echo 文件已复制到正确的目录结构中：
echo - dist\sidebar\ - 侧边栏相关文件
echo - dist\background\ - 后台服务文件
echo - dist\content\ - 内容脚本文件