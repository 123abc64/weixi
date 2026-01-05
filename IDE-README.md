# 自定义拼图游戏 - IDE 开发指南

## 📋 项目概述

这是一个基于微信小程序的智能图片切割拼图游戏，支持用户上传自定义图片，通过后端服务进行3×3九宫格切割，实现真实的拼图游戏体验。

### 🎯 核心功能

- **智能图片切割**：用户上传图片 → 后端3×3切割 → 返回9张拼图块
- **拼图游戏**：传统九宫格拼图玩法（8块图片+1个空位）
- **完整游戏系统**：计步、计时、胜利检测、预览功能
- **双重架构**：微信小程序前端 + FastAPI后端服务

## 🏗️ 项目架构

```
拼图游戏/
├── backend/                          # 后端服务（FastAPI）
│   ├── main.py                       # 主服务文件
│   ├── requirements.txt                # Python依赖
│   └── README.md                     # 后端部署指南
│
├── miniprogram/                      # 微信小程序前端
│   ├── app.js                        # 小程序入口
│   ├── app.json                      # 小程序配置
│   ├── pages/                        # 页面目录
│   │   ├── index/                    # 首页
│   │   ├── upload/                   # 图片上传页面（Canvas切割）
│   │   └── split/                    # 智能切割页面（后端切割）
│   │       ├── split.js               # 页面逻辑
│   │       ├── split.wxml             # 页面结构
│   │       ├── split.wxss             # 页面样式
│   │       ├── split.json             # 页面配置
│   │       └── README.md             # 前端配置指南
│   └── utils/                       # 工具函数
│
├── 拼图游戏使用说明.md               # 用户使用手册
├── 图片处理失败诊断指南.md             # 问题诊断指南
└── IDE-README.md                    # 本文件（IDE开发指南）
```

## 🛠️ 技术栈

### 前端技术
- **框架**：微信小程序原生框架
- **UI设计**：现代化渐变背景，流畅动画
- **组件库**：自定义组件
- **API**：wx.chooseMedia, wx.uploadFile, wx.downloadFile

### 后端技术
- **框架**：FastAPI 0.104.1
- **服务器**：Uvicorn ASGI服务器
- **图片处理**：Pillow (PIL) 10.0.1
- **文件上传**：python-multipart
- **异步IO**：aiofiles

## 🚀 快速开始

### 前置要求

- **微信开发者工具**：最新稳定版
- **Python**：3.8+（推荐3.9）
- **Node.js**：小程序开发需要

### 1. 克隆项目

```bash
cd "d:/大二上/拼图游戏"
```

### 2. 配置后端

```bash
# 进入后端目录
cd backend

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 启动后端服务

```bash
# 开发模式（带自动重载）
python main.py

# 或使用uvicorn直接启动
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

后端将在 `http://localhost:8000` 启动

### 4. 配置小程序

#### 修改后端地址

打开 `miniprogram/pages/split/split.js`，修改baseUrl：

```javascript
Page({
  data: {
    baseUrl: "http://localhost:8000",  // 修改为你的后端地址
    // ...
  }
});
```

#### 配置开发者工具

1. 打开微信开发者工具
2. 导入项目：选择 `miniprogram` 目录
3. 设置 → 项目设置 → 本地设置
4. 勾选"不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书"

### 5. 运行小程序

在微信开发者工具中点击"编译"即可预览

## 📖 开发指南

### 前端开发

#### 文件结构说明

**split.js** - 页面逻辑
- `chooseImage()`: 选择图片
- `uploadAndSplit()`: 上传到后端
- `startGame()`: 开始游戏
- `movePiece()`: 移动拼图块
- `checkWin()`: 检查胜利条件

**split.wxml** - 页面结构
- 上传区域
- 切割结果预览
- 拼图游戏区域
- 胜利弹窗

**split.wxss** - 页面样式
- 渐变背景
- 网格布局
- 动画效果

#### 修改接口地址

```javascript
// 在 split.js 中修改
data: {
  baseUrl: "http://your-backend-ip:8000",  // 修改这里
}
```

#### 修改样式主题

```css
/* 在 split.wxss 中修改主色调 */
.container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.start-btn {
  background: linear-gradient(45deg, #4facfe, #00f2fe);
}
```

### 后端开发

#### 启动方式

**开发模式**（自动重载）
```bash
python main.py
```

**生产模式**（推荐）
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### 修改配置

```python
# 在 main.py 中修改

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 上线改为具体域名
    # ...
)

# 存储目录配置
UPLOAD_DIR = "uploads"
GRID_DIR = "grid_images"
STATIC_DIR = "static"

# 端口配置
uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### 添加新接口

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/custom-endpoint")
async def custom_function():
    return {"message": "Hello"}

# 在主应用中注册
app.include_router(router)
```

### 数据流程

#### 图片上传流程

```
用户选择图片
    ↓
wx.chooseMedia()
    ↓
获取临时文件路径
    ↓
wx.uploadFile()
    ↓
POST /upload (后端)
    ↓
后端保存原图
    ↓
PIL切割成3×3
    ↓
保存9张图片到grid_images/
    ↓
返回9张图片URL
    ↓
小程序显示切割结果
    ↓
用户开始拼图游戏
```

#### 拼图游戏流程

```
初始化9个拼图块
    ↓
智能打乱（50次随机移动）
    ↓
用户点击拼图块
    ↓
检查是否与空格相邻
    ↓
交换位置
    ↓
更新步数
    ↓
检查是否完成
    ↓
显示胜利弹窗
```

## 🔧 配置详解

### 环境变量（可选）

创建 `.env` 文件：

```bash
# 后端配置
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# 小程序配置
MINIAPP_BASE_URL=http://localhost:8000
```

### 小程序配置文件

**app.json**
```json
{
  "pages": [
    "pages/index/index",
    "pages/upload/upload",
    "pages/split/split"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#667eea",
    "navigationBarTitleText": "自定义拼图游戏",
    "navigationBarTextStyle": "white"
  }
}
```

## 🐛 调试技巧

### 前端调试

#### 使用console.log
```javascript
console.log('调试信息:', data);
wx.setStorageSync('debug_log', data);
```

#### 查看Storage
- 微信开发者工具 → 调试器 → Storage标签

#### 网络请求调试
- 微信开发者工具 → 调试器 → Network标签
- 查看uploadFile的请求和响应

### 后端调试

#### 查看日志
```bash
# 后端控制台直接输出日志
INFO:切割第1块完成: abc123_1.jpg
```

#### 测试接口
```bash
# 使用curl测试
curl -X POST http://localhost:8000/upload \
  -F "file=@test.jpg"

# 使用Python测试
import requests
files = {'file': open('test.jpg', 'rb')}
response = requests.post('http://localhost:8000/upload', files=files)
print(response.json())
```

#### 健康检查
```bash
curl http://localhost:8000/health
# 返回: {"status": "healthy", "service": "image-splitter"}
```

## 📱 真机调试

### 1. 确保网络连通
- 电脑和手机在同一Wi-Fi
- 查看电脑IP：`ipconfig` (Windows) 或 `ifconfig` (Linux)

### 2. 修改baseUrl
```javascript
baseUrl: "http://192.168.1.100:8000"  // 替换为你的电脑IP
```

### 3. 微信开发者工具
- 点击"真机调试"
- 扫描二维码
- 在手机微信中打开

## 🚀 部署上线

### 后端部署

#### 本地服务器部署

1. **内网穿透**（推荐开发测试）
   - 使用ngrok
   ```bash
   ngrok http 8000
   # 获得公网URL
   ```

2. **云服务器部署**
   - 参见 `backend/README.md`
   - 使用Gunicorn + Nginx

### 小程序上线

#### 1. 配置合法域名
- 微信公众平台 → 开发管理 → 服务器域名
- 添加 request 合法域名：`https://your-domain.com`

#### 2. 上传代码
- 微信开发者工具 → 上传
- 填写版本号和备注

#### 3. 提交审核
- 微信公众平台 → 版本管理
- 提交审核
- 等待审核通过（通常1-3天）

## 📊 性能优化

### 前端优化

1. **图片压缩**
```javascript
// 上传前压缩
wx.compressImage({
  src: tempFilePath,
  quality: 80,
  success: (res) => {
    this.uploadAndSplit(res.tempFilePath);
  }
});
```

2. **懒加载**
```wxml
<image lazy-load="{{true}}" src="{{item}}" />
```

3. **防抖处理**
```javascript
// 避免快速点击
const throttle = (fn, delay) => {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};
```

### 后端优化

1. **图片质量优化**
```python
piece.save(piece_path, "JPEG", quality=85, optimize=True)
```

2. **缓存机制**
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_image_info(path):
    return Image.open(path)
```

3. **异步处理**
```python
import asyncio

async def process_image(file):
    # 异步处理图片
    pass
```

## 🔒 安全建议

### 1. 文件类型验证
```python
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
    raise HTTPException(status_code=400, detail="不支持的文件类型")
```

### 2. 文件大小限制
```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

if len(content) > MAX_FILE_SIZE:
    raise HTTPException(status_code=400, detail="文件过大")
```

### 3. CORS配置
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-miniapp.com"],  # 具体域名
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)
```

## 📚 参考资源

### 官方文档
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [Pillow文档](https://pillow.readthedocs.io/)

### 工具
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- [Postman](https://www.postman.com/) (API测试)
- [ngrok](https://ngrok.com/) (内网穿透)

## 💡 最佳实践

### 1. 代码规范
- 使用有意义的变量名
- 添加必要的注释
- 遵循PEP 8 (Python)
- 遵循微信小程序代码规范

### 2. 版本控制
```bash
git init
git add .
git commit -m "初始版本"
git push origin main
```

### 3. 测试策略
- 单元测试
- 集成测试
- 真机测试

### 4. 文档维护
- 及时更新README
- 记录重要变更
- 维护API文档

## 🆘 常见问题

### Q1: 后端启动失败
A: 检查端口占用：`netstat -tulpn | grep 8000`

### Q2: 小程序无法连接后端
A: 检查CORS配置，确保baseUrl正确

### Q3: 图片上传失败
A: 检查文件大小、格式，查看后端日志

### Q4: 拼图游戏异常
A: 检查数据结构，验证打乱算法

### Q5: 真机调试连不上
A: 确保同一Wi-Fi，关闭防火墙

## 📞 技术支持

如有问题，请查阅：
- `backend/README.md` - 后端部署指南
- `miniprogram/pages/split/README.md` - 前端配置指南
- `图片处理失败诊断指南.md` - 问题诊断

---

**Happy Coding! 🚀**