const sharp = require('sharp');
const redirect = require('./redirect');

async function compress(req, reply, input) {
    const format = req.params.webp ? 'webp' : 'jpeg';
    const transform = sharp()
        .grayscale(req.params.grayscale)
        .toFormat(format, {
            quality: req.params.quality,
            progressive: true,
            optimizeScans: true,
        });

    try {
        // Pipe the input stream to sharp for transformation and then use sharp.toBuffer() to get the final buffer
        const output = await input.pipe(transform).toBuffer();
        const info = await sharp(output).metadata(); // Get metadata like file size, etc.

        // Set headers and send the response using Fastify's reply object
        reply
            .header('content-type', 'image/' + format)
            .header('content-length', info.size)
            .header('x-original-size', req.params.originSize)
            .header('x-bytes-saved', req.params.originSize - info.size)
            .code(200)
            .send(output);
    } catch (err) {
        console.error('Compression error:', err);
        return redirect(req, reply);
    }
}

module.exports = compress;
