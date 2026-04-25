import { http, HttpResponse, delay } from "msw";

const ok = <T extends Record<string, unknown>>(data: T) => HttpResponse.json(data);

export const handlers = [
  // 当前页面真实使用的 Deepfake/生成接口
  http.post("/api/generate/faceswap", async () => {
    await delay(800);
    return ok({
      imageUrl: "/mock/faceswap_hardcoded.png",
      message: "人脸替换完成（本地 mock）",
    });
  }),

  http.post("/api/generate/fomm", async () => {
    await delay(900);
    return ok({
      videoUrl: "/mock/rabbit.mp4",
      message: "人脸动画生成完成（本地 mock）",
    });
  }),

  http.post("/api/generate/seededit", async () => {
    await delay(800);
    return ok({
      imageUrl: "/mock/deepfake_result.jpg",
      message: "属性编辑完成（本地 mock）",
    });
  }),

  http.post("/api/generate/image-stable-diffusion", async () => {
    await delay(900);
    return ok({
      imageUrl: "/mock/text2img_dog_running.jpg",
      format: "url",
      message: "Stable Diffusion 图像生成完成（本地 mock）",
    });
  }),

  http.post("/api/generate/model-scope", async () => {
    await delay(1000);
    return ok({
      videoUrl: "/mock/sample_video.mp4",
      format: "url",
      message: "ModelScope 文生视频完成（本地 mock）",
    });
  }),

  http.post("/api/generate/t2v", async () => {
    await delay(1000);
    return ok({
      videoUrl: "/mock/sample_video.mp4",
      format: "url",
      message: "文生视频完成（本地 mock）",
    });
  }),

  http.post("/api/generate/i2v", async () => {
    await delay(1000);
    return ok({
      videoUrl: "/mock/rabbit.mp4",
      format: "url",
      message: "图生视频完成（本地 mock）",
    });
  }),

  // 当前页面真实使用的检测接口
  http.post("/api/detect/volc-image-aigc", async () => {
    await delay(700);
    return ok({
      isAIGenerated: true,
      confidence: 0.86,
      reason: "图像存在局部纹理过平滑、边缘细节不一致等 AI 生成特征（本地 mock）。",
    });
  }),

  http.post("/api/detect/universal-fake-detect", async () => {
    await delay(650);
    return ok({
      is_ai_generated: true,
      score: 0.82,
      threshold: 0.5,
      arch: "CLIP ViT-L/14 + linear head",
      message: "UniversalFakeDetect 判定为疑似 AI 生成图像（本地 mock）。",
    });
  }),

  http.post("/api/detect/volc-video-aigc", async () => {
    await delay(850);
    return ok({
      isFake: true,
      confidence: 0.78,
      model: "视频 AI 生成识别（本地 mock）",
      heatmapUrl: "/mock/sample_video.mp4",
      details: {
        segmentRatio: 0.63,
        segmentConclusion: "多个片段存在运动连续性异常和局部纹理闪烁。",
        artifacts: ["运动轨迹不稳定", "帧间细节漂移", "局部纹理闪烁"],
      },
    });
  }),

  http.post("/api/detect/volc-ims", async () => {
    await delay(650);
    return ok({
      safe: false,
      suggestion: "review",
      labels: ["violence", "sensitive"],
      reason: "画面存在可能需要人工复核的风险元素（本地 mock）。",
    });
  }),

  http.post("/api/detect/volc-video-ims", async () => {
    await delay(850);
    return ok({
      safe: false,
      suggestion: "review",
      labels: ["violence"],
      reason: "视频片段中存在疑似暴力动作，建议人工复核（本地 mock）。",
    });
  }),

  // Deepfake 人脸生成
  http.post("/api/generate/deepfake", async () => {
    await delay(1000); // 模拟网络延迟
    return HttpResponse.json({
      success: true,
      imageUrl: "/mock/deepfake_result.jpg",
      message: "生成成功",
    });
  }),

  // 通用图像生成（可在此对接第三方文生图 API，或由真实后端代理）
  http.post("/api/generate/image", async ({ request }) => {
    await delay(1200);
    const body = (await request.json()) as { prompt?: string; size?: string };
    return HttpResponse.json({
      success: true,
      imageUrl: "/mock/text2img_dog_running.jpg",
      format: "url",
      message: `图像生成成功（本地 mock）：${body?.prompt || "默认提示词"}`,
    });
  }),

  // 视频生成
  http.post("/api/generate/video", async ({ request }) => {
    await delay(3000); // 视频生成需要更长时间

    try {
      const body = (await request.json()) as any;
      const prompt = body?.prompt || "";

      // 根据提示词返回不同的视频或使用默认视频
      // 这里可以集成真实的视频生成 API
      return HttpResponse.json({
        success: true,
        videoUrl: "/mock/sample_video.mp4",
        message: `视频生成成功！提示词：${prompt.substring(0, 20)}...`,
        details: {
          duration: body?.duration || "2",
          resolution: "720p",
          fps: 24,
        },
      });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          message: "视频生成失败，请重试",
        },
        { status: 500 },
      );
    }
  }),

  // 虚假内容检测
  http.post("/api/detect/fake", async () => {
    await delay(800);
    return HttpResponse.json({
      success: true,
      isFake: true,
      confidence: 0.873,
      heatmapUrl: "/mock/heatmap.png",
      model: "D3 视频检测模型",
      details: {
        faceRegion: { x: 120, y: 80, width: 200, height: 250 },
        artifacts: ["边缘失真", "光照不一致", "纹理异常"],
      },
    });
  }),

  // 不安全内容检测
  http.post("/api/detect/unsafe", async () => {
    await delay(700);
    return HttpResponse.json({
      success: true,
      violations: ["violence", "sensitive"],
      risk: "high",
      riskScore: 0.85,
      suggestions: ["建议模糊处理人物面部", "移除暴力相关元素", "添加内容警告标识"],
      details: {
        violence: {
          score: 0.92,
          regions: [{ x: 100, y: 150, width: 300, height: 200 }],
        },
        sensitive: {
          score: 0.78,
          regions: [{ x: 250, y: 100, width: 150, height: 180 }],
        },
      },
    });
  }),

  // 文件上传
  http.post("/api/data/upload", async () => {
    await delay(1500);
    return HttpResponse.json({
      success: true,
      fileId: `file_${Date.now()}`,
      status: "success",
      url: "/mock/uploaded_file.jpg",
      message: "上传成功",
    });
  }),

  // 网络爬取
  http.post("/api/data/crawl", async () => {
    await delay(3000);
    return HttpResponse.json({
      success: true,
      taskId: `task_${Date.now()}`,
      status: "completed",
      filesCount: 15,
      message: "爬取完成",
    });
  }),

  // 获取已生成内容列表
  http.get("/api/data/outputs", async () => {
    await delay(500);
    return HttpResponse.json({
      success: true,
      data: [
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
          title: "FOMM 人脸动画 - 表情驱动",
          thumbnailUrl: "/mock/portrait_for_detection.jpg",
          fullUrl: "/mock/rabbit.mp4",
          createdAt: "2024-12-06 11:05:30",
          size: "2.1 MB",
        },
        {
          id: "5",
          type: "video",
          title: "Deepfake 视频合成 - 演讲场景",
          thumbnailUrl: "/mock/fake_ai_image.jpg",
          fullUrl: "/mock/sample_video.mp4",
          createdAt: "2024-12-05 16:45:20",
          size: "24.5 MB",
        },
        {
          id: "6",
          type: "image",
          title: "AI 图像生成 - 科幻场景",
          thumbnailUrl: "/mock/text2img_dog_running.jpg",
          fullUrl: "/mock/text2img_dog_running.jpg",
          createdAt: "2024-12-05 15:30:10",
          size: "3.2 MB",
        },
        {
          id: "7",
          type: "image",
          title: "SimSwap 人脸交换 - 动漫风格",
          thumbnailUrl: "/mock/faceswap_hardcoded_backup.png",
          fullUrl: "/mock/faceswap_hardcoded_backup.png",
          createdAt: "2024-12-05 10:15:33",
          size: "1.9 MB",
        },
        {
          id: "8",
          type: "image",
          title: "FaceShifter 高清合成",
          thumbnailUrl: "/mock/deepfake_result.jpg",
          fullUrl: "/mock/deepfake_result.jpg",
          createdAt: "2024-12-04 18:22:11",
          size: "4.1 MB",
        },
        {
          id: "9",
          type: "video",
          title: "AI 视频 - 自然风光",
          thumbnailUrl: "/mock/safe_nature.jpg",
          fullUrl: "/mock/rabbit.mp4",
          createdAt: "2024-12-04 14:55:40",
          size: "18.3 MB",
        },
        {
          id: "10",
          type: "image",
          title: "AI 图像生成 - 赛博朋克",
          thumbnailUrl: "/mock/fake_ai_image.jpg",
          fullUrl: "/mock/fake_ai_image.jpg",
          createdAt: "2024-12-04 09:30:25",
          size: "2.7 MB",
        },
        {
          id: "11",
          type: "image",
          title: "StarGAN 性别转换效果",
          thumbnailUrl: "/mock/portrait_for_detection.jpg",
          fullUrl: "/mock/portrait_for_detection.jpg",
          createdAt: "2024-12-03 16:18:50",
          size: "2.5 MB",
        },
        {
          id: "12",
          type: "image",
          title: "AI 艺术创作 - 抽象画",
          thumbnailUrl: "/mock/heatmap.png",
          fullUrl: "/mock/heatmap.png",
          createdAt: "2024-12-03 11:42:15",
          size: "3.8 MB",
        },
      ],
    });
  }),

  // 保存生成的内容
  http.post("/api/data/save", async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      message: "内容已保存到内容管理",
      id: `saved_${Date.now()}`,
    });
  }),

  // 获取检测历史记录
  http.get("/api/data/detections", async () => {
    await delay(500);
    return HttpResponse.json({
      success: true,
      data: [
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
        {
          id: "4",
          type: "unsafe",
          filename: "review_content.mp4",
          result: "中风险",
          riskScore: 0.62,
          createdAt: "2024-12-05 18:30:45",
        },
        {
          id: "5",
          type: "fake",
          filename: "deepfake_test.jpg",
          result: "虚假",
          confidence: 0.91,
          createdAt: "2024-12-05 15:22:10",
        },
        {
          id: "6",
          type: "fake",
          filename: "celebrity_video.mp4",
          result: "虚假",
          confidence: 0.88,
          createdAt: "2024-12-05 11:10:33",
        },
        {
          id: "7",
          type: "unsafe",
          filename: "social_post.png",
          result: "低风险",
          riskScore: 0.23,
          createdAt: "2024-12-04 16:45:20",
        },
        {
          id: "8",
          type: "fake",
          filename: "news_image.jpg",
          result: "真实",
          confidence: 0.97,
          createdAt: "2024-12-04 10:30:15",
        },
      ],
    });
  }),
];
