#!/usr/bin/env node
'use strict';

const fastify= require('fastify')({ logger: false , trustProxy: true});
const params = require('./src/params');
const proxy = require('./src/proxy');


const PORT = process.env.PORT || 8080;

fastify.get('/', proxy);
fastify.listen({port: PORT });
