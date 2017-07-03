#!/usr/bin/env node

const SwaggerClient = require('swagger-client');
const _ = require('lodash');
const path = require('path');

const swaggerParsers = {
    '1.2': require('../parsers/1.2'),
    '2.0': require('../parsers/2.0')
};

const file = process.argv[2];
const output = process.argv[3];

if (file.substring(0, 4) !== 'http') {
  const static = require('node-static');
  const filePath = path.resolve(file);
  const folder = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const fileServer = new static.Server(folder);
  require('http').createServer(function (request, response) {
      request.addListener('end', function () {
          fileServer.serve(request, response);
      });
  }).listen(1337);

  url = `http://127.0.0.1:1337/${fileName}`;
}

const client = SwaggerClient(url)
  .then(client => {
    const version = client.spec.swagger;
    if (!_.has(swaggerParsers, version)) {
        throw new Error('Unsupported swagger version - ' + version);
    }
    const response = swaggerParsers[version](client);

    if (output) {
      var fs = require('fs');
      const outputPath = path.resolve(output);
      fs.writeFileSync(outputPath, response);
      console.log(`wrote to ${outputPath}`);
    } else {
      console.log(response);
    }

    process.exit();
  })
  .catch((e) => {
    console.log(`ERROR: ${e.message}`)
    process.exit();
  });
