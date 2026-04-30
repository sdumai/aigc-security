const { config } = require("../config.cjs");
const { imageChat, videoChat } = require("../clients/ark.cjs");
const { AIGC_CONFIDENCE, HTTP_STATUS, JSON_SNIPPET_LENGTH } = require("../constants.cjs");
const {
  VOLC_IMAGE_AIGC_PROMPT,
  VOLC_SAFE_PROMPT,
  VOLC_VIDEO_AIGC_PROMPT,
  VOLC_VIDEO_SAFE_PROMPT,
} = require("../prompts.cjs");
const { extractJsonObject, getErrorMessage, sendBadRequest, sendInternalError, sendJsonError } = require("../utils/http.cjs");
const { resolveImageUrlContentBlock, resolveVideoUrlContentBlock } = require("../utils/media.cjs");

function requireArkApiKey(res, message = "请先配置生成服务密钥（VOLC_ARK_API_KEY）") {
  if (config.ark.apiKey) return false;
  sendInternalError(res, message);
  return true;
}

function requireArkVisionModel(res, message = "请配置 VOLC_ARK_VISION_MODEL（支持图片理解的模型接入点 ID）") {
  if (config.ark.visionModel) return false;
  sendInternalError(res, message);
  return true;
}

function parseArkChatContent(data) {
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function parseArkJsonResponse(response, errorFallback) {
  const data = await response.json();
  if (data.error) {
    return { ok: false, message: data.error.message || data.error.code || errorFallback };
  }
  return { ok: true, data, text: parseArkChatContent(data) };
}

function registerImageAigcRoute(app) {
  app.post("/api/detect/volc-image-aigc", async (req, res) => {
    try {
      if (requireArkApiKey(res)) return;
      if (requireArkVisionModel(res)) return;

      const imageInput = resolveImageUrlContentBlock(req.body);
      if (!imageInput) {
        return sendBadRequest(res, "需要 imageUrl 或 imageBase64");
      }

      const response = await imageChat(imageInput, VOLC_IMAGE_AIGC_PROMPT);
      const parsedResponse = await parseArkJsonResponse(response, "接口错误");
      if (!parsedResponse.ok) {
        return sendInternalError(res, parsedResponse.message);
      }

      res.json(extractJsonObject(parsedResponse.text, { isAIGenerated: false, confidence: 0, reason: "" }));
    } catch (err) {
      console.error("Volc image AIGC error:", err);
      sendInternalError(res, getErrorMessage(err, "请求失败"));
    }
  });
}

function registerUniversalFakeDetectRoute(app) {
  app.post("/api/detect/universal-fake-detect", async (req, res) => {
    try {
      const { imageUrl, imageBase64 } = req.body || {};
      const pyBody = {};
      if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
        pyBody.image_url = imageUrl.trim();
      }
      if (imageBase64 && typeof imageBase64 === "string" && imageBase64.length > 0) {
        pyBody.image_base64 = imageBase64;
      }
      if (!pyBody.image_url && !pyBody.image_base64) {
        return sendJsonError(res, HTTP_STATUS.BAD_REQUEST, "需要 imageUrl 或 imageBase64");
      }

      const ufdRes = await fetch(`${config.localServices.universalFakeDetectUrl}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pyBody),
      });
      const text = await ufdRes.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        return sendJsonError(
          res,
          HTTP_STATUS.BAD_GATEWAY,
          `UniversalFakeDetect 返回非 JSON: ${text.slice(0, JSON_SNIPPET_LENGTH)}`,
        );
      }
      if (!ufdRes.ok) {
        const status =
          ufdRes.status >= HTTP_STATUS.BAD_REQUEST && ufdRes.status < HTTP_STATUS.INTERNAL_SERVER_ERROR
            ? ufdRes.status
            : HTTP_STATUS.BAD_GATEWAY;
        return res.status(status).json(typeof data === "object" && data !== null ? data : { error: text });
      }
      res.json(data);
    } catch (err) {
      console.error("UniversalFakeDetect proxy error:", err);
      sendJsonError(
        res,
        HTTP_STATUS.BAD_GATEWAY,
        err && err.message
          ? `无法连接 UniversalFakeDetect（请确认已启动: cd UniversalFakeDetect && uvicorn api:app --host 0.0.0.0 --port 8008）。${err.message}`
          : "UniversalFakeDetect 代理失败",
      );
    }
  });
}

function registerImageSafetyRoute(app) {
  app.post("/api/detect/volc-ims", async (req, res) => {
    try {
      if (requireArkApiKey(res)) return;
      if (requireArkVisionModel(res, "请配置 VOLC_ARK_VISION_MODEL（支持视觉的模型接入点 ID）")) return;

      const imageInput = resolveImageUrlContentBlock(req.body);
      if (!imageInput) {
        return sendBadRequest(res, "需要 imageUrl 或 imageBase64");
      }

      const response = await imageChat(imageInput, VOLC_SAFE_PROMPT);
      const parsedResponse = await parseArkJsonResponse(response, "接口错误");
      if (!parsedResponse.ok) {
        return sendInternalError(res, parsedResponse.message);
      }

      res.json(extractJsonObject(parsedResponse.text, { safe: true, suggestion: "pass", labels: [], reason: "" }));
    } catch (err) {
      console.error("Volc IMS error:", err);
      sendInternalError(res, getErrorMessage(err, "请求失败"));
    }
  });
}

function registerVideoSafetyRoute(app) {
  app.post("/api/detect/volc-video-ims", async (req, res) => {
    try {
      if (requireArkApiKey(res, "请在 .env.local 中配置 VOLC_ARK_API_KEY 或 VITE_VOLC_ARK_API_KEY")) return;
      if (requireArkVisionModel(res, "请在 .env.local 中配置 VOLC_ARK_VISION_MODEL（支持视频理解的模型接入点 ID，如 ep-xxx）")) {
        return;
      }

      const videoInput = resolveVideoUrlContentBlock(req.body);
      if (!videoInput) {
        return sendBadRequest(res, "需要 videoUrl（公网可访问的视频地址）或 videoBase64（视频 Base64 编码）");
      }

      const response = await videoChat(videoInput, VOLC_VIDEO_SAFE_PROMPT);
      const parsedResponse = await parseArkJsonResponse(response, "接口错误");
      if (!parsedResponse.ok) {
        return sendInternalError(res, parsedResponse.message);
      }

      res.json(extractJsonObject(parsedResponse.text, { safe: true, suggestion: "pass", labels: [], reason: "" }));
    } catch (err) {
      console.error("Volc video IMS error:", err);
      sendInternalError(res, getErrorMessage(err, "请求火山方舟失败"));
    }
  });
}

function buildVideoAigcResult(body, parsedText) {
  let isFake = false;
  let confidence = AIGC_CONFIDENCE.MIN;
  let reason = "";
  const parsed = extractJsonObject(parsedText, null);

  if (parsed) {
    isFake = !!parsed.is_ai_generated;
    confidence = Math.min(AIGC_CONFIDENCE.MAX, Math.max(AIGC_CONFIDENCE.MIN, Number(parsed.confidence) || 0));
    reason = String(parsed.reason || "").trim() || (isFake ? "存在 AI 生成痕迹" : "未发现明显 AI 生成痕迹");
  }

  const hasRisk = isFake || confidence >= AIGC_CONFIDENCE.LOW_RISK_THRESHOLD;
  const segmentConclusion =
    confidence < AIGC_CONFIDENCE.LOW_RISK_THRESHOLD
      ? "无 AI 生成痕迹的常规视频"
      : confidence <= AIGC_CONFIDENCE.HIGH_RISK_THRESHOLD
        ? "含 AI 生成，建议人工二次校验"
        : "大概率为 AI 合成视频";

  return {
    isFake: hasRisk,
    confidence,
    model: "视频 AI 生成识别",
    heatmapUrl: typeof body?.videoUrl === "string" ? body.videoUrl.trim() : undefined,
    details: {
      artifacts: hasRisk ? [segmentConclusion] : [],
      machineLabel: hasRisk ? "生成内容风险" : "正常",
      segmentRatio: confidence,
      segmentConclusion: reason || segmentConclusion,
    },
  };
}

function registerVideoAigcRoute(app) {
  app.post("/api/detect/volc-video-aigc", async (req, res) => {
    try {
      if (requireArkApiKey(res, "请先配置生成服务密钥")) return;
      if (requireArkVisionModel(res, "请配置 VOLC_ARK_VISION_MODEL（支持视频理解的模型接入点 ID）")) return;

      const videoInput = resolveVideoUrlContentBlock(req.body);
      if (!videoInput) {
        return sendBadRequest(res, "需要 videoUrl（公网可访问）或 videoBase64");
      }

      const response = await videoChat(videoInput, VOLC_VIDEO_AIGC_PROMPT);
      const parsedResponse = await parseArkJsonResponse(response, "视频理解接口错误");
      if (!parsedResponse.ok) {
        return sendInternalError(res, parsedResponse.message);
      }

      res.json(buildVideoAigcResult(req.body, parsedResponse.text));
    } catch (err) {
      console.error("Volc video AIGC error:", err);
      sendInternalError(res, getErrorMessage(err, "视频 AI 生成检测失败"));
    }
  });
}

function registerDetectRoutes(app) {
  registerImageAigcRoute(app);
  registerUniversalFakeDetectRoute(app);
  registerImageSafetyRoute(app);
  registerVideoSafetyRoute(app);
  registerVideoAigcRoute(app);
}

module.exports = {
  registerDetectRoutes,
};
