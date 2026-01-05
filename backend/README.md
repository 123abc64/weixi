# 图片切割服务部署指南

## 本地调试部署

### 1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

### 2. 运行后端服务
```bash
python main.py
```
服务将在 http://localhost:8000 启动

### 3. 小程序配置
- 在微信开发者工具中：设置 → 项目设置 → 勾选"不校验合法域名"
- 确保电脑和手机在同一局域网

### 4. 测试接口
- 上传接口：POST http://localhost:8000/upload
- 健康检查：GET http://localhost:8000/health
- 静态资源：http://localhost:8000/static/

## 云服务器部署

### 1. 购买云服务器
- 推荐：阿里云ECS、腾讯云CVM
- 系统：Ubuntu 20.04 LTS
- 配置：1核2G内存即可

### 2. 服务器环境配置
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Python 3.9
sudo apt install python3.9 python3.9-pip python3.9-venv -y

# 创建项目目录
mkdir -p /opt/image-splitter
cd /opt/image-splitter

# 创建虚拟环境
python3.9 -m venv venv
source venv/bin/activate

# 上传代码并安装依赖
pip install -r requirements.txt
```

### 3. 运行服务
```bash
# 开发模式
python main.py

# 生产模式（推荐）
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. 使用Gunicorn守护进程
```bash
# 安装gunicorn
pip install gunicorn

# 创建配置文件 gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"

# 启动服务
gunicorn main:app -c gunicorn.conf.py --daemon
```

### 5. 配置Nginx（可选）
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 配置说明

### 需要修改的配置项

1. **后端地址**（main.py）
   ```python
   # 上线时修改为实际域名
   allow_origins=["https://your-miniapp.com"]
   ```

2. **存储目录**（main.py）
   ```python
   UPLOAD_DIR = "uploads"      # 上传目录
   GRID_DIR = "grid_images"   # 切割图片目录
   STATIC_DIR = "static"       # 静态资源目录
   ```

3. **端口配置**
   ```python
   uvicorn.run(app, host="0.0.0.0", port=8000)
   ```

## 安全组配置

在云服务器控制台开放以下端口：
- 8000：HTTP服务端口
- 443：HTTPS（可选）
- 22：SSH管理端口

## 域名配置

### 小程序域名配置
1. 登录微信公众平台
2. 开发管理 → 开发设置 → 服务器域名
3. 添加 request 合法域名：https://your-domain.com

### HTTPS配置（生产环境推荐）
使用Let's Encrypt免费SSL证书：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 监控和日志

### 查看服务状态
```bash
# 查看进程
ps aux | grep gunicorn

# 查看日志
tail -f /var/log/nginx/error.log
```

### 自动重启脚本
```bash
#!/bin/bash
# restart.sh
cd /opt/image-splitter
source venv/bin/activate
pkill -f gunicorn
gunicorn main:app -c gunicorn.conf.py --daemon
```

## 故障排除

### 常见问题
1. **端口被占用**
   ```bash
   sudo netstat -tulpn | grep 8000
   sudo kill -9 PID
   ```

2. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /opt/image-splitter
   ```

3. **跨域问题**
   - 检查CORS配置
   - 确保小程序域名已添加

4. **图片上传失败**
   - 检查上传目录权限
   - 查看服务器日志