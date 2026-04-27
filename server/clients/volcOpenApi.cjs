const { config } = require("../config.cjs");
const { CONTENT_TYPE } = require("../constants.cjs");
const { getXDate, hash, queryToString, sign } = require("./volcSigner.cjs");

async function signedFormRequest(query, bodyParams) {
  const bodyString = bodyParams.toString();
  const bodySha = hash(bodyString);
  const xDate = getXDate();
  const authorization = sign({
    method: "POST",
    pathName: "/",
    query,
    headers: { "X-Date": xDate },
    host: config.volc.cvHost,
    accessKeyId: config.volc.accessKey,
    secretAccessKey: config.volc.secretKey,
    bodySha,
  });
  const url = `https://${config.volc.cvHost}/?${queryToString(query)}`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": CONTENT_TYPE.FORM_URLENCODED,
      "X-Date": xDate,
      Host: config.volc.cvHost,
      Authorization: authorization,
    },
    body: bodyString,
  });
}

module.exports = {
  signedFormRequest,
};
