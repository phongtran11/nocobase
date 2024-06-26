'use strict'

const { HookService } = require("../services/hook.service");

module.exports = async function(fastify, opts) {
    fastify.get('/uploaded', async function (req, res) {
        HookService.hookIFCModelUploaded(req.body);
        return req.body;
    })
}