'use strict';

require('module-alias/register');
const path = require('node:path');
const AutoLoad = require('@fastify/autoload');
const global = require('@cores/global');

// Pass --options via CLI arguments in command to enable these options.
const options = {};

module.exports = async function (fastify, opts) {
  // Place here your custom code!
  fastify.register(require('@fastify/postgres'), {
    name: 'BimMetro',
    connectionString: 'postgres://nocobase:nocobase@postgres/BimMetro',
  });

  fastify.register(require('@fastify/postgres'), {
    name: 'BIM_KIEN_GIANG',
    connectionString: 'postgres://nocobase:nocobase@postgres/BIM_KIEN_GIANG',
  });

  // Load Ifc module
  fastify.register(require('./modules/ifc/routes/index.routes'), { prefix: '/ifc' });

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts),
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts),
  });

  global.fastify = fastify;
};

module.exports.options = options;
