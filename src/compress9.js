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

    try {
        // Create the transform stream by piping the input through sharp
        const transformStream = input.pipe(worker({ unlimited: true })
            .grayscale(req.params.grayscale)
            .toFormat(format, {
                quality: req.params.quality,
                progressive: true,
                optimizeScans: true,
                effort: 0, // Set effort to 0 for faster compression
                smartSubsample: false, // Set chroma subsampling to false
                lossless: false // Lossless compression set to false
            }));

        // Stream the transformed image directly to the HTTP response
        transformStream
            .on('info', (info) => {
                // Set headers using metadata from the info event
                reply
                    .header('content-type', `image/${format}`)
                    .header('content-length', info.size)
                    .header('x-original-size', req.params.originSize)
                    .header('x-bytes-saved', req.params.originSize - info.size);
            })
            .on('error', (err) => {
                console.error('Compression error:', err);
                return redirect(req, reply); // Redirect on error
            })
            .pipe(reply.raw); // Pipe the final image output directly to the client

        console.log(`[COMPRESS] OK: compressed file sent ${req.path}`);
    } catch (err) {
        console.error('Compression error:', err);
        return redirect(req, reply); // Redirect on error
    }
}

module.exports = compress;
