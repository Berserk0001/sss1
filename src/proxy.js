"use strict";
const axios = require("axios");
const pick = require("lodash").pick;
const shouldCompress = require("./shouldCompress");
const redirect = require("./redirect");
const compress = require("./compress");
const copyHeaders = require("./copyHeaders");

async function proxy(request, reply) {
  // Redirect if the request is from the Bandwidth-Hero extension itself
  if (request.headers["via"] === "1.1 bandwidth-hero" && ["127.0.0.1", "::1"].includes(request.headers["x-forwarded-for"] || request.ip)) {
    return redirect(request, reply);
  }

  try {
    const response = await axios.get(request.params.url, {
      headers: {
        ...pick(request.headers, ["cookie", "dnt", "referer", "range"]),
        "user-agent": "Bandwidth-Hero Compressor",
        "x-forwarded-for": request.headers["x-forwarded-for"] || request.ip,
        via: "1.1 bandwidth-hero",
      },
      maxRedirects: 4, // Handle up to 4 redirects
      responseType: 'stream', // Ensure we receive a stream for the body
    });

    _onRequestResponse(response, request, reply);
  } catch (err) {
    _onRequestError(request, reply, err);
  }
}

function _onRequestError(request, reply, err) {
  if (err.response && err.response.status === 400) {
    return reply.code(400).send("Invalid URL");
  }

  redirect(request, reply);
  console.error(err);
}

function _onRequestResponse(response, request, reply) {
  if (response.status >= 400 || (response.status >= 300 && response.headers.location)) {
    return redirect(request, reply);
  }

  copyHeaders(response, reply);
  reply.header("content-encoding", "identity");
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Cross-Origin-Resource-Policy", "cross-origin");
  reply.header("Cross-Origin-Embedder-Policy", "unsafe-none");
  request.params.originType = response.headers["content-type"] || "";
  request.params.originSize = response.headers["content-length"] || "0";

  if (shouldCompress(request)) {
    return compress(request, reply, response.data);
  } else {
    reply.header("x-proxy-bypass", 1);
    ["accept-ranges", "content-type", "content-length", "content-range"].forEach((headerName) => {
      if (headerName in response.headers) reply.header(headerName, response.headers[headerName]);
    });

    // Using reply.send to handle the stream
    return reply.send(response.data); // Fastify manages the stream here
  }
}

module.exports = proxy;
