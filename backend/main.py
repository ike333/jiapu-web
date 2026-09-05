"""多谱家谱网站 - 后端服务入口
启动：uvicorn main:app --host 0.0.0.0 --port 8000
API 路径带谱前缀：/api/{clanId}/auth|changes|admin|feedback|zmf|photos
照片静态目录：/uploads/{clanId}/...
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from db import init_db
from routers import auth, changes, admin, feedback, zmf, photos, ddk, ads

init_db()

app = FastAPI(title="多谱家谱 API", version="0.1.0")

# CORS：开发时前端在 3000 端口；生产走 Nginx 反代同源
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://chenmike.cn",
        "https://chenmike.cn",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(changes.router)
app.include_router(admin.router)
app.include_router(feedback.router)
app.include_router(zmf.router)
app.include_router(photos.router)
app.include_router(ddk.router)
app.include_router(ads.router)

# 照片静态目录：/uploads/{clanId}/{filename}
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
