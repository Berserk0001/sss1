"use strict";
const axios = require("axios");
const pick = require("lodash").pick;
// const { randomMobileUA } = require('./ua1');
//const { randomUserAgent } = require('./ua.js');
const shouldCompress = require("./shouldCompress");
const bypass = require("./bypass");
const redirect = require("./redirect");
const compress = require("./compress8");
const copyHeaders = require("./copyHeaders");

async function proxy(request, reply) {
  let url = request.query.url;

  if (Array.isArray(url)) url = url.join('&url=');
  if (!url) {
    //console.log(`User Agent: ${randomMobileUA()}`);
    return reply.send('bandwidth-hero-proxy');
  }

  url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

  request.params.url = url;
  request.params.webp = !request.query.jpeg;
  request.params.grayscale = request.query.bw != 0;
  request.params.quality = parseInt(request.query.l, 10) || 40;

  let responseStream;

  await axios.get(request.params.url, {
    headers: {
      ...pick(request.headers, ["cookie", "dnt", "referer", "range"]),
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0",
      "x-forwarded-for": request.headers["x-forwarded-for"] || request.ip,
      via: "1.1 bandwidth-hero",
    },
    responseType: 'stream',
    timeout: 10000,
    decompress: false,
    maxRedirects: 4,
  })
  .then(response => {
    if (response.status !== 200) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
    
    responseStream = response.data;
    copyHeaders(response, reply);
    reply.header('content-encoding', 'identity');
    request.params.originType = response.headers['content-type'] || '';
    request.params.originSize = parseInt(response.headers['content-length'], 10) || 0;
    
    responseStream.on('error', (err) => {
      console.error('Stream error:', err);
      redirect(request, reply);
      responseStream.destroy();
    });

    if (shouldCompress(request)) {
      return compress(request, reply, response);
    } else {
      return bypass(request, reply, responseStream);
    }
  })
  .catch(err => {
    console.error('Proxy error:', err.message || err);
    redirect(request, reply);
    if (responseStream) {
      responseStream.destroy();
    }
  });
}

module.exports = proxy;
