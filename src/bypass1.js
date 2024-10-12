"use strict";

function bypass(req, reply, inputStream) {
  inputStream.pipe(reply.raw); // Pipe the original stream directly to the client
}

module.exports= bypass;
