'use strict'

module.exports = async function(fastify, opts) {
    fastify.post('/uploaded', async function (req, res) {
        console.log(req.body)
        return req.body;
    })
}