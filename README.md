# 🧩 自定义拼图游戏

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![Framework](https://img.shields.io/badge/微信小程序-green.svg)

一个基于微信小程序和FastAPI的智能图片切割拼图游戏

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [开发指南](#-开发指南) • [部署说明](#-部署说明)

</div>

---

## 📋 项目简介

这是一个前后端分离的拼图游戏项目，用户可以上传自己的图片，系统会自动将图片切割成3×3的九宫格，然后进行传统的拼图游戏。

### 🎯 核心功能

- ✨ **智能图片切割**：用户上传图片 → 后端3×3切割 → 返回9张独立图片
- 🎮 **拼图游戏**：传统九宫格拼图玩法（8块图片+1个空位）
- ⏱️ **游戏统计**：实时记录步数和时间
- 🎨 **精美UI**：现代化渐变设计，流畅动画
- 🔄 **双重方案**：Canvas切割 + 后端切割（推荐）

### 🏗️ 技术架构

```
微信小程序前端 (WXML/WXSS/JS)
         ↓ HTTP POST
FastAPI后端服务 (Python 3.8+)
         ↓
Pillow图片切割 (3×3网格)
         ↓
静态资源服务 (图片URL)
         ↓
小程序展示+游戏
```

---

## 🚀 快速开始

### 方式1：使用启动脚本（推荐）

**Windows用户**：
```bash
# 双击运行
start.bat
```

**Linux/Mac用户**：
```bash
# 给脚本执行权限
chmod +x check-config.py

# 运行配置检查
python check-config.py
```

### 方式2：手动启动

#### 1. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 2. 启动后端服务

```bash
# 开发模式（自动重载）
python main.py

# 或使用uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

后端将在 `http://localhost:8000` 启动

#### 3. 配置小程序

打开 `miniprogram/pages/split/split.js`，确认baseUrl：

```javascript
baseUrl: "http://localhost:8000"  // 确认地址正确
```

#### 4. 运行小程序

1. 打开微信开发者工具
2. 导入项目（选择 `miniprogram` 目录）
3. 点击"编译"按钮

### ⚡ 一键启动

```bash
# 运行配置检查
python check-config.py

# Windows用户双击
start.bat

# 然后在微信开发者工具中打开miniprogram目录
```

---

## 📚 文档导航

### 🎯 新手入门
- **[QUICKSTART.md](./QUICKSTART.md)** - 5分钟快速启动指南
- **[check-config.py](./check-config.py)** - 环境配置检查脚本
- **[start.bat](./start.bat)** - Windows一键启动脚本

### 👨‍💻 开发指南
- **[IDE-README.md](./IDE-README.md)** - 完整的IDE开发指南
  - 项目架构详解
  - 技术栈说明
  - 开发流程
  - 调试技巧
  - 性能优化

- **[PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)** - 项目结构详解
  - 完整目录树
  - 核心文件说明
  - 数据流程图
  - 接口文档
  - 样式系统

### 📦 后端部署
- **[backend/README.md](./backend/README.md)** - 后端部署详细指南
  - 本地调试部署
  - 云服务器部署
  - Nginx配置
  - HTTPS配置
  - 故障排除

### 📱 前端配置
- **[miniprogram/pages/split/README.md](./miniprogram/pages/split/README.md)** - 前端配置指南
  - 页面集成
  - 接口说明
  - 样式定制
  - 测试建议

### 👤 用户文档
- **[拼图游戏使用说明.md](./拼图游戏使用说明.md)** - 用户使用手册
  - 游戏介绍
  - 玩法说明
  - 游戏技巧
  - 常见问题

- **[图片处理失败诊断指南.md](./图片处理失败诊断指南.md)** - 问题诊断指南
  - 常见原因
  - 自动降级机制
  - 调试步骤
  - 故障排除清单

---

## 🎯 功能特性

### 📷 图片上传
- 支持相册选择
- 支持拍照上传
- 支持JPG/PNG/WEBP格式
- 图片预览功能

### ✂️ 图片切割
- **后端切割**（推荐）：使用FastAPI+Pillow真实切割
- **Canvas切割**：使用小程序Canvas API切割
- 自动3×3九宫格分割
- 保留原图质量
- 支持不同尺寸图片

### 🎮 拼图游戏
- 传统九宫格拼图（8块+1空）
- 智能打乱算法（确保有解）
- 流畅的移动动画
- 实时步数统计
- 游戏计时器
- 数字提示功能
- 胜利检测与庆祝

### 🎨 用户界面
- 现代化渐变背景
- 响应式布局
- 流畅动画效果
- 加载状态提示
- 错误友好提示

---

## 🛠️ 开发指南

### 环境要求

**必需**：
- Python 3.8+
- 微信开发者工具
- Node.js（小程序开发）

**推荐**：
- Git（版本控制）
- VS Code（代码编辑）

### 配置修改

#### 后端配置（main.py）

```python
# CORS配置
allow_origins=["*"]  # 开发用 "*", 上线改具体域名

# 存储目录
UPLOAD_DIR = "uploads"
GRID_DIR = "grid_images"
STATIC_DIR = "static"

# 端口
port=8000
```

#### 前端配置（split.js）

```javascript
// 后端地址
baseUrl: "http://localhost:8000"

// 其他配置
showNumbers: false,  // 是否显示数字
steps: 0,         // 初始步数
```

### 添加新功能

#### 添加新接口（后端）

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/new-endpoint")
async def new_function():
    return {"message": "Hello"}

# 在main.py中注册
app.include_router(router)
```

#### 添加新页面（前端）

1. 在 `miniprogram/pages/` 下创建新页面目录
2. 在 `app.json` 中添加页面路由
3. 编写页面逻辑（.js）、结构（.wxml）、样式（.wxss）

### 调试技巧

#### 前端调试
```javascript
console.log('调试信息', data);
wx.setStorageSync('debug_log', data);
```

#### 后端调试
```bash
# 查看日志
python main.py  # 控制台输出

# 测试接口
curl http://localhost:8000/health
```

---

## 🚀 部署说明

### 本地开发部署

1. **启动后端**
   ```bash
   cd backend
   python main.py
   ```

2. **配置小程序**
   - 打开微信开发者工具
   - 导入 `miniprogram` 目录
   - 关闭域名校验

3. **真机调试**
   - 确保同一Wi-Fi
   - 修改baseUrl为电脑IP
   - 使用真机调试功能

### 云服务器部署

详细步骤请参考 [backend/README.md](./backend/README.md)

简要流程：
1. 购买云服务器（阿里云/腾讯云）
2. 配置Python环境和依赖
3. 上传后端代码
4. 使用Gunicorn+Nginx部署
5. 配置安全组开放端口
6. 在微信公众平台配置合法域名

---

## 📊 项目结构

```
拼图游戏/
├── backend/                 # 后端服务
│   ├── main.py              # FastAPI主文件
│   ├── requirements.txt       # Python依赖
│   └── README.md           # 部署指南
├── miniprogram/             # 小程序前端
│   ├── app.js              # 入口文件
│   ├── app.json            # 全局配置
│   └── pages/
│       └── split/         # 智能切割页面
│           ├── split.js
│           ├── split.wxml
│           ├── split.wxss
│           └── split.json
├── 📚 文档/               # 项目文档
│   ├── IDE-README.md       # 开发指南
│   ├── QUICKSTART.md       # 快速启动
│   ├── PROJECT-STRUCTURE.md # 结构详解
│   └── ...
├── check-config.py          # 配置检查脚本
└── start.bat              # Windows启动脚本
```

详细结构说明请查看 [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)

---

## 🔌 API文档

### POST /upload

上传图片并切割成3×3

**请求**：
```http
POST /upload
Content-Type: multipart/form-data
file: <image file>
```

**响应**：
```json
{
  "code": 200,
  "message": "图片切割成功",
  "data": {
    "grid_urls": [
      "/static/grid_images/xxx_1.jpg",
      ...
    ]
  }
}
```

### GET /health

健康检查

**响应**：
```json
{
  "status": "healthy",
  "service": "image-splitter"
}
```

完整API文档请访问 `http://localhost:8000/docs`

---

## 🎨 截图演示

### 上传图片
- 用户点击上传区域
- 选择图片（相册/拍照）
- 自动上传切割

### 切割结果
- 显示3×3网格
- 每个格子显示对应图片块
- 带有编号

### 拼图游戏
- 九宫格布局
- 8个图片块+1个空位
- 点击移动拼图块
- 步数和时间显示

### 游戏完成
- 胜利弹窗
- 显示总步数和用时
- 可选择再玩一次

---

## 🐛 常见问题

### Q: 后端启动失败
A: 检查Python版本、依赖安装、端口占用

### Q: 小程序无法连接后端
A: 检查baseUrl配置、CORS设置、域名校验

### Q: 图片上传失败
A: 检查图片格式、大小、网络连接

### Q: 拼图游戏异常
A: 检查数据结构、打乱算法、胜利检测

详见 [图片处理失败诊断指南.md](./图片处理失败诊断指南.md)

---

## 📞 技术支持

### 📚 文档资源
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [Pillow文档](https://pillow.readthedocs.io/)

### 🛠️ 问题排查
1. 查看各README文档
2. 运行check-config.py检查环境
3. 查看控制台日志
4. 检查网络连接

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork本仓库
2. 创建功能分支
3. 提交代码
4. 发起Pull Request

### 代码规范
- 遵循PEP 8 (Python)
- 遵循微信小程序代码规范
- 添加必要的注释
- 编写清晰的提交信息

---

## 📄 开源协议

MIT License

---

## ✨ 致谢

感谢以下开源项目：
- FastAPI
- Pillow
- 微信小程序框架

---

## 📞 联系方式

如有问题或建议，欢迎：
- 提交Issue
- 发送邮件
- 参与讨论

---

<div align="center">

**如果觉得这个项目有帮助，请给个 ⭐ Star**

Made with ❤️ by [Your Name]

</div>