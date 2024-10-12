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

    let info;
    let chunks = [];
    let totalBytes = 0;

    try {
        // Pipe the input stream to sharp for transformation
        input.pipe(transform);

        // Handle the transformed output stream from sharp
        for await (const chunk of transform) {
            chunks.push(chunk);
            totalBytes += chunk.length;
        }

        const output = Buffer.concat(chunks);
        info = await sharp(output).metadata();

        // Set headers and send the response using Fastify's reply object
        reply
            .header('content-type', 'image/' + format)
            .header('content-length', totalBytes)
            .header('x-original-size', req.params.originSize)
            .header('x-bytes-saved', req.params.originSize - totalBytes)
            .code(200)
            .send(output);
    } catch (err) {
        console.error('Compression error:', err);
        return redirect(req, reply);
    }
}

module.exports = compress;
