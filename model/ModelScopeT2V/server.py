"""
ModelScope Text-to-Video (1.7B) 本地推理服务。

模型: damo-vilab/text-to-video-ms-1.7b
官方示例见模型卡：DPMSolverMultistepScheduler + fp16 + cpu_offload。

启动:
  uvicorn server:app --host 0.0.0.0 --port 8011

若长期只有噪声/绿屏：可能是 hf-mirror 权重不完整，可临时取消 HF_ENDPOINT 从官方重新拉取。
"""
import os, base64, tempfile

os.environ["HF_ENDPOINT"] = os.environ.get("HF_ENDPOINT", "https://hf-mirror.com")

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

import numpy as np
import torch
from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler
from diffusers.utils import export_to_video
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(title="ModelScope Text-to-Video")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_ID = "damo-vilab/text-to-video-ms-1.7b"


def _frames_to_list_for_export(raw):
    """
    export_to_video(diffusers 0.26) 要求：可迭代，且每个元素是 (H,W,C) 的 ndarray 或 PIL。
    若把 (1,T,H,W,C) 整坨当「一帧」传进去，OpenCV 会写出花屏噪声。
    """
    if raw is None:
        raise ValueError("无 frames")

    if isinstance(raw, np.ndarray):
        x = raw
        if x.ndim == 5:
            x = x[0]
        if x.ndim == 4:
            return [np.asarray(x[i]) for i in range(x.shape[0])]
        if x.ndim == 3:
            return [np.asarray(x)]
        raise ValueError(f"无法解析 ndarray ndim={x.ndim}")

    if isinstance(raw, (list, tuple)):
        if not raw:
            raise ValueError("frames 空列表")
        first = raw[0]
        if isinstance(first, (list, tuple)) and first:
            inner = first
            probe = inner[0]
            if isinstance(probe, np.ndarray) and probe.ndim == 3:
                return [np.asarray(f) for f in inner]
            if hasattr(probe, "mode"):
                return list(inner)
        if isinstance(first, np.ndarray) and first.ndim == 3:
            return [np.asarray(f) for f in raw]
        if hasattr(first, "mode"):
            return list(raw)

    raise ValueError(f"无法解析 frames 类型: {type(raw)}")


print(f"正在加载 {MODEL_ID} ... HF_ENDPOINT={os.environ.get('HF_ENDPOINT', '')}")

pipe = DiffusionPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16,
    variant="fp16",
)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
pipe.enable_model_cpu_offload()
pipe.enable_vae_slicing()

print(f"模型加载完成！scheduler={pipe.scheduler.__class__.__name__}")

print("[自测] 4 帧 ...")
try:
    _out = pipe("a red apple on a table", num_frames=4, num_inference_steps=15)
    _list = _frames_to_list_for_export(_out.frames)
    a0 = _list[0]
    print(f"[自测] 帧数={len(_list)} 首帧 shape={a0.shape} dtype={a0.dtype} "
          f"min={float(np.min(a0)):.4f} max={float(np.max(a0)):.4f}")
except Exception:
    import traceback
    traceback.print_exc()
    print("[自测] FAILED")
print("=" * 60)


class GenerateReq(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    num_frames: int = Field(16, ge=4, le=24)
    num_inference_steps: int = Field(25, ge=10, le=50)


@app.post("/api/t2v/generate")
async def generate(req: GenerateReq):
    print(f"[T2V] prompt={req.prompt!r} frames={req.num_frames} steps={req.num_inference_steps}")
    try:
        result = pipe(
            req.prompt.strip(),
            num_frames=req.num_frames,
            num_inference_steps=req.num_inference_steps,
        )
        video_frames = _frames_to_list_for_export(result.frames)
        f0 = video_frames[0]
        print(f"[T2V] 导出 {len(video_frames)} 帧 首帧 min={float(np.min(f0)):.4f} max={float(np.max(f0)):.4f}")

        tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        try:
            export_to_video(video_frames, tmp.name, fps=8)
            with open(tmp.name, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("ascii")
        finally:
            os.unlink(tmp.name)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})

    return {
        "videoUrl": f"data:video/mp4;base64,{b64}",
        "message": "ModelScope T2V 生成成功",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_ID,
        "gpu": torch.cuda.is_available(),
        "hf_endpoint": os.environ.get("HF_ENDPOINT", ""),
    }
