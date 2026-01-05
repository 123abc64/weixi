@echo off
chcp 65001 >nul
echo ========================================
echo    拼图游戏 - 快速启动脚本
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python，请先安装Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/4] 检查Python环境...
python --version
echo.

REM 检查后端目录
if not exist "backend" (
    echo [错误] 未找到backend目录
    pause
    exit /b 1
)

echo [2/4] 进入后端目录...
cd backend

REM 检查依赖
echo [3/4] 检查Python依赖...
if not exist "requirements.txt" (
    echo [错误] 未找到requirements.txt
    pause
    exit /b 1
)

REM 检查是否已安装依赖
python -c "import fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [提示] 检测到未安装依赖，正在安装...
    echo.
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [成功] Python依赖已安装
)

echo.
echo [4/4] 启动后端服务...
echo.
echo ========================================
echo    后端服务启动中...
echo ========================================
echo.
echo 服务地址: http://localhost:8000
echo API文档:  http://localhost:8000/docs
echo 健康检查: http://localhost:8000/health
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

REM 启动FastAPI服务
python main.py

REM 如果服务意外退出
echo.
echo [提示] 后端服务已停止
pause