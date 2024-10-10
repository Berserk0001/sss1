"use strict";
/*
 * compress.js
 * A module that compresses an image.
 * compress(request, reply, ReadableStream);
 */
const sharp = require('sharp');
const redirect = require('./redirect');

const sharpStream = _ => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

async function compress(request, reply, input) {
  const format = request.params.webp ? 'webp' : 'jpeg';

  // input.pipe => sharp (The compressor) => Send to reply
  // The following headers:
  // |  Header Name  |            Description            |           Value            |
  // |---------------|-----------------------------------|----------------------------|
  // |x-original-size|Original photo size                |OriginSize                  |
  // |x-bytes-saved  |Saved bandwidth from original photo|OriginSize - Compressed Size|

  try {
    const output = await input
      .pipe(sharpStream()
        .grayscale(request.params.grayscale)
        .toFormat(format, {
          quality: request.params.quality,
          progressive: true,
          optimizeScans: true
        })
        .toBuffer());
      
    _sendResponse(output, request, reply, format);
  } catch (err) {
    return redirect(request, reply);
  }
}

function _sendResponse(output, request, reply, format) {
  const info = { size: output.length }; // Create a mock info object
  reply
    .header('content-type', 'image/' + format)
    .header('content-length', info.size)
    .header('x-original-size', request.params.originSize)
    .header('x-bytes-saved', request.params.originSize - info.size)
    .code(200)
    .send(output);
}

module.exports = compress;
