"use strict";
const got = require("got");
const pick = require("lodash").pick;
const shouldCompress = require("./shouldCompress");
const bypass = require("./bypass");
const redirect = require("./redirect");
const compress = require("./compress4");
const copyHeaders = require("./copyHeaders");

async function proxy(request, reply) {
  let url = request.query.url;

  // Join multiple URLs if needed
  if (Array.isArray(url)) url = url.join('&url=');

  if (!url) {
    return reply.send('bandwidth-hero-proxy');
  }

  // Replace URL pattern for specific case
  url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

  // Set request params
  request.params.url = url;
  request.params.webp = !request.query.jpeg;
  request.params.grayscale = request.query.bw != 0;
  request.params.quality = parseInt(request.query.l, 10) || 40;

  let responseStream;

  try {
    // Fetch the image as a stream
    const response = await got.stream(request.params.url, {
      headers: {
        ...pick(request.headers, ["cookie", "dnt", "referer", "range"]),
        "user-agent": "Bandwidth-Hero Compressor",
        "x-forwarded-for": request.headers["x-forwarded-for"] || request.ip,
        via: "1.1 bandwidth-hero",
      },
      maxRedirects: 4,
    });

    // Proceed only if status code is 200
    if (response.statusCode !== 200) {
      throw new Error(`Unexpected response status: ${response.statusCode}`);
    }

    // Assign the response stream for potential destruction later
    responseStream = response;

    copyHeaders(response, reply);
    reply.header('content-encoding', 'identity');

    request.params.originType = response.headers['content-type'] || '';
    request.params.originSize = parseInt(response.headers['content-length'], 10) || 0;

    // Stream error handling: destroy the stream if errors occur
    responseStream.on('error', (err) => {
      console.error('Stream error:', err);
      responseStream.destroy(); // Destroy the stream on error
      return redirect(request, reply);
    });

    // Check if the response should be compressed
    if (shouldCompress(request)) {
      return compress(request, reply, responseStream); // Send stream to compression
    } else {
      return bypass(request, reply, responseStream); // Ensure bypass is defined or handled
    }

  } catch (err) {
    console.error('Proxy error:', err.message || err);

    // Destroy the response stream if available
    if (responseStream) {
      responseStream.destroy();
    }

    return redirect(request, reply);
  }
}

module.exports = proxy;
