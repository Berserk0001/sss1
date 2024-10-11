"use strict";
/*
 * compress.js
 * A module that compresses an image.
 * compress(request, reply, ReadableStream);
 */
const sharp = require('sharp');
const redirect = require('./redirect');

async function compress(request, reply, input) {
    const format = request.params.webp ? 'webp' : 'jpeg';

    try {
        const sharpInstance = sharp()
            .grayscale(request.params.grayscale)
            .toFormat(format, {
                quality: request.params.quality,
                progressive: true,
                optimizeScans: true
            });

        // Set the necessary headers for the response
        reply
            .header('content-type', 'image/' + format)
            .header('x-original-size', request.params.originSize)
            .header('content-encoding', 'identity'); // Prevent content encoding issues when streaming

        // Stream the input directly through sharp and pipe the output to the client
        input.pipe(sharpInstance).pipe(reply.raw);  // `reply.raw` is the underlying raw response stream
    } catch (error) {
        // Redirect in case of an error during the compression process
        return redirect(request, reply);
    }
}

module.exports = compress;
