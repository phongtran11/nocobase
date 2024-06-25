'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return { ifc: true }
  })

  fastify.register(require('./hook.routes'), {prefix: 'hook'})
}
