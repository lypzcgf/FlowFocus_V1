# FlowFocus 构建脚本
Write-Host "FlowFocus 构建脚本"
Write-Host "=================="

# 清理旧的构建目录
Write-Host "清理旧的构建目录..."
if (Test-Path dist) {
    Remove-Item -Recurse -Force dist
}

# 创建目录结构
Write-Host "创建目录结构..."
New-Item -ItemType Directory -Path dist -Force
New-Item -ItemType Directory -Path dist\src -Force
New-Item -ItemType Directory -Path dist\src\sidebar -Force
New-Item -ItemType Directory -Path dist\src\background -Force
New-Item -ItemType Directory -Path dist\src\content -Force
New-Item -ItemType Directory -Path dist\src\services -Force
New-Item -ItemType Directory -Path dist\src\utils -Force
New-Item -ItemType Directory -Path dist\icons -Force

# 复制文件
Write-Host "复制文件..."
Copy-Item manifest.json dist\
Copy-Item src\sidebar\* dist\src\sidebar\
Copy-Item src\background\* dist\src\background\
Copy-Item src\content\* dist\src\content\
Copy-Item src\services\* dist\src\services\
Copy-Item src\utils\* dist\src\utils\

Write-Host "构建完成！"
Write-Host "请确保icons目录中有必要的图标文件："
Write-Host "- icons\icon16.png"
Write-Host "- icons\icon48.png"
Write-Host "- icons\icon128.png"