#!/usr/bin/env node
'use strict';

const cluster = require("cluster");
const os = require("os");

if (cluster.isPrimary) {
  const numClusters = 8;

  console.log(`Primary ${process.pid} is running. Will fork ${numClusters} clusters.`);

  // Fork workers.
  for (let i = 0; i < numClusters; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking another one....`);
    cluster.fork();
  });

  return true;
}
const fastify = require('fastify')({trustProxy: true});
const processRequest = require('./src/proxy3.js'); // Import the default export

const PORT = process.env.PORT || 8080;

// Set up the route
fastify.get('/', async (request, reply) => {
  return processRequest(request, reply);
});

// Start the server

  try {
    fastify.listen({ host: '0.0.0.0', port: PORT });
    console.log(`Listening on ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }



