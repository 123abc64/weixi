# 小程序前端配置指南

## 页面集成

### 1. 添加页面配置
在 `app.json` 中添加新页面：
```json
{
  "pages": [
    "pages/index/index",
    "pages/upload/upload",
    "pages/split/split"  // 添加这一行
  ]
}
```

### 2. 修改后端地址
在 `split.js` 中修改：
```javascript
data: {
  baseUrl: "http://localhost:8000",  // 修改为你的后端地址
  // ...
}
```

### 3. 开发环境配置
在微信开发者工具中：
- 设置 → 项目设置 → 本地设置
- 勾选"不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书"

### 4. 生产环境配置
在微信公众平台：
- 开发管理 → 开发设置 → 服务器域名
- 添加 request 合法域名：https://your-domain.com

## 功能说明

### 上传流程
1. 用户点击上传区域
2. 选择图片（相册/拍照）
3. 自动上传到后端
4. 后端切割成3×3九宫格
5. 返回9张图片URL
6. 显示切割结果预览
7. 用户可开始拼图游戏

### 游戏规则
- 9宫格拼图，8块图片+1个空位
- 点击与空格相邻的图片块进行移动
- 将所有图片块移回正确位置即获胜
- 支持显示数字提示
- 记录步数和时间

## 接口说明

### 上传接口
- **URL**: `/upload`
- **方法**: POST
- **参数**: 
  - `file`: 图片文件（multipart/form-data）
- **响应**:
```json
{
  "code": 200,
  "message": "图片切割成功",
  "data": {
    "original_url": "/static/uploads/xxx.jpg",
    "grid_urls": [
      "/static/grid_images/xxx_1.jpg",
      "/static/grid_images/xxx_2.jpg",
      // ... 共9张
    ],
    "unique_name": "uuid"
  }
}
```

### 健康检查
- **URL**: `/health`
- **方法**: GET
- **响应**: `{"status": "healthy", "service": "image-splitter"}`

## 样式定制

### 主题色修改
在 `split.wxss` 中修改：
```css
.container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 尺寸调整
```css
.upload-box {
  width: 600rpx;  /* 上传区域大小 */
  height: 600rpx;
}

.puzzle-grid {
  width: 600rpx;  /* 拼图区域大小 */
  height: 600rpx;
}
```

## 测试建议

### 测试图片
- **推荐尺寸**: 600x600 正方形图片
- **支持格式**: JPG/PNG/WEBP
- **文件大小**: 建议 < 5MB

### 测试流程
1. 上传一张正方形图片
2. 确认切割结果显示9块
3. 点击"开始拼图游戏"
4. 验证拼图块可以移动
5. 测试胜利检测功能

## 错误处理

### 常见错误及解决
1. **"网络连接失败"**
   - 检查后端服务是否启动
   - 确认网络连接

2. **"没有上传权限"**
   - 检查小程序权限设置
   - 重新授权

3. **"图片处理失败"**
   - 检查图片格式和大小
   - 查看后端日志

4. **"数据解析失败"**
   - 检查后端响应格式
   - 确认接口返回JSON

## 性能优化

### 前端优化
- 图片压缩上传
- 上传进度显示
- 错误重试机制

### 后端优化
- 异步处理
- 图片质量优化
- 缓存机制

## 扩展功能

### 可添加的功能
- 图片编辑（裁剪、滤镜）
- 难度选择（3x3, 4x4, 5x5）
- 排行榜
- 分享功能
- 用户系统