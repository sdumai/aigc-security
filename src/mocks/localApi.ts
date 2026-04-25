type MockPayload = Record<string, unknown>;

const generatedOutputs = [
  {
    id: "1",
    type: "image",
    title: "Deepfake 人脸替换 - 名人效果",
    thumbnailUrl: "/mock/deepfake_result.jpg",
    fullUrl: "/mock/deepfake_result.jpg",
    createdAt: "2024-12-06 14:30:22",
    size: "2.3 MB",
  },
  {
    id: "2",
    type: "video",
    title: "AI 视频生成 - 未来城市",
    thumbnailUrl: "/mock/text2img_dog_running.jpg",
    fullUrl: "/mock/sample_video.mp4",
    createdAt: "2024-12-06 13:20:15",
    size: "15.7 MB",
  },
  {
    id: "3",
    type: "image",
    title: "StarGAN 属性编辑 - 年龄变化",
    thumbnailUrl: "/mock/faceswap_hardcoded.png",
    fullUrl: "/mock/faceswap_hardcoded.png",
    createdAt: "2024-12-06 12:10:45",
    size: "1.8 MB",
  },
  {
    id: "4",
    type: "image",
    title: "AI 图像生成 - 科幻场景",
    thumbnailUrl: "/mock/text2img_dog_running.jpg",
    fullUrl: "/mock/text2img_dog_running.jpg",
    createdAt: "2024-12-05 15:30:10",
    size: "3.2 MB",
  },
];

const detectionRecords = [
  {
    id: "1",
    type: "fake",
    filename: "suspicious_video.mp4",
    result: "虚假",
    confidence: 0.873,
    createdAt: "2024-12-06 14:20:00",
  },
  {
    id: "2",
    type: "unsafe",
    filename: "content_check.jpg",
    result: "高风险",
    riskScore: 0.85,
    createdAt: "2024-12-06 13:15:30",
  },
  {
    id: "3",
    type: "fake",
    filename: "test_image.png",
    result: "真实",
    confidence: 0.95,
    createdAt: "2024-12-06 12:00:00",
  },
];

export const shouldUseLocalMocks = () => import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true";

const normalizeApiPath = (rawUrl?: string) => {
  if (!rawUrl) {
    return "";
  }

  const pathname = new URL(rawUrl, window.location.origin).pathname;
  if (pathname.startsWith("/api/")) {
    return pathname;
  }

  return `/api${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
};

export const getLocalMockPayload = (method = "get", rawUrl?: string): MockPayload | undefined => {
  if (!shouldUseLocalMocks()) {
    return undefined;
  }

  const key = `${method.toUpperCase()} ${normalizeApiPath(rawUrl)}`;

  switch (key) {
    case "POST /api/generate/faceswap":
      return {
        imageUrl: "/mock/faceswap_hardcoded.png",
        message: "人脸替换完成（本地 mock）",
      };
    case "POST /api/generate/fomm":
      return {
        videoUrl: "/mock/rabbit.mp4",
        message: "人脸动画生成完成（本地 mock）",
      };
    case "POST /api/generate/seededit":
      return {
        imageUrl: "/mock/deepfake_result.jpg",
        message: "属性编辑完成（本地 mock）",
      };
    case "POST /api/generate/image":
    case "POST /api/generate/image-stable-diffusion":
      return {
        success: true,
        imageUrl: "/mock/text2img_dog_running.jpg",
        format: "url",
        message: "图像生成成功（本地 mock）",
      };
    case "POST /api/generate/model-scope":
    case "POST /api/generate/t2v":
    case "POST /api/generate/i2v":
      return {
        success: true,
        videoUrl: "/mock/sample_video.mp4",
        format: "url",
        message: "视频生成成功（本地 mock）",
      };
    case "POST /api/detect/volc-image-aigc":
      return {
        isAIGenerated: true,
        confidence: 0.86,
        reason: "图像存在局部纹理过平滑、边缘细节不一致等 AI 生成特征（本地 mock）。",
      };
    case "POST /api/detect/universal-fake-detect":
      return {
        is_ai_generated: true,
        score: 0.82,
        threshold: 0.5,
        arch: "CLIP ViT-L/14 + linear head",
        message: "UniversalFakeDetect 判定为疑似 AI 生成图像（本地 mock）。",
      };
    case "POST /api/detect/volc-video-aigc":
      return {
        isFake: true,
        confidence: 0.78,
        model: "视频 AI 生成识别（本地 mock）",
        details: {
          segmentRatio: 0.63,
          segmentConclusion: "多个片段存在运动连续性异常和局部纹理闪烁。",
          artifacts: ["运动轨迹不稳定", "帧间细节漂移", "局部纹理闪烁"],
        },
      };
    case "POST /api/detect/volc-ims":
      return {
        safe: false,
        suggestion: "review",
        labels: ["violence", "sensitive"],
        reason: "画面存在可能需要人工复核的风险元素（本地 mock）。",
      };
    case "POST /api/detect/volc-video-ims":
      return {
        safe: false,
        suggestion: "review",
        labels: ["violence"],
        reason: "视频片段中存在疑似暴力动作，建议人工复核（本地 mock）。",
      };
    case "GET /api/data/outputs":
      return {
        success: true,
        data: generatedOutputs,
      };
    case "GET /api/data/detections":
      return {
        success: true,
        data: detectionRecords,
      };
    case "POST /api/data/save":
      return {
        success: true,
        message: "内容已保存到内容管理（本地 mock）",
        id: `saved_${Date.now()}`,
      };
    default:
      return undefined;
  }
};

const getFetchUrl = (input: RequestInfo | URL) => {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

const getFetchMethod = (input: RequestInfo | URL, init?: RequestInit) => {
  if (init?.method) {
    return init.method;
  }

  if (input instanceof Request) {
    return input.method;
  }

  return "GET";
};

export const installLocalMockFetch = () => {
  if (!shouldUseLocalMocks() || typeof window === "undefined") {
    return;
  }

  const marker = "__aigcLocalMockFetchInstalled__";
  if ((window.fetch as typeof window.fetch & Record<string, boolean>)[marker]) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  const mockFetch: typeof window.fetch = async (input, init) => {
    const payload = getLocalMockPayload(getFetchMethod(input, init), getFetchUrl(input));
    if (payload) {
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };

  Object.defineProperty(mockFetch, marker, { value: true });
  window.fetch = mockFetch;
};
