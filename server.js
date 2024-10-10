#!/usr/bin/env node
'use strict';

const fastify = require('fastify')({ logger: true });
const params = require('./src/params');
const proxy = require('./src/proxy');



// Route for proxying
fastify.get('/', async (request, reply) => {
  await params(request, reply);
  await proxy(request, reply);
  reply.send();
});

// Favicon route (Fastify automatically handles favicon requests, but here's how you can handle it)
fastify.get('/favicon.ico', async (request, reply) => {
  reply.code(204).send();
});

// Start server
const PORT = process.env.PORT || 8080;
fastify.listen({ port: PORT }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Worker ${process.pid}: Listening on ${address}`);
});
