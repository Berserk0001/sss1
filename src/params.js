"use strict";
const DEFAULT_QUALITY = 40;

async function params(request, reply) {
  let url = request.query.url;
  if (!url) {
    reply.send('bandwidth-hero-proxy');
    return;
  }

  request.params.url = decodeURIComponent(url);
  request.params.webp = !request.query.jpeg;
  request.params.grayscale = request.query.bw != 0;
  request.params.quality = parseInt(request.query.l, 10) || DEFAULT_QUALITY;
}

module.exports = params;
