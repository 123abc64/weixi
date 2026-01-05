# 快速启动指南

## 🚀 5分钟快速开始

### 第一步：启动后端服务

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖（首次运行）
pip install -r requirements.txt

# 3. 启动服务
python main.py
```

✅ 看到 `INFO: Uvicorn running on http://0.0.0.0:8000` 表示启动成功

---

### 第二步：配置小程序

1. **打开微信开发者工具**
2. **导入项目**：选择 `miniprogram` 文件夹
3. **修改后端地址**

打开 `miniprogram/pages/split/split.js`，找到这一行：

```javascript
baseUrl: "http://localhost:8000",
```

确认地址正确（本地开发就用这个，如果是其他IP则修改）

4. **关闭域名校验**

在微信开发者工具中：
- 点击右上角"详情"
- 选择"本地设置"
- 勾选"不校验合法域名..."

---

### 第三步：运行小程序

1. 点击微信开发者工具的"编译"按钮
2. 等待编译完成
3. 在模拟器中看到界面

---

### 第四步：测试功能

#### 测试图片上传
1. 点击"点击上传图片"
2. 选择一张图片（建议600x600的正方形图片）
3. 等待切割完成（约2-3秒）
4. 查看切割结果预览

#### 测试拼图游戏
1. 点击"开始拼图游戏"
2. 点击与空格相邻的图片块
3. 将所有图片块移回正确位置
4. 查看胜利提示

---

## 🎯 功能验证清单

### 后端功能
- [ ] 服务成功启动（http://localhost:8000）
- [ ] 健康检查正常（http://localhost:8000/health）
- [ ] 可以接收图片上传
- [ ] 图片成功切割成9块
- [ ] 返回正确的URL列表

### 前端功能
- [ ] 可以选择图片（相册/拍照）
- [ ] 图片成功上传到后端
- [ ] 显示切割结果预览
- [ ] 可以开始拼图游戏
- [ ] 拼图块可以移动
- [ ] 步数和时间正常记录
- [ ] 胜利检测正常

---

## 🔧 常见启动问题

### 问题1：端口被占用
**错误信息**：`Address already in use`

**解决方案**：
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <进程ID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### 问题2：Python版本不兼容
**错误信息**：`SyntaxError` 或 `ModuleNotFoundError`

**解决方案**：
```bash
# 检查Python版本
python --version

# 需要Python 3.8+
# 如果版本过低，升级Python
```

### 问题3：依赖安装失败
**错误信息**：`Could not find a version...`

**解决方案**：
```bash
# 升级pip
python -m pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题4：小程序编译失败
**错误信息**：`AppService is not defined`

**解决方案**：
- 检查 `app.js` 是否存在
- 检查 `app.json` 配置是否正确
- 清除缓存重新编译

### 问题5：图片上传失败
**错误信息**：`uploadFile:fail`

**解决方案**：
- 确认后端服务正在运行
- 检查 `baseUrl` 是否正确
- 查看开发者工具的Network标签
- 查看后端控制台日志

---

## 📋 后续开发

### 添加新功能

1. **修改前端代码**
   - 在 `miniprogram/pages/split/split.js` 中添加逻辑
   - 在 `split.wxml` 中添加UI
   - 在 `split.wxss` 中添加样式

2. **修改后端代码**
   - 在 `backend/main.py` 中添加接口
   - 重启后端服务

3. **测试功能**
   - 在开发者工具中编译
   - 真机测试

### 调试技巧

**查看前端日志**
```javascript
console.log('调试信息', data);
```

**查看后端日志**
```bash
# 后端控制台会输出
INFO:图片上传成功: xxx.jpg
INFO:切割第1块完成: xxx_1.jpg
```

---

## 🎓 学习资源

### 必看文档
1. `IDE-README.md` - 完整开发指南
2. `backend/README.md` - 后端部署详解
3. `miniprogram/pages/split/README.md` - 前端配置详解

### API文档
访问 `http://localhost:8000/docs` 查看自动生成的API文档

---

## ✨ 成功标志

当你成功完成以下内容，说明你已经成功启动项目：

✅ 后端服务在 http://localhost:8000 正常运行
✅ 小程序在微信开发者工具中成功编译
✅ 可以上传图片并看到切割结果
✅ 可以玩拼图游戏并获得胜利

恭喜你！现在可以开始开发新功能了！🎉

---

## 🆘 需要帮助？

如果遇到问题，请按以下顺序排查：

1. 查看本指南的"常见启动问题"
2. 查看具体的README文档
3. 查看控制台日志
4. 检查网络连接

**技术支持**：查看各个README.md文件中的详细说明

---

祝你开发顺利！💪