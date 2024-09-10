'use strict';

const { HookService } = require('../services/hook.service');

module.exports = async function (fastify, opts) {
  fastify.post('/uploaded', async function (req, res) {
    HookService.hookIFCModelUploaded(req.body.data, req.body.source);
    return req.body;
  });
};
