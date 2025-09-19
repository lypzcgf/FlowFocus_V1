# Simple build script for FlowFocus

# Clean up previous build
echo "Cleaning up old build directory..."
if (Test-Path dist) {
    Remove-Item -Recurse -Force dist
}

# Create directory structure
echo "Creating directory structure..."
New-Item -ItemType Directory -Path dist -Force
New-Item -ItemType Directory -Path dist\sidebar -Force
New-Item -ItemType Directory -Path dist\background -Force
New-Item -ItemType Directory -Path dist\content -Force
New-Item -ItemType Directory -Path dist\services -Force
New-Item -ItemType Directory -Path dist\utils -Force
New-Item -ItemType Directory -Path dist\icons -Force
New-Item -ItemType Directory -Path dist\models -Force
New-Item -ItemType Directory -Path dist\styles -Force

# Copy files
echo "Copying files..."
Copy-Item manifest.json dist\
Copy-Item src\sidebar\* dist\sidebar\
Copy-Item src\background\* dist\background\
Copy-Item src\content\* dist\content\
Copy-Item src\services\* -Recurse dist\services\
Copy-Item src\utils\* dist\utils\
Copy-Item src\models\* dist\models\
Copy-Item src\styles\* dist\styles\
Copy-Item icons\* dist\icons\

echo "Build completed successfully!"