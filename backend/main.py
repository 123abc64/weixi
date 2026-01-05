from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import uuid
import aiofiles
from PIL import Image
from typing import List
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="图片切割服务", version="1.0.0")

# 配置跨域（允许小程序请求）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 上线时改为小程序的域名，如 ["https://your-miniapp.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置目录
UPLOAD_DIR = "uploads"
GRID_DIR = "grid_images"
STATIC_DIR = "static"

# 确保目录存在
for directory in [UPLOAD_DIR, GRID_DIR, STATIC_DIR]:
    os.makedirs(directory, exist_ok=True)

# 挂载静态资源目录（用于访问切割后的图片）
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

def split_to_3x3(image_path: str, output_dir: str, unique_name: str) -> List[str]:
    """
    将图片均等切割成3×3的九宫格小图片
    
    Args:
        image_path: 原图路径
        output_dir: 输出目录
        unique_name: 唯一标识符
    
    Returns:
        List[str]: 切割后的图片URL列表
    """
    try:
        # 打开图片
        img = Image.open(image_path)
        img_width, img_height = img.size
        
        # 转换为RGB模式（处理RGBA等其他格式）
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 计算每个拼图块的尺寸
        piece_width = img_width // 3
        piece_height = img_height // 3
        
        logger.info(f"原图尺寸: {img_width}x{img_height}, 拼图块尺寸: {piece_width}x{piece_height}")
        
        urls = []
        count = 1
        
        # 切割3x3网格
        for row in range(3):
            for col in range(3):
                # 计算切割坐标
                left = col * piece_width
                upper = row * piece_height
                
                # 处理边界（确保不遗漏任何像素）
                if col == 2:
                    right = img_width
                else:
                    right = left + piece_width
                    
                if row == 2:
                    lower = img_height
                else:
                    lower = upper + piece_height
                
                # 切割图片
                piece = img.crop((left, upper, right, lower))
                
                # 生成文件名
                piece_filename = f"{unique_name}_{count}.jpg"
                piece_path = os.path.join(output_dir, piece_filename)
                
                # 保存切割后的图片
                piece.save(piece_path, "JPEG", quality=90, optimize=True)
                
                # 生成访问URL
                url = f"/static/grid_images/{piece_filename}"
                urls.append(url)
                
                logger.info(f"切割第{count}块完成: {piece_filename}")
                count += 1
        
        return urls
        
    except Exception as e:
        logger.error(f"图片切割失败: {str(e)}")
        raise e

@app.get("/")
async def root():
    """根路径"""
    return {"message": "图片切割服务运行中", "version": "1.0.0"}

@app.post("/upload")
async def upload_and_split(file: UploadFile = File(...)):
    """
    上传图片并进行3×3切割
    
    Args:
        file: 上传的图片文件
    
    Returns:
        JSONResponse: 包含切割结果的响应
    """
    try:
        # 验证文件类型
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="请上传图片文件")
        
        # 生成唯一的文件名
        unique_name = str(uuid.uuid4())
        original_filename = f"{unique_name}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, original_filename)
        
        # 保存上传的原图
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        logger.info(f"图片上传成功: {original_filename}")
        
        # 切割图片
        grid_urls = split_to_3x3(file_path, GRID_DIR, unique_name)
        
        return {
            "code": 200,
            "message": "图片切割成功",
            "data": {
                "original_url": f"/static/uploads/{original_filename}",
                "grid_urls": grid_urls,
                "unique_name": unique_name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"处理失败: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "code": 500,
                "message": f"处理失败: {str(e)}",
                "data": None
            }
        )

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "healthy", "service": "image-splitter"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )