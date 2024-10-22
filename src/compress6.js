const sharp = require('sharp');
const redirect = require('./redirect');

// Configure sharp worker concurrency and caching
sharp.concurrency(1);
sharp.cache({ memory: 256, items: 2, files: 20 });

async function compress(req, reply, input) {
    const format = 'webp'; // Set output format to WebP

    try {
        // Apply transformations and compress the image directly to buffer
        const output = await input
            .pipe(
                sharp()
                    .grayscale(req.params.grayscale)
                    .toFormat(format, {
                        quality: req.params.quality,
                        effort: 0, // Faster WebP compression
                    })
            )
            .toBuffer();

        // Retrieve metadata (e.g., size) for response headers
        const { size } = await sharp(output).metadata();

        // Send compressed image as the response with headers
        reply
            .header('content-type', `image/${format}`)
            .header('content-length', size)
            .header('x-original-size', req.params.originSize)
            .header('x-bytes-saved', req.params.originSize - size)
            .code(200)
            .send(output);
    } catch (err) {
        console.error('Compression error:', err);
        redirect(req, reply); // Redirect on error
    }
}

module.exports = compress;
