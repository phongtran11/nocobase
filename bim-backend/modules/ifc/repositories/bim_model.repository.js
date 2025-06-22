const { fastify } = require('@cores/global');

class BimModelRepository {
    /**
     * 
     * @param {*} source 
     * @param {*} modelId 
     * @param {*} status BIM_MODEL_STATUS
     * @returns 
     */
    static async updateModelStatus(source, modelId, status) {
        return await fastify.pg[source].transact(async (client) => {
            const sql = `UPDATE bim_models SET status = $1 WHERE id = $2`
            await client.query(sql, [modelId, status])
        })
    }
}

module.exports = {BimModelRepository}