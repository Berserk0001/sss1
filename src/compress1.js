"use strict";
const sharp = require("sharp");
const { PassThrough } = require("stream");
const redirect = require("./redirect");

async function compress(request, reply, input) {
    const format = request.params.webp ? "webp" : "jpeg";

    try {
        // Create a Sharp instance with desired options
        const sharpInstance = sharp()
            .grayscale(request.params.grayscale)
            .toFormat(format, {
                quality: request.params.quality,
                progressive: true,
                optimizeScans: true
            });

        // Create a pass-through stream to track compressed size
        const passThrough = new PassThrough();
        let compressedSize = 0;

        // Track the size of the compressed image
        passThrough.on("data", (chunk) => {
            compressedSize += chunk.length;
        });

        // Set headers before starting to stream the image
        reply
            .header("content-type", "image/" + format)
            .header("x-original-size", request.params.originSize)
            .header("content-encoding", "identity"); // Disable content encoding to handle streams

        // Pipe the input stream through Sharp for compression and then to the client
        input.pipe(sharpInstance).pipe(passThrough).pipe(reply.raw);

        // Once the stream is finished, calculate and send `x-bytes-saved`
        passThrough.on("finish", () => {
            const bytesSaved = request.params.originSize - compressedSize;
            reply.header("x-bytes-saved", bytesSaved);
        });
    } catch (error) {
        return redirect(request, reply);
    }
}

module.exports = compress;
