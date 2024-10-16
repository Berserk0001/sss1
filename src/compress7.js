const sharp = require('sharp');
const redirect = require('./redirect');

// Configure sharp worker concurrency and caching
const worker = sharp;
worker.concurrency(1); // Limits to 1 concurrent operation
worker.cache({ memory: 256, items: 2, files: 20 }); // Cache settings

async function compress(req, reply, input) {
    const format = 'webp'; // Only use WebP format

    // Log the current state of the worker queue and the start of compression
    console.log("QUEUE:: ", worker.counters());
    console.log(`[COMPRESS] BEGIN: compressing file`);

    // Pipe the input stream into sharp and apply transformations
    input.pipe(worker().grayscale(req.params.grayscale).toFormat(format, {
        quality: req.params.quality,
        progressive: true,
        optimizeScans: true,
        effort: 1, // Use effort=1 for faster WebP compression
        smartSubsample: true, // WebP specific option for better chroma subsampling
        lossless: false // Lossless compression set to false
    })).toBuffer((err, output, info) => {
        if (err || !info || reply.sent) {
            console.error('Compression error or missing info:', err);
            return redirect(req, reply); // Redirect on error or if response already sent
        }
      console.log(`[COMPRESS] OK: compressed file sent`)

        // Set headers and send the compressed image as a response
        reply
            .header('content-type', `image/${format}`)
            .header('content-length', info.size)
            .header('x-original-size', req.params.originSize)
            .header('x-bytes-saved', req.params.originSize - info.size)
            .code(200)
            .send(output);
    });
}

module.exports = compress;
