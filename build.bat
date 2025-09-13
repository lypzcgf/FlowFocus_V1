@echo off
echo FlowFocus 构建脚本
echo ==================

echo 清理旧的构建目录...
if exist dist rmdir /s /q dist

echo 创建目录结构...
mkdir dist
mkdir dist\src
mkdir dist\src\sidebar
mkdir dist\src\background
mkdir dist\src\content
mkdir dist\src\services
mkdir dist\src\utils
mkdir dist\icons

echo 复制文件...
copy manifest.json dist\
copy src\sidebar\* dist\src\sidebar\
copy src\background\* dist\src\background\
copy src\content\* dist\src\content\
copy src\services\* dist\src\services\
copy src\utils\* dist\src\utils\

echo 构建完成！
echo 请确保icons目录中有必要的图标文件：
echo - icons\icon16.png
echo - icons\icon48.png
echo - icons\icon128.png