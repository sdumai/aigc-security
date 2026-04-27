const { HTTP_STATUS, JSON_SNIPPET_LENGTH } = require("../constants.cjs");

function sendJsonError(res, status, message) {
  return res.status(status).json({ error: message });
}

function sendBadRequest(res, message) {
  return sendJsonError(res, HTTP_STATUS.BAD_REQUEST, message);
}

function sendInternalError(res, message) {
  return sendJsonError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
}

function getErrorMessage(error, fallback) {
  return error && error.message ? error.message : fallback;
}

function extractJsonObject(text, fallback) {
  try {
    const jsonMatch = String(text || "").match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (_) {}
  return fallback;
}

function parseJsonOrError(text, status, serviceName) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (_) {
    return {
      ok: false,
      message: String(text || "").slice(0, JSON_SNIPPET_LENGTH) || `${serviceName} 返回非 JSON（${status}）`,
    };
  }
}

function formatFastApiError(data, status, fallbackPrefix) {
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || String(item)).join("；");
  return data?.error || `${fallbackPrefix} ${status}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clampInteger(value, { min, max, fallback }) {
  let numericValue = Number(value);
  if (!Number.isFinite(numericValue)) numericValue = fallback;
  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

module.exports = {
  clampInteger,
  extractJsonObject,
  formatFastApiError,
  getErrorMessage,
  parseJsonOrError,
  sendBadRequest,
  sendInternalError,
  sendJsonError,
  sleep,
};
