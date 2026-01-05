// 调试页面
Page({
  onLoad() {
    console.log('=== 图片调试开始 ===');
    
    // 1. 测试不同路径格式
    const paths = [
      '/images/puzzle/1.jpg',
      'images/puzzle/1.jpg', 
      './images/puzzle/1.jpg',
      'miniprogram/images/puzzle/1.jpg'
    ];
    
    paths.forEach((path, index) => {
      setTimeout(() => {
        console.log(`测试路径 ${index + 1}:`, path);
        
        wx.getImageInfo({
          src: path,
          success: (res) => {
            console.log(`✅ 路径 ${index + 1} 成功:`, res);
          },
          fail: (err) => {
            console.error(`❌ 路径 ${index + 1} 失败:`, err);
          }
        });
      }, index * 300);
    });
    
    // 2. 测试文件系统访问
    const fs = wx.getFileSystemManager();
    fs.readdir({
      dirPath: '/images/puzzle',
      success: (res) => {
        console.log('📁 puzzle目录文件:', res.files);
      },
      fail: (err) => {
        console.error('❌ 无法读取puzzle目录:', err);
      }
    });
    
    // 3. 测试基础目录
    fs.readdir({
      dirPath: '/images',
      success: (res) => {
        console.log('📁 images目录文件:', res.files);
      },
      fail: (err) => {
        console.error('❌ 无法读取images目录:', err);
      }
    });
  }
});