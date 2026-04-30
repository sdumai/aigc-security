function toImageDataUrl(value, mimeType = "image/jpeg") {
  const input = typeof value === "string" ? value.trim() : "";
  if (!input) return "";
  return input.startsWith("data:") ? input : `data:${mimeType};base64,${input}`;
}

function toVideoDataUrl(value, mimeType = "video/mp4") {
  const input = typeof value === "string" ? value.trim() : "";
  if (!input) return "";
  return input.startsWith("data:") ? input : `data:${mimeType};base64,${input}`;
}

function normalizeVolcBase64Image(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").replace(/\s/g, "");
}

function stripSimpleImageDataUrl(value) {
  return String(value || "").replace(/^data:image\/\w+;base64,/, "");
}

function normalizeVolcGeneratedImageUrl(value) {
  const image = typeof value === "string" ? value.trim() : "";
  if (!image) return "";
  if (/^https?:\/\//i.test(image) || image.startsWith("data:")) return image;
  return `data:image/jpeg;base64,${image.replace(/\s/g, "")}`;
}

function extractVolcGeneratedImage(data) {
  const payload = data?.data || data?.Result || data?.result || {};
  const image =
    payload.image ||
    payload.Image ||
    (Array.isArray(payload.binary_data_base64) ? payload.binary_data_base64[0] : "") ||
    (Array.isArray(payload.image_urls) ? payload.image_urls[0] : "");

  return normalizeVolcGeneratedImageUrl(image);
}

function normalizeModelScopeVideoUrl(value) {
  const video = String(value || "").trim();
  if (!video) return video;
  if (video.startsWith("http://") || video.startsWith("https://") || video.startsWith("data:")) return video;
  return `data:video/mp4;base64,${video.replace(/\s/g, "")}`;
}

function resolveImageUrlContentBlock(body) {
  const { imageUrl, imageBase64 } = body || {};
  if (imageUrl && typeof imageUrl === "string") {
    return { type: "image_url", image_url: { url: imageUrl.trim() } };
  }
  if (imageBase64 && typeof imageBase64 === "string") {
    return { type: "image_url", image_url: { url: toImageDataUrl(imageBase64) } };
  }
  return null;
}

function resolveVideoUrlValue(body) {
  const { videoUrl, videoBase64 } = body || {};
  let videoUrlValue = typeof videoUrl === "string" ? videoUrl.trim() : "";
  if (!videoUrlValue && typeof videoBase64 === "string" && videoBase64.length > 0) {
    videoUrlValue = toVideoDataUrl(videoBase64);
  }
  return videoUrlValue;
}

function resolveVideoUrlContentBlock(body) {
  const url = resolveVideoUrlValue(body);
  if (!url) return null;

  const fps = Number(body?.fps);
  const videoUrl = { url };
  if (Number.isFinite(fps) && fps >= 0.2 && fps <= 5) {
    videoUrl.fps = fps;
  }

  return { type: "video_url", video_url: videoUrl };
}

function createReferenceImageContent(imageBase64List) {
  const list = Array.isArray(imageBase64List) ? imageBase64List : [];
  return list
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .map((value) => ({
      type: "image_url",
      image_url: { url: toImageDataUrl(value) },
      role: "reference_image",
    }));
}

function createImageToVideoContent(imageBase64List, mode = "reference") {
  const list = Array.isArray(imageBase64List) ? imageBase64List : [];
  const normalizedList = list.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean);

  if (mode === "first-frame") {
    return normalizedList.slice(0, 1).map((value) => ({
      type: "image_url",
      image_url: { url: toImageDataUrl(value) },
      role: "first_frame",
    }));
  }

  if (mode === "first-last-frame") {
    return normalizedList.slice(0, 2).map((value, index) => ({
      type: "image_url",
      image_url: { url: toImageDataUrl(value) },
      role: index === 0 ? "first_frame" : "last_frame",
    }));
  }

  return normalizedList.map((value) => ({
    type: "image_url",
    image_url: { url: toImageDataUrl(value) },
    role: "reference_image",
  }));
}

module.exports = {
  createImageToVideoContent,
  createReferenceImageContent,
  extractVolcGeneratedImage,
  normalizeModelScopeVideoUrl,
  normalizeVolcBase64Image,
  normalizeVolcGeneratedImageUrl,
  resolveImageUrlContentBlock,
  resolveVideoUrlContentBlock,
  resolveVideoUrlValue,
  stripSimpleImageDataUrl,
  toImageDataUrl,
  toVideoDataUrl,
};
