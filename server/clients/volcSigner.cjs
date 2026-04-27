const crypto = require("crypto");
const { config } = require("../config.cjs");

function getXDate() {
  return new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function hmac(secret, value) {
  return crypto.createHmac("sha256", secret).update(value, "utf8").digest();
}

function hash(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function uriEscape(value) {
  try {
    return encodeURIComponent(String(value))
      .replace(/[^A-Za-z0-9_.~\-%]+/g, encodeURIComponent)
      .replace(/[*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  } catch (e) {
    return "";
  }
}

function queryToString(params) {
  return Object.keys(params)
    .sort()
    .map((key) => {
      const value = params[key];
      if (value === undefined || value === null) return undefined;
      return `${uriEscape(key)}=${uriEscape(value)}`;
    })
    .filter(Boolean)
    .join("&");
}

function sign(params) {
  const {
    method = "GET",
    pathName = "/",
    query = {},
    headers = {},
    accessKeyId = "",
    secretAccessKey = "",
    bodySha,
    host = config.volc.cvHost,
    service = config.volc.service,
    region = config.volc.region,
    contentType,
  } = params;
  const datetime = headers["X-Date"] || getXDate();
  const date = datetime.substring(0, 8);
  const bodyShaHex = bodySha || hash("");
  let signedHeaderKeys;
  let canonicalHeaders;

  if (contentType && bodySha) {
    signedHeaderKeys = "content-type;host;x-content-sha256;x-date";
    canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-content-sha256:${bodyShaHex}\nx-date:${datetime}\n`;
  } else {
    signedHeaderKeys = "host;x-date";
    canonicalHeaders = `host:${host}\nx-date:${datetime}\n`;
  }

  const canonicalRequest = [
    method.toUpperCase(),
    pathName,
    queryToString(query) || "",
    canonicalHeaders,
    signedHeaderKeys,
    bodyShaHex,
  ].join("\n");
  const credentialScope = [date, region, service, "request"].join("/");
  const stringToSign = ["HMAC-SHA256", datetime, credentialScope, hash(canonicalRequest)].join("\n");
  const kDate = hmac(secretAccessKey, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "request");
  const signature = hmac(kSigning, stringToSign).toString("hex");

  return [
    "HMAC-SHA256",
    `Credential=${accessKeyId}/${credentialScope},`,
    `SignedHeaders=${signedHeaderKeys},`,
    `Signature=${signature}`,
  ].join(" ");
}

module.exports = {
  getXDate,
  hash,
  queryToString,
  sign,
};
