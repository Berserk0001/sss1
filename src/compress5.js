"use strict";
const sharp = require('sharp');
const redirect = require('./redirect');

function compress(request, reply, input) {
    const format = request.params.webp ? 'webp' : 'jpeg';

    // Create a sharp pipeline to process the image
    const pipeline = sharp()
        .toFormat(format, {
            quality: request.params.quality,
            progressive: true,
            optimizeScans: true,
        });

    

    // Use the input stream to pipe into the sharp pipeline and convert it to a buffer
    input.pipe(pipeline)
        .toBuffer((err, outputBuffer, info) => {
            if (err) {
                console.error('Buffer conversion error:', err);
                return redirect(request, reply); // Redirect on error
            }

            // Set headers based on output info
            reply
            .header('content-type', 'image/' + format)
            .header('content-length', info.size)
            .header('x-original-size', request.params.originSize)
            .header('x-bytes-saved', request.params.originSize - info.size)
            .code(200)
            .send(outputBuffer); // Send the processed image as the response
        });
}

module.exports = compress;
