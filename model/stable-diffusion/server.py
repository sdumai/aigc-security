import os, io, base64, time
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"  # 国内镜像下载模型

import torch
from diffusers import StableDiffusionPipeline
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

print("正在加载模型（首次运行需下载约4GB，请耐心等待）...")

HAS_GPU = torch.cuda.is_available()
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16 if HAS_GPU else torch.float32,
    safety_checker=None,
)
if HAS_GPU:
    pipe = pipe.to("cuda")
else:
    pipe.enable_attention_slicing()  # CPU 节省内存

print(f"模型加载完成！使用 {'GPU' if HAS_GPU else 'CPU'} 推理")

SIZE_MAP = {
    "1K": (512, 512),
    "2K": (768, 768),
    "4K": (1024, 1024),
}

class GenerateReq(BaseModel):
    prompt: str
    size: str = "2K"
    watermark: bool = False

@app.post("/api/sd/generate")
async def generate(req: GenerateReq):
    w, h = SIZE_MAP.get(req.size, (512, 512))
    steps = 20 if HAS_GPU else 15  # CPU 减少步数，快一点

    image = pipe(
        req.prompt,
        width=w,
        height=h,
        num_inference_steps=steps,
    ).images[0]

    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    data_url = f"data:image/png;base64,{b64}"

    return {"imageUrl": data_url, "message": f"SD v1.5 生成成功（{'GPU' if HAS_GPU else 'CPU'}）"}

@app.get("/health")
def health():
    return {"status": "ok", "gpu": HAS_GPU}