const sharp = require('sharp');
const redirect = require('./redirect');

// Configure sharp worker concurrency and cache
sharp.concurrency(1);
sharp.cache({ memory: 256, items: 2, files: 20 });

// Define the sharpStream function
const sharpStream = () => sharp({ animated: false, unlimited: true });

async function compress(req, reply, input) {
    const format = 'webp'; // Set output format to WebP

    try {
        // Use sharpStream to create a new sharp instance and apply transformations
        const output = await input
            .pipe(
                sharpStream() // Using the sharpStream function
                    .grayscale(req.params.grayscale) // Apply grayscale if specified
                    .toFormat(format, {               // Convert image to WebP format
                        quality: req.params.quality,   // Set the quality for compression
                        effort: 0,                     // Use effort=0 for faster compression
                    })
            )
            .toBuffer();  // Convert the transformed image to a buffer

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
