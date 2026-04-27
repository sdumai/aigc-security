const { config } = require("../config.cjs");
const { CONTENT_TYPE, JSON_SNIPPET_LENGTH, VISUAL_RAW_SNIPPET_LENGTH, VOLC_VISUAL } = require("../constants.cjs");
const { getXDate, hash, queryToString, sign } = require("./volcSigner.cjs");

async function visualCvRequest(action, bodyObj) {
  const bodyString = JSON.stringify(bodyObj);
  const bodySha = hash(bodyString);
  const xDate = getXDate();
  const pathName = "/";
  const query = { Action: action, Version: VOLC_VISUAL.VERSION };
  const authorization = sign({
    method: "POST",
    pathName,
    query,
    headers: { "X-Date": xDate },
    accessKeyId: config.volc.accessKey,
    secretAccessKey: config.volc.secretKey,
    bodySha,
    host: config.volc.visualHost,
    service: config.volc.service,
    region: config.volc.region,
    contentType: CONTENT_TYPE.JSON,
  });
  const url = `https://${config.volc.visualHost}?${queryToString(query)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": CONTENT_TYPE.JSON,
      "X-Date": xDate,
      "X-Content-Sha256": bodySha,
      Host: config.volc.visualHost,
      Authorization: authorization,
    },
    body: bodyString,
  });
  const rawText = await response.text();
  let data;

  try {
    data = JSON.parse(rawText);
  } catch (e) {
    return { ok: false, code: 0, message: "响应非 JSON", raw: rawText?.slice(0, VISUAL_RAW_SNIPPET_LENGTH) };
  }

  if (!response.ok) {
    const message = data.message || data.ResponseMetadata?.Error?.Message || data.error?.message || rawText?.slice(0, JSON_SNIPPET_LENGTH);
    return {
      ok: false,
      code: data.code,
      message,
      request_id: data.request_id || data.ResponseMetadata?.RequestId,
    };
  }

  return { ok: true, data, code: data.code, message: data.message };
}

function getVolcResponseError(data, fallback) {
  const responseError = data?.ResponseMetadata?.Error;
  return responseError?.Message || responseError?.Code || data?.message || data?.error?.message || fallback;
}

module.exports = {
  getVolcResponseError,
  visualCvRequest,
};
