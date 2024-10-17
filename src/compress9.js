const sharp = require('sharp');
const redirect = require('./redirect');

// Configure sharp worker concurrency and caching
const worker = sharp;
worker.concurrency(2);
worker.cache({ memory: 256, items: 2, files: 20 });

async function compress(req, reply, input) {
    const format = 'webp'; // Only use WebP format
    console.log("QUEUE:: ", worker.counters());
    console.log(`[COMPRESS] BEGIN: compressing file`);

    const transform = worker({ unlimited: true })
        .grayscale(req.params.grayscale)
        .toFormat(format, {
            quality: req.params.quality,
            progressive: true,
            optimizeScans: true,
            effort: 0, // Set effort to 0 for faster compression
            smartSubsample: false, // Set chroma subsampling to false
            lossless: false // Lossless compression set to false
        });

    input.pipe(transform)
        .on('error', (err) => {
            console.error('Compression error:', { error: err, requestId: req.id });
            redirect(req, reply);
        })
        .pipe(reply.raw) // Directly pipe the output to the HTTP response
        .on('finish', () => {
            console.log(`[COMPRESS] OK: compressed file sent`);
        });
}

module.exports = compress;
