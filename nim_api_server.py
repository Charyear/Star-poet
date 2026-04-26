import os

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from openai import OpenAI
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





@app.post("/nim_api")
async def nim_api(
    prompt: str = Form(...),
    model: str = Form(...),
    apiKey: str = Form(...),
    files: Optional[List[UploadFile]] = File(None)
):
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=apiKey
    )
    try:
        # 统一处理所有模型的文件上传
        if files:
            # 组装多模态content
            content = []
            if prompt.strip():
                content.append({"type": "text", "text": prompt})
            for f in files:
                ext = f.filename.split(".")[-1].lower()
                if ext in ["png", "jpg", "jpeg", "webp"]:
                    mime = f"image/{'jpeg' if ext in ['jpg','jpeg'] else ext}"
                    media_type = "image_url"
                elif ext in ["mp4", "webm", "mov"]:
                    mime = f"video/{ext}"
                    media_type = "video_url"
                else:
                    continue
                b64 = base64.b64encode(await f.read()).decode()
                content.append({
                    "type": media_type,
                    media_type: {"url": f"data:{mime};base64,{b64}"}
                })
            # 优先用多模态格式
            messages = [
                {"role": "system", "content": "/think"},
                {"role": "user", "content": content}
            ]
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": 4096,
                "temperature": 1,
                "top_p": 1,
                "stream": False
            }
        else:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 1024,
                "stream": False
            }
        response = client.chat.completions.create(**payload)
        return {"result": response.choices[0].message.content}
    except Exception as e:
        return {"result": f"调用失败: {str(e)}"}
