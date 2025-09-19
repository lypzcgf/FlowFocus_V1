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
New-Item -ItemType Directory -Path dist\sidebar -Force
New-Item -ItemType Directory -Path dist\background -Force
New-Item -ItemType Directory -Path dist\content -Force
New-Item -ItemType Directory -Path dist\services -Force
New-Item -ItemType Directory -Path dist\utils -Force
New-Item -ItemType Directory -Path dist\icons -Force
New-Item -ItemType Directory -Path dist\models -Force
New-Item -ItemType Directory -Path dist\styles -Force

# 复制文件
Write-Host "复制文件..."
Copy-Item manifest.json dist\
Copy-Item src\sidebar\* dist\sidebar\
Copy-Item src\background\* dist\background\
Copy-Item src\content\* dist\content\
Copy-Item src\services\* -Recurse dist\services\
Copy-Item src\utils\* dist\utils\
Copy-Item src\models\* dist\models\
Copy-Item src\styles\* dist\styles\
Copy-Item icons\* dist\icons\

Write-Host "构建完成！"
Write-Host "文件已复制到正确的目录结构中："
Write-Host "- dist\sidebar\" - 侧边栏相关文件"
Write-Host "- dist\background\" - 后台服务文件"
Write-Host "- dist\content\" - 内容脚本文件"