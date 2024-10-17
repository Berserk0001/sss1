const http = require('http');
const fastify = require('fastify')({ logger: true });
const proxy = require('./proxy4'); // Your proxy function

fastify.get('/', proxy);

http.createServer(fastify).listen(80, (err) => {
  if (err) {
    console.error('Error starting HTTP server:', err);
    process.exit(1);
  }
  console.log('HTTP Server running on port 80');
});
