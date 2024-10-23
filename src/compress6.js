const sharp = require('sharp');
const redirect = require('./redirect');

// Configure sharp worker concurrency and cache settings
sharp.concurrency(1);
sharp.cache({ memory: 256, items: 2, files: 20 });

// Define sharpStream function for reusability
const sharpStream = () => sharp({ animated: false, unlimited: true });

async function compress(req, reply, input) {
    const format = 'webp'; // Set the output format to WebP

    try {
        // Create a sharp instance and apply transformations
        const transform = sharpStream()
            .grayscale(req.params.grayscale) // Apply grayscale if specified
            .toFormat(format, {               // Convert image to WebP format
                quality: req.params.quality,   // Set the quality for compression
                effort: 0,                     // Use effort=0 for faster compression
            })
            .withMetadata();                   // Add image metadata to the output

        // Pipe the input stream through the transform, then collect it into a buffer
        const output = await transform.toBuffer();

        // Send compressed image as the response with appropriate headers
        reply
            .header('content-type', `image/${format}`)
            .header('content-length', output.length) // Use output buffer's length directly
            .header('x-original-size', req.params.originSize)
            .header('x-bytes-saved', req.params.originSize - output.length) // Calculate bytes saved
            .code(200)
            .send(output);
    } catch (err) {
        console.error('Compression error:', err);
        redirect(req, reply); // Redirect on error
    }
}

module.exports = compress;
