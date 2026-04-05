"""
ModelScope Text-to-Video (1.7B) 本地推理服务。

模型: damo-vilab/text-to-video-ms-1.7b
论文: ModelScope Text-to-Video Technical Report (2023, DAMO Academy)

启动:
  uvicorn server:app --host 0.0.0.0 --port 8011

改 pip 里 torch 版本后必须重启 uvicorn，否则进程里仍是旧 PyTorch。
"""
import os, base64, tempfile

os.environ["HF_ENDPOINT"] = os.environ.get("HF_ENDPOINT", "https://hf-mirror.com")

# 推理时 PyTorch 会 dlopen libnvidia-ml；部分机器 /lib 下 .so 过旧缺 NVLink 符号。
# 在 import torch 之前把驱动常用目录插到 LD_LIBRARY_PATH 前面（对子进程 dlopen 生效）。
_ld = os.environ.get("LD_LIBRARY_PATH", "").strip()
for _p in (
    "/usr/lib/x86_64-linux-gnu",
    "/usr/lib/x86_64-linux-gnu/nvidia/current",
    "/usr/lib64",
):
    if os.path.isdir(_p) and _p not in _ld.split(os.pathsep):
        _ld = _p + (os.pathsep + _ld if _ld else "")
if _ld:
    os.environ["LD_LIBRARY_PATH"] = _ld

import torch
from diffusers import DiffusionPipeline
from diffusers.utils import export_to_video
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="ModelScope Text-to-Video")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_ID = "damo-vilab/text-to-video-ms-1.7b"

print(f"正在加载 {MODEL_ID}（首次需下载约 3.5GB，请耐心等待）...")

pipe = DiffusionPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16,
    variant="fp16",
)
pipe = pipe.to("cuda")
pipe.enable_vae_slicing()

print("模型加载完成！")


class GenerateReq(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    num_frames: int = Field(16, ge=4, le=24)
    num_inference_steps: int = Field(25, ge=10, le=50)


@app.post("/api/t2v/generate")
async def generate(req: GenerateReq):
    try:
        frames = pipe(
            req.prompt.strip(),
            num_frames=req.num_frames,
            num_inference_steps=req.num_inference_steps,
        ).frames[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e) or "推理失败") from e

    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    try:
        export_to_video(frames, tmp.name, fps=8)
        with open(tmp.name, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
    finally:
        os.unlink(tmp.name)

    data_url = f"data:video/mp4;base64,{b64}"
    return {
        "videoUrl": data_url,
        "message": f"ModelScope T2V 生成成功（{len(frames)} 帧）",
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_ID, "gpu": torch.cuda.is_available()}
