document.addEventListener('DOMContentLoaded', function() {
  const openSidePanelButton = document.getElementById('openSidePanel');
  
  openSidePanelButton.addEventListener('click', async () => {
    try {
      // 检查是否支持侧边栏API
      if (chrome.sidePanel) {
        // 打开当前标签页的侧边栏
        await chrome.sidePanel.open({windowId: (await chrome.windows.getCurrent()).id});
        window.close();
      } else {
        console.error('Side Panel API not available');
        // 如果侧边栏API不可用，则尝试其他方式
        alert('无法打开侧边栏，请确保您的Chrome版本支持Side Panel功能');
      }
    } catch (error) {
      console.error('Error opening side panel:', error);
      alert('打开侧边栏时出错: ' + error.message);
    }
  });
});