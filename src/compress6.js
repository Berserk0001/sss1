const sharp = require('sharp');
const redirect = require('./redirect');

// Configure sharp worker concurrency and caching
const worker = sharp;
worker.concurrency(1); // Limits to 1 concurrent operation
worker.cache({ memory: 256, items: 2, files: 20 }); // Cache settings

async function compress(req, reply, input) {
    const format = 'webp'; // Only use WebP format

    // Initialize sharp transformation with grayscale option and WebP format
    const transform = worker()
        .grayscale(req.params.grayscale)
        .toFormat(format, {
            quality: req.params.quality,
            progressive: true,
            optimizeScans: true,
            effort: 1, // Use effort=1 for faster WebP compression
            smartSubsample: true, // WebP specific option for better chroma subsampling
            lossless: false // Lossless compression set to false
        });

    try {
        // Pipe the input stream into sharp, apply transformations, and convert to buffer
        const output = await input.pipe(transform).toBuffer();
        const metadata = await sharp(output).metadata(); // Retrieve metadata like file size

       /* // If the image dimensions exceed WebP limits (16383 x 16383), handle accordingly
        if (metadata.height > 16383 || metadata.width > 16383) {
            console.error('Image dimensions exceed WebP limits.');
            return redirect(req, reply); // Redirect if the image is too large
        }*/

        // Log the current state of the worker queue
        console.log("QUEUE:: ", worker.counters());
        console.log(`[COMPRESS] BEGIN: compressing file ${req.path}`);

        // Set headers and send the compressed image as a response
        reply
            .header('content-type', `image/${format}`)
            .header('content-length', metadata.size)
            .header('x-original-size', req.params.originSize)
            .header('x-bytes-saved', req.params.originSize - metadata.size)
            .code(200)
            .send(output);

        console.log(`[COMPRESS] OK: compressed file sent ${req.path}`);
    } catch (err) {
        console.error('Compression error:', err);
        return redirect(req, reply); // Redirect on error
    }
}

module.exports = compress;
