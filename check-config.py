#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
项目配置检查脚本
用于验证开发环境是否正确配置
"""

import sys
import os
import subprocess
from pathlib import Path

class Colors:
    """终端颜色"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

def check_python_version():
    """检查Python版本"""
    print_info("检查Python版本...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print_success(f"Python {version.major}.{version.minor}.{version.micro} - 版本正确")
        return True
    else:
        print_error(f"Python {version.major}.{version.minor} - 需要Python 3.8+")
        return False

def check_module(module_name):
    """检查Python模块是否已安装"""
    try:
        __import__(module_name)
        print_success(f"{module_name} 已安装")
        return True
    except ImportError:
        print_error(f"{module_name} 未安装")
        return False

def check_file_exists(filepath):
    """检查文件是否存在"""
    if os.path.exists(filepath):
        print_success(f"{filepath} 存在")
        return True
    else:
        print_error(f"{filepath} 不存在")
        return False

def check_directory(dirpath):
    """检查目录是否存在"""
    if os.path.isdir(dirpath):
        print_success(f"{dirpath} 目录存在")
        return True
    else:
        print_warning(f"{dirpath} 目录不存在（首次运行会自动创建）")
        return True

def check_backend_running():
    """检查后端服务是否运行"""
    try:
        import requests
        response = requests.get('http://localhost:8000/health', timeout=2)
        if response.status_code == 200:
            print_success("后端服务运行正常 (http://localhost:8000)")
            return True
        else:
            print_warning("后端服务可能未正常响应")
            return False
    except:
        print_warning("后端服务未运行 (需要启动才能测试)")
        return None

def main():
    """主函数"""
    print("\n" + "="*60)
    print("拼图游戏 - 项目配置检查")
    print("="*60 + "\n")

    # 1. Python环境检查
    print("📦 Python环境检查")
    print("-" * 60)
    python_ok = check_python_version()

    if python_ok:
        print("\n📚 Python依赖检查")
        print("-" * 60)
        modules_ok = all([
            check_module('fastapi'),
            check_module('uvicorn'),
            check_module('PIL'),
            check_module('aiofiles')
        ])
    else:
        modules_ok = False
        print_warning("跳过依赖检查（Python版本不兼容）")

    # 2. 后端文件检查
    print("\n🔧 后端文件检查")
    print("-" * 60)
    backend_files = all([
        check_file_exists('backend/main.py'),
        check_file_exists('backend/requirements.txt'),
        check_file_exists('backend/README.md')
    ])

    # 3. 前端文件检查
    print("\n📱 前端文件检查")
    print("-" * 60)
    frontend_files = all([
        check_directory('miniprogram/pages/split'),
        check_file_exists('miniprogram/pages/split/split.js'),
        check_file_exists('miniprogram/pages/split/split.wxml'),
        check_file_exists('miniprogram/pages/split/split.wxss'),
        check_file_exists('miniprogram/pages/split/split.json')
    ])

    # 4. 文档检查
    print("\n📚 文档检查")
    print("-" * 60)
    docs = all([
        check_file_exists('IDE-README.md'),
        check_file_exists('QUICKSTART.md'),
        check_file_exists('PROJECT-STRUCTURE.md'),
        check_file_exists('backend/README.md'),
        check_file_exists('miniprogram/pages/split/README.md')
    ])

    # 5. 后端服务检查
    print("\n🚀 后端服务检查")
    print("-" * 60)
    backend_running = check_backend_running()

    # 6. 配置提示
    print("\n⚙️  配置提醒")
    print("-" * 60)
    print_info("请确认以下配置项：")
    print_info("1. 后端baseUrl: miniprogram/pages/split/split.js")
    print_info("2. 页面路由: miniprogram/app.json")
    print_info("3. 域名校验: 微信开发者工具 → 设置")

    # 7. 总结
    print("\n" + "="*60)
    print("📊 检查总结")
    print("="*60)

    all_ok = all([
        python_ok,
        modules_ok if python_ok else False,
        backend_files,
        frontend_files,
        docs
    ])

    if all_ok:
        print_success("所有必需文件和依赖已就绪！")
        print_info("现在可以运行项目了：")
        print_info("1. 启动后端: cd backend && python main.py")
        print_info("2. 配置小程序: 修改split.js中的baseUrl")
        print_info("3. 运行小程序: 微信开发者工具打开miniprogram目录")
        print_info("\n详细说明请查看 QUICKSTART.md")
    else:
        print_error("部分检查未通过，请根据上述提示进行修复")

    if backend_running:
        print_success("\n后端服务正在运行，可以直接测试！")
        print_info("访问 http://localhost:8000/docs 查看API文档")

    print("\n" + "="*60)
    print()

    return 0 if all_ok else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print_info("\n检查已取消")
        sys.exit(0)